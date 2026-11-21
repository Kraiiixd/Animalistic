// Auth user publik: register / login (password) + Login Google (OAuth 2.0) / logout
// + penautan akun lama (username/password) dengan identitas Google.
const express = require('express')
const crypto = require('crypto')
const router = express.Router()
const db = require('../lib/db')
const store = require('../lib/store')
const { hashPassword, verifyPassword } = require('../lib/cryptoUtil')
const { USER_COOKIE, setSessionCookie, clearCookie, cookieLine, parseCookies, loginRateOk, loginFailed, loginSucceeded, maybeBootstrapOwner } = require('../lib/authUtil')

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
// URL endpoint ini dioverride saat testing (stub lokal)
const GOOGLE_TOKEN_URL = () => process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token'
const GOOGLE_TOKENINFO_URL = () => process.env.GOOGLE_TOKENINFO_URL || 'https://oauth2.googleapis.com/tokeninfo'

function googleEnabled() {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

// URL publik situs. APP_URL (mis. https://animash.my.id) lebih diutamakan supaya
// redirect_uri Google selalu sama persis dengan yang didaftarkan di Console.
function baseUrl(req) {
    if (process.env.APP_URL) return String(process.env.APP_URL).replace(/\/+$/, '')
    const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim()
    return `${proto}://${req.headers.host}`
}

function googleRedirectUri(req) {
    return `${baseUrl(req)}/auth/google/callback`
}

// Hanya izinkan redirect internal: "/x" boleh, "//evil.com" & "/\\evil.com" ditolak
function safeNext(next) {
    return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/'
}

function noDb(res) {
    return res.status(503).render('error', { error: 'Fitur akun belum aktif: DATABASE_URL belum dikonfigurasi.' })
}

/* ==================== REGISTER & LOGIN PASSWORD ==================== */

router.get('/register', (req, res) => {
    if (!db.enabled()) return noDb(res)
    if (req.authUser) return res.redirect('/level')
    res.render('register', { active: '', error: null, username: '', email: '', google: googleEnabled() })
})

router.post('/register', async (req, res) => {
    if (!db.enabled()) return noDb(res)
    const username = String(req.body.username || '').toLowerCase().trim()
    const password = String(req.body.password || '')
    const email = String(req.body.email || '').trim().toLowerCase()
    const again = (status, error) => res.status(status).render('register', { active: '', username, email, google: googleEnabled(), error })

    if (!USERNAME_RE.test(username) || password.length < 6) {
        return again(400, 'Username 3-20 karakter (huruf/angka/underscore) & password minimal 6 karakter.')
    }
    if (email && (email.length > 254 || !EMAIL_RE.test(email))) {
        return again(400, 'Format email tidak valid.')
    }

    try {
        if (email && await store.findUserByEmail(email)) {
            return again(409, 'Email sudah dipakai akun lain. Masuk saja, atau gunakan Masuk dengan Google.')
        }
        const user = await store.createUser(username, hashPassword(password), email || null)
        // Email ketikan manual belum terverifikasi -> hanya OWNER_USERNAME yang berlaku di sini
        await maybeBootstrapOwner(user)
        const s = await store.createSession('user', user.id)
        setSessionCookie(res, req, USER_COOKIE, s.token)
        res.redirect('/level')
    } catch (e) {
        const taken = e && e.code === '23505'
        res.status(taken ? 409 : 500).render('register', {
            active: '', username, email, google: googleEnabled(),
            error: taken ? 'Username sudah dipakai, coba yang lain.' : 'Gagal mendaftar, coba lagi.'
        })
    }
})

router.get('/login', (req, res) => {
    if (!db.enabled()) return noDb(res)
    if (req.authUser) return res.redirect('/level')
    res.render('login', { active: '', error: null, next: safeNext(req.query.next), google: googleEnabled() })
})

router.post('/login', async (req, res) => {
    if (!db.enabled()) return noDb(res)
    const nextUrl = safeNext(req.body.next)
    const ip = req.ip || 'unknown'

    if (!loginRateOk(ip)) {
        return res.status(429).render('login', { active: '', next: nextUrl, google: googleEnabled(), error: 'Terlalu banyak percobaan. Coba lagi 10 menit.' })
    }

    try {
        const ident = String(req.body.username || '').trim()
        // Boleh masuk pakai username ATAU email
        const user = ident.includes('@') ? await store.findUserByEmail(ident) : await store.findUserByName(ident)
        const bad = !user || !user.password_hash || !verifyPassword(String(req.body.password || ''), user.password_hash)
        if (bad) {
            loginFailed(ip)
            const hint = user && !user.password_hash ? 'Akun ini dibuat lewat Google — gunakan tombol Masuk dengan Google.' : 'Username/email atau password salah.'
            return res.status(401).render('login', { active: '', next: nextUrl, google: googleEnabled(), error: hint })
        }
        if (user.is_banned) {
            return res.status(403).render('login', { active: '', next: nextUrl, google: googleEnabled(), error: 'Akun ini diblokir. Hubungi admin.' })
        }
        loginSucceeded(ip)
        await maybeBootstrapOwner(user)
        const s = await store.createSession('user', user.id)
        setSessionCookie(res, req, USER_COOKIE, s.token)
        res.redirect(nextUrl)
    } catch (e) {
        res.status(500).render('login', { active: '', next: nextUrl, google: googleEnabled(), error: 'Server sibuk, coba lagi.' })
    }
})

/* ==================== LOGIN GOOGLE (OAuth 2.0 code flow) ==================== */

const GSTATE_COOKIE = 'wb_gstate'
const GLINK_COOKIE = 'wb_glink'
const TEN_MIN = 10 * 60

// Kunci tanda tangan cookie sementara (penautan akun). SESSION_SECRET bila ada,
// kalau tidak pakai GOOGLE_CLIENT_SECRET (selalu ada saat login Google aktif).
function signingKey() {
    return process.env.SESSION_SECRET || process.env.GOOGLE_CLIENT_SECRET || 'animash-dev-only'
}

function signPayload(obj) {
    const body = Buffer.from(JSON.stringify(obj)).toString('base64url')
    const sig = crypto.createHmac('sha256', signingKey()).update(body).digest('base64url')
    return `${body}.${sig}`
}

function readSigned(raw) {
    if (!raw || typeof raw !== 'string' || !raw.includes('.')) return null
    const [body, sig] = raw.split('.')
    const expect = crypto.createHmac('sha256', signingKey()).update(body).digest('base64url')
    const a = Buffer.from(sig || '')
    const b = Buffer.from(expect)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
    try {
        const obj = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
        if (!obj || typeof obj.exp !== 'number' || obj.exp < Date.now()) return null
        return obj
    } catch (e) { return null }
}

// GET /auth/google            -> login/daftar biasa
// GET /auth/google?mode=link  -> tautkan Google ke akun yang SEDANG login
router.get('/auth/google', (req, res) => {
    if (!db.enabled()) return noDb(res)
    if (!googleEnabled()) {
        return res.status(503).render('login', {
            active: '', next: '/', google: false,
            error: 'Login Google belum dikonfigurasi (GOOGLE_CLIENT_ID/SECRET kosong).'
        })
    }

    const mode = req.query.mode === 'link' ? 'link' : 'login'
    if (mode === 'link' && !req.authUser) {
        return res.redirect('/login?next=' + encodeURIComponent('/level'))
    }

    const state = crypto.randomBytes(16).toString('hex')
    const nextUrl = safeNext(req.query.next)

    // state disimpan di cookie sementara (10 mnt) untuk anti-CSRF,
    // sekaligus membawa tujuan redirect & mode (login/link)
    res.append('Set-Cookie', cookieLine(GSTATE_COOKIE, signPayload({ state, next: nextUrl, mode, exp: Date.now() + TEN_MIN * 1000 }), TEN_MIN, req))

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: googleRedirectUri(req),
        response_type: 'code',
        scope: 'openid email profile',
        state,
        prompt: 'select_account'
    })
    res.redirect(`${GOOGLE_AUTH_URL}?${params}`)
})

