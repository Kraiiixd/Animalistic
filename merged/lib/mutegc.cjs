/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

// lib/mutegc.cjs — tutup grup (hanya admin yang bisa kirim pesan), opsional otomatis dibuka lagi setelah durasi tertentu.

const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, 'database', 'mutegc.json')
let sock = null
let timer = null

function read() {
    try { const d = JSON.parse(fs.readFileSync(FILE, 'utf8')); return d && typeof d === 'object' ? d : {} } catch { return {} }
}
function write(d) {
    fs.mkdirSync(path.dirname(FILE), { recursive: true })
    fs.writeFileSync(FILE, JSON.stringify(d, null, 2))
}

// durasi: "30" / "30m" / "2h" / "1d" / "45s" (tanpa satuan = menit). Return ms atau null.
function parseDuration(s) {
    const m = String(s || '').trim().toLowerCase().match(/^(\d+)\s*(detik|dtk|s|menit|mnt|m|jam|j|h|hari|d)?$/)
    if (!m) return null
    const n = Number(m[1])
    const u = m[2] || 'm'
    const mult = /^(s|dtk|detik)$/.test(u) ? 1e3 : /^(h|j|jam)$/.test(u) ? 36e5 : /^(d|hari)$/.test(u) ? 864e5 : 6e4
    return n > 0 ? n * mult : null
}

function fmtDuration(ms) {
    const s = Math.round(ms / 1000)
    const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), r = s % 60
    return [d && `${d} hari`, h && `${h} jam`, m && `${m} menit`, !d && !h && !m && `${r} detik`].filter(Boolean).join(' ')
}

const set = (jid, until, by) => { const d = read(); d[jid] = { until: until || 0, by: by || '' }; write(d) }
const clear = (jid) => { const d = read(); if (!d[jid]) return false; delete d[jid]; write(d); return true }
const get = (jid) => read()[jid] || null

async function tick() {
    if (!sock) return
    const d = read()
    const now = Date.now()
    for (const [jid, v] of Object.entries(d)) {
        if (!v.until || v.until > now) continue
        try {
            await sock.groupSettingUpdate(jid, 'not_announcement')
            await sock.sendMessage(jid, { text: '🔊 *Mute grup selesai.* Grup dibuka kembali, semua member bisa mengirim pesan.' }).catch(() => {})
            clear(jid)
        } catch (e) {
            // bot bukan admin / grup sudah tidak ada: hapus supaya tidak diulang terus
            if (/not-authorized|forbidden|item-not-found|403|404/i.test(String(e?.message || e))) clear(jid)
            else console.warn('[mutegc] gagal membuka grup', jid, e?.message || e)
        }
    }
}

// dipanggil setiap bot (re)connect; timer hanya dibuat sekali
function start(s) {
    sock = s
    if (!timer) {
        timer = setInterval(() => tick().catch(() => {}), 15000)
        if (timer.unref) timer.unref()
    }
    tick().catch(() => {})
}

module.exports = { parseDuration, fmtDuration, set, clear, get, start }
