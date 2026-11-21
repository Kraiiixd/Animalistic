// Helper session cookie + middleware auth (user & admin)
const db = require('./db')
const store = require('./store')

const USER_COOKIE = 'wb_session'
const SEVEN_DAYS = 7 * 24 * 60 * 60

function parseCookies(req) {
    const out = {}
    const raw = req.headers.cookie
    if (!raw) return out
    for (const part of raw.split(';')) {
        const i = part.indexOf('=')
        if (i <= 0) continue
        const val = part.slice(i + 1).trim()
        // Cookie rusak (%E0%A4%A dsb) jangan sampai bikin request 500
        try { out[part.slice(0, i).trim()] = decodeURIComponent(val) } catch (e) { out[part.slice(0, i).trim()] = val }
    }
    return out
}

function cookieLine(name, value, maxAgeSec, req) {
    const secure = req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''
    return `${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}${secure}`
}

function setSessionCookie(res, req, name, token) {
    res.append('Set-Cookie', cookieLine(name, token, SEVEN_DAYS, req))
}

function clearCookie(res, req, name) {
    res.append('Set-Cookie', cookieLine(name, '', 0, req))
}

// Rate limit login sederhana per IP (in-memory, cukup untuk v1)
const attempts = new Map()
function loginRateOk(ip) {
    const now = Date.now()
    const a = attempts.get(ip) || { fails: 0, until: 0 }
    if (a.until > now) return false
    return true
}
function loginFailed(ip) {
    const now = Date.now()
    const a = attempts.get(ip) || { fails: 0, until: 0 }
    a.fails += 1
    if (a.fails >= 8) { a.until = now + 10 * 60 * 1000; a.fails = 0 }
    attempts.set(ip, a)
}
function loginSucceeded(ip) {
    attempts.delete(ip)
}

// Pasang req.authUser & res.locals.authUser jika session user valid
async function attachUser(req, res, next) {
    res.locals.authUser = null
    req.authUser = null
    if (!db.enabled()) return next()
    try {
        const token = parseCookies(req)[USER_COOKIE]
        if (!token) return next()
        const s = await store.findSession(token, 'user')
        if (!s) return next()
        const user = await store.findUserById(s.ref_id)
        if (!user || user.is_banned) {
            await store.deleteSession(token)
            clearCookie(res, req, USER_COOKIE)
            return next()
        }
        req.authUser = user
        res.locals.authUser = {
            id: user.id, username: user.username, xp: user.xp,
            avatar_url: user.avatar_url || null, role: user.role || 'user',
            vip: store.isVip(user), vipUntil: user.vip_until || null,
            email: user.email || null, googleLinked: Boolean(user.google_id),
            hasPassword: Boolean(user.password_hash)
        }
    } catch (e) { /* DB sibuk -> anggap anon, situs tetap jalan */ }
    next()
}

// ---- Middleware panel admin (berbasis ROLE akun user biasa) ----
// SATU PINTU: tidak ada tabel/sesi admin terpisah. Yang bisa masuk /admin
// adalah user yang sedang login dengan role 'admin' atau 'owner'
// (login bisa lewat password biasa atau Google).

async function requireAdmin(req, res, next) {
    if (!db.enabled()) {
        return res.status(503).render('error', { error: 'DATABASE_URL belum dikonfigurasi — panel admin nonaktif.' })
    }
    const u = req.authUser
    if (!u) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl || '/admin'))
    if (u.role !== 'admin' && u.role !== 'owner') {
        return res.status(403).render('admin/denied', {
            admin: null, section: '',
            message: `Akun "${u.username}" bukan admin/owner — akses ditolak. Minta owner menaikkan role kamu lewat panel admin.`
        })
    }
    req.admin = { id: u.id, username: u.username, role: u.role }
    res.locals.admin = req.admin
    next()
}

function requireOwner(req, res, next) {
    if (!req.admin || req.admin.role !== 'owner') {
        return res.status(403).render('admin/denied', { admin: req.admin || null, section: '' })
    }
    next()
}

// Email owner dari env (OWNER_EMAIL), huruf kecil. Kosong -> null.
function ownerEmail() {
    const e = String(process.env.OWNER_EMAIL || '').trim().toLowerCase()
    return e || null
}

function isOwnerEmail(email) {
    const env = ownerEmail()
    return Boolean(env && email && String(email).trim().toLowerCase() === env)
}

// Bootstrap OWNER otomatis saat register/login:
//  1. Email Google TERVERIFIKASI yang sama dengan OWNER_EMAIL -> SELALU jadi
//     OWNER (Google sudah membuktikan kepemilikan email, jadi aman walau
//     situs sudah punya owner — mencegah owner asli terkunci di luar panel).
//  2. Username sama dengan OWNER_USERNAME -> jadi OWNER HANYA jika situs
//     belum punya owner sama sekali (anti-takeover: orang iseng yang daftar
//     pakai username itu belakangan tidak bisa merebut kendali).
// Email yang diketik manual saat daftar (belum terverifikasi) TIDAK pernah
// dipakai untuk mengangkat owner.
async function maybeBootstrapOwner(user, { emailVerified = false, email = null } = {}) {
    try {
        if (!db.enabled() || !user || user.role === 'owner') return false
        const verifiedOwnerMail = emailVerified && isOwnerEmail(email || user.email)
        const envUser = (process.env.OWNER_USERNAME || '').toLowerCase().trim()
        const matchUser = Boolean(envUser) && String(user.username).toLowerCase() === envUser

        if (verifiedOwnerMail) {
            await store.setUserRole(user.id, 'owner')
            user.role = 'owner'
            console.log(`[Animash] OWNER: "${user.username}" login dengan email owner terverifikasi.`)
            return true
        }
        if (matchUser && (await store.countOwners()) === 0) {
            await store.setUserRole(user.id, 'owner')
            user.role = 'owner'
            console.log(`[Animash] Bootstrap: "${user.username}" otomatis jadi OWNER (cocok OWNER_USERNAME & belum ada owner).`)
            return true
        }
    } catch (e) { /* jangan gagalkan login hanya karena bootstrap */ }
    return false
}

module.exports = {
    USER_COOKIE,
    parseCookies, setSessionCookie, clearCookie, cookieLine,
    loginRateOk, loginFailed, loginSucceeded,
    attachUser, requireAdmin, requireOwner, maybeBootstrapOwner,
    ownerEmail, isOwnerEmail
}