// Tukar kode -> token -> identitas terverifikasi. Return { info } atau { error }.
async function exchangeGoogleCode(req) {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code: String(req.query.code),
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: googleRedirectUri(req),
            grant_type: 'authorization_code'
        })
    })
    const tokens = await tokenRes.json().catch(() => ({}))
    if (!tokenRes.ok || !tokens.id_token) return { error: 'Gagal menukar kode dengan Google.' }

    // Verifikasi id_token via endpoint Google (pastikan aud = client kita)
    const infoRes = await fetch(`${GOOGLE_TOKENINFO_URL()}?id_token=${encodeURIComponent(tokens.id_token)}`)
    const info = await infoRes.json().catch(() => ({}))
    if (!infoRes.ok || info.aud !== process.env.GOOGLE_CLIENT_ID || !info.sub) {
        return { error: 'Verifikasi identitas Google gagal.' }
    }
    if (info.email_verified === 'false' || info.email_verified === false) {
        return { error: 'Email Google belum terverifikasi.' }
    }
    return {
        info: {
            sub: String(info.sub),
            email: info.email ? String(info.email).toLowerCase() : null,
            emailVerified: info.email_verified === true || info.email_verified === 'true',
            name: info.name || null,
            picture: info.picture || null
        }
    }
}

async function startSession(req, res, user) {
    const s = await store.createSession('user', user.id)
    setSessionCookie(res, req, USER_COOKIE, s.token)
}

