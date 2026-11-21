// Koneksi PostgreSQL. Aktif hanya jika DATABASE_URL diset —
// tanpa env itu situs PUBLIK tetap jalan normal (mode tanpa DB),
// hanya fitur akun/EXP/admin yang nonaktif.
//
// DATABASE_URL=pg-mem  -> database in-memory (pg-mem, devDependency) untuk
// pengujian otomatis & demo lokal. Data hilang saat proses berhenti.
const { Pool } = require('pg')

let pool = null

function enabled() {
    return Boolean(process.env.DATABASE_URL)
}

function isMemory() {
    return process.env.DATABASE_URL === 'pg-mem'
}

function createMemoryPool() {
    const { newDb } = require('pg-mem')
    const mem = newDb({ autoCreateForeignKeyIndices: true })
    const { Pool: MemPool } = mem.adapters.createPg()
    return new MemPool()
}

function getPool() {
    if (!enabled()) return null
    if (!pool) {
        pool = isMemory() ? createMemoryPool() : new Pool({
            connectionString: process.env.DATABASE_URL,
            // Kebanyakan Postgres managed (Neon, Supabase) butuh SSL
            ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        })
    }
    return pool
}

async function q(text, params) {
    const p = getPool()
    if (!p) throw new Error('DATABASE_URL belum diset — fitur database nonaktif')
    return p.query(text, params)
}

// Khusus pengujian: buang pool supaya tiap suite mulai dari DB kosong
function resetForTests() {
    pool = null
}

module.exports = { q, enabled, getPool, isMemory, resetForTests }
