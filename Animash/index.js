require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const express = require('express')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const Mobinime = require('./lib/ServerData')
const db = require('./lib/db')
const migrate = require('./lib/migrate')
const { attachUser } = require('./lib/authUtil')
const setupRoutes = require('./routes')
const authRoute = require('./routes/auth')
const apiRoute = require('./routes/api')
const adminRoute = require('./routes/admin')
const chatRoute = require('./routes/chat')
const vipRoute = require('./routes/vip')
const sourcesRoute = require('./routes/sources')

const app = express()
const port = process.env.PORT || 3000

// Di belakang proxy (Vercel/Cloudflare): req.ip & req.protocol diambil dari
// header X-Forwarded-*. Tanpa ini semua pengunjung terbaca ber-IP sama, jadi
// rate limit login gagal 8x mengunci SEMUA orang sekaligus.
app.set('trust proxy', 1)
app.disable('x-powered-by')
const mobinime = new Mobinime()

// Versi aset JS dari isi file: URL berubah setiap deploy -> cache browser/CDN
// (Cloudflare) otomatis kebypass tanpa perlu clear cache manual.
function assetHash(file) {
    try {
        return crypto.createHash('md5')
            .update(fs.readFileSync(path.join(__dirname, 'public', file)))
            .digest('hex').slice(0, 8)
    } catch (e) { return '0' }
}
const ASSET_V = assetHash('js/app.js') + assetHash('js/level.js')
app.use((req, res, next) => { res.locals.assetV = ASSET_V; next() })

// URL publik situs (canonical/og:url, redirect Google). APP_URL di env lebih
// diutamakan; tanpa itu diturunkan dari header request.
function siteUrlOf(req) {
    if (process.env.APP_URL) return String(process.env.APP_URL).replace(/\/+$/, '')
    return `${req.protocol}://${req.get('host')}`
}

// Judul per halaman statis (halaman detail/nonton mengisi sendiri dari data anime)
const PAGE_TITLES = {
    '/schedule': 'Jadwal Rilis Anime',
    '/search': 'Cari Anime',
    '/about': 'Tentang',
    '/bookmarks': 'Anime Tersimpan',
    '/level': 'Level & EXP',
    '/leaderboard': 'Papan Peringkat',
    '/chat': 'Chat Global',
    '/vip': 'VIP Paket Sultan',
    '/login': 'Masuk',
    '/register': 'Daftar Akun',
    '/link-account': 'Tautkan Akun Google'
}
app.use((req, res, next) => {
    const base = siteUrlOf(req)
    res.locals.siteUrl = base
    res.locals.canonicalUrl = base + req.path
    res.locals.pageTitle = PAGE_TITLES[req.path] || null
    if (req.path === '/search' && req.query.q) res.locals.pageTitle = `Hasil pencarian "${String(req.query.q).slice(0, 60)}"`
    next()
})

// Jalur DB penting di serverless: pastikan skema ada sebelum request
// pertama yang menyentuh DB (memoized — hanya migrasi sekali per proses).
app.use(async (req, res, next) => {
    try { await migrate.ensureMigrated() } catch (e) { console.error('[Animash] migrasi gagal:', e.message) }
    next()
})

app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// req.authUser/res.locals.authUser untuk semua halaman
app.use(attachUser)

// Urutan penting: auth/api/admin/chat SEBELUM rute publik (404 handler ada di dalamnya)
app.use('/', authRoute)
app.use('/api/episode', sourcesRoute(mobinime))
app.use('/api', apiRoute)
app.use('/admin', adminRoute(mobinime))
app.use('/chat', chatRoute)
app.use('/vip', vipRoute)

setupRoutes(app, mobinime)

// Penanganan error terakhir: jangan tampilkan stack trace ke pengunjung
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('[Animash] Unhandled error:', err && err.message ? err.message : err)
    if (res.headersSent) return
    if (req.path.startsWith('/api/') || req.path.startsWith('/chat/api')) {
        return res.status(500).json({ ok: false, reason: 'server_error' })
    }
    res.status(500).render('error', { error: 'Terjadi kesalahan di server. Coba lagi sebentar lagi.' })
})

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Animash running at http://localhost:${port}`)
        if (!db.enabled()) console.log('[Animash] Mode tanpa database (DATABASE_URL kosong): fitur publik normal, akun/EXP/admin nonaktif.')
    })
}

module.exports = app
module.exports.mobinime = mobinime