function bannedPage(res) {
    return res.status(403).render('login', { active: '', next: '/', google: true, error: 'Akun ini diblokir. Hubungi admin.' })
}

router.get('/auth/google/callback', async (req, res) => {
    const fail = (msg) => res.status(400).render('login', { active: '', next: '/', google: googleEnabled(), error: msg })
    if (!db.enabled()) return noDb(res)
    if (!googleEnabled()) return fail('Login Google belum dikonfigurasi.')

    // Verifikasi state (anti-CSRF)
    const saved = readSigned(parseCookies(req)[GSTATE_COOKIE])
    clearCookie(res, req, GSTATE_COOKIE)
    const nextUrl = safeNext(saved && saved.next)
    const after = nextUrl === '/' ? '/level' : nextUrl

    if (req.query.error) return fail(`Login dibatalkan: ${req.query.error}`)
    if (!saved || !req.query.state || req.query.state !== saved.state) return fail('Sesi login tidak valid (state mismatch). Coba lagi.')
    if (!req.query.code) return fail('Google tidak mengirim kode otorisasi.')

    try {
        const { info, error } = await exchangeGoogleCode(req)
        if (error) return fail(error)

        /* ---- MODE TAUTKAN: user sudah login (password) lalu menautkan Google ---- */
        if (saved.mode === 'link') {
            const me = req.authUser
            if (!me) return fail('Sesi akun kamu berakhir. Masuk dulu lalu ulangi penautan.')
            const owner = await store.findUserByGoogleId(info.sub)
            if (owner && owner.id !== me.id) {
                return res.redirect('/level?err=' + encodeURIComponent(`Akun Google ini sudah tertaut ke akun lain (@${owner.username}).`))
            }
            if (me.google_id && me.google_id !== info.sub) {
                return res.redirect('/level?err=' + encodeURIComponent('Akunmu sudah tertaut ke akun Google lain.'))
            }
            const linked = await store.linkGoogleAccount(me.id, { googleId: info.sub, email: info.email, avatarUrl: info.picture })
            await maybeBootstrapOwner(linked, { emailVerified: info.emailVerified, email: info.email })
            return res.redirect('/level?ok=' + encodeURIComponent('Akun Google berhasil ditautkan. Sekarang kamu bisa masuk pakai Google.'))
        }

        /* ---- MODE LOGIN ---- */
        // 1. Sudah pernah login Google -> langsung dikenali lewat google_id
        let user = await store.findUserByGoogleId(info.sub)

        // 2. Belum: cari AKUN LAMA dengan email sama (case-insensitive)
        if (!user && info.email && info.emailVerified) {
            const legacy = await store.findUserByEmail(info.email)
            if (legacy && !legacy.google_id) {
                if (legacy.is_banned) return bannedPage(res)
                if (legacy.password_hash) {
                    // Akun lama ber-password: minta konfirmasi password dulu supaya
                    // orang yang sekadar mengetik email orang lain saat daftar
                    // tidak bisa "membajak" akun Google pemilik email aslinya.
                    res.append('Set-Cookie', cookieLine(GLINK_COOKIE, signPayload({
                        uid: legacy.id, sub: info.sub, email: info.email, emailVerified: info.emailVerified,
                        name: info.name, picture: info.picture, next: after, exp: Date.now() + TEN_MIN * 1000
                    }), TEN_MIN, req))
                    return res.redirect('/link-account')
                }
                user = await store.linkGoogleAccount(legacy.id, { googleId: info.sub, email: info.email, avatarUrl: info.picture })
            }
        }

        // 3. Tetap tidak ada -> buat akun baru
        if (!user) {
            user = await createGoogleAccount(info)
        } else if (info.picture && info.picture !== user.avatar_url) {
            await store.updateGoogleProfile(user.id, info.picture)
            user.avatar_url = info.picture
        }

        if (user.is_banned) return bannedPage(res)

        // 4. Bootstrap owner bila cocok env lalu terbitkan sesi seperti login biasa
        await maybeBootstrapOwner(user, { emailVerified: info.emailVerified, email: info.email })
        await startSession(req, res, user)
        res.redirect(after)
    } catch (e) {
        console.error('[Animash] Google login error:', e.message)
        res.status(500).render('login', { active: '', next: '/', google: googleEnabled(), error: 'Login Google gagal, coba lagi.' })
    }
})

