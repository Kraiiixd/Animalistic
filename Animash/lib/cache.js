// Cache in-memory sederhana dengan TTL — tanpa dependency tambahan.
// Satu instance dipakai bersama, jadi juga tetap hidup di warm state serverless (Vercel).
class TTLCache {
    constructor(maxSize = 500) {
        this.store = new Map()
        this.maxSize = maxSize
        // Untuk remember(): nilai + batas "segar" + batas "basi masih boleh dipakai"
        this.memo = new Map()
        this.pending = new Map()
        this.remember = this.remember.bind(this) // aman dipakai lewat destructuring
    }

    get(key) {
        const hit = this.store.get(key)
        if (!hit) return null
        if (Date.now() > hit.expires) {
            this.store.delete(key)
            return null
        }
        return hit.value
    }

    set(key, value, ttlMs) {
        if (this.store.size >= this.maxSize) {
            // Map menyimpan urutan insert — buang entry paling lama
            this.store.delete(this.store.keys().next().value)
        }
        this.store.set(key, { value, expires: Date.now() + ttlMs })
    }

    /**
     * Ambil dari cache, atau jalankan fn() lalu simpan selama ttlSec detik.
     * - Bila fn() gagal (throw) dan masih ada nilai lama yang belum lewat
     *   ttlSec + staleFor, nilai lama itu yang dipakai (sumber sedang gangguan).
     * - Hasil kosong (null / array kosong) hanya disimpan 60 detik supaya
     *   cepat dicoba ulang.
     * - Panggilan bersamaan untuk key yang sama digabung jadi satu request.
     */
    async remember(key, ttlSec, fn, { staleFor = 0 } = {}) {
        const now = Date.now()
        const hit = this.memo.get(key)
        if (hit && now < hit.fresh) return hit.value
        if (this.pending.has(key)) return this.pending.get(key)

        const job = (async () => {
            try {
                const value = await fn()
                const empty = value == null || (Array.isArray(value) && value.length === 0)
                if (empty && hit && now < hit.stale) return hit.value
                const ttlMs = (empty ? Math.min(ttlSec, 60) : ttlSec) * 1000
                if (this.memo.size >= this.maxSize && !this.memo.has(key)) {
                    this.memo.delete(this.memo.keys().next().value)
                }
                this.memo.set(key, { value, fresh: Date.now() + ttlMs, stale: Date.now() + ttlMs + staleFor * 1000 })
                return value
            } catch (err) {
                if (hit && now < hit.stale) return hit.value
                throw err
            } finally {
                this.pending.delete(key)
            }
        })()
        this.pending.set(key, job)
        return job
    }

    clear() {
        this.store.clear()
        this.memo.clear()
        this.pending.clear()
    }
}

module.exports = new TTLCache()