async function createGoogleAccount(info) {
    const baseName = info.name || (info.email || 'animash').split('@')[0]
    const username = await uniqueUsername(baseName)
    return store.createGoogleUser({
        username,
        googleId: info.sub,
        email: info.email || null,
        avatarUrl: info.picture || null
    })
}

/* ---------- Konfirmasi penautan akun lama (email sama) ---------- */

async function loadPendingLink(req) {
    const p = readSigned(parseCookies(req)[GLINK_COOKIE])
    if (!p) return null
    const legacy = await store.findUserById(p.uid)
    if (!legacy || legacy.google_id) return null
    return { p, legacy }
}

router.get('/link-account', async (req, res) => {
    if (!db.enabled()) return noDb(res)
    const pending = await loadPendingLink(req)
    if (!pending) return res.redirect('/login')
    res.render('link-account', {
        active: '', error: null,
        legacyUsername: pending.legacy.username,
        email: pending.p.email
    })
})

router.post('/link-account', async (req, res) => {
    if (!db.enabled()) return noDb(res)
    const pending = await loadPendingLink(req)
    if (!pending) return res.redirect('/login')
    const { p, legacy } = pending
    const again = (status, error) => res.status(status).render('link-account', { active: '', error, legacyUsername: legacy.username, email: p.email })
    const ip = req.ip || 'unknown'

    try {
        let user
        if (req.body.action === 'new') {
            // Pilih akun baru terpisah (akun lama tetap ada, tidak tertaut)
            user = (await store.findUserByGoogleId(p.sub)) || await createGoogleAccount({ sub: p.sub, email: p.email, name: p.name, picture: p.picture })
        } else {
            if (!loginRateOk(ip)) return again(429, 'Terlalu banyak percobaan. Coba lagi 10 menit.')
            if (!verifyPassword(String(req.body.password || ''), legacy.password_hash)) {
                loginFailed(ip)
                return again(401, 'Password akun lama salah.')
            }
            loginSucceeded(ip)
            if (await store.findUserByGoogleId(p.sub)) return again(409, 'Akun Google ini sudah tertaut ke akun lain.')
            user = await store.linkGoogleAccount(legacy.id, { googleId: p.sub, email: p.email, avatarUrl: p.picture })
        }
        if (user.is_banned) return bannedPage(res)
        clearCookie(res, req, GLINK_COOKIE)
        await maybeBootstrapOwner(user, { emailVerified: p.emailVerified, email: p.email })
        await startSession(req, res, user)
        res.redirect(safeNext(p.next))
    } catch (e) {
        console.error('[Animash] link-account error:', e.message)
        again(500, 'Gagal menautkan akun, coba lagi.')
    }
})

// Username unik dari nama/email Google (slug aman, suffix acak bila tabrakan)
async function uniqueUsername(base) {
    let clean = String(base || 'animash').toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (clean.length < 3) clean = 'animash_' + clean
    clean = clean.slice(0, 14)
    for (let i = 0; i < 10; i++) {
        const candidate = i === 0 ? clean : `${clean}_${crypto.randomInt(1000, 9999)}`
        if (!(await store.findUserByName(candidate))) return candidate
    }
    return `animash${crypto.randomInt(100000, 999999)}`
}

/* ==================== LOGOUT ==================== */

router.get('/logout', async (req, res) => {
    if (db.enabled()) {
        try {
            const token = parseCookies(req)[USER_COOKIE]
            if (token) await store.deleteSession(token)
        } catch (e) {}
    }
    clearCookie(res, req, USER_COOKIE)
    res.redirect('/')
})

module.exports = router
module.exports._internal = { safeNext, signPayload, readSigned, uniqueUsername }
