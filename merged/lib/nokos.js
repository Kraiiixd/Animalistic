/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Helper bersama fitur Gacha Nokos (dipindah dari Kaguya MD):
 *  - state nomor aktif + polling OTP
 *  - tracker traffic per negara & riwayat per user (disimpan ke library/database)
 *  - helper cek bio (anti-jam, meta business)
 */

'use strict'

const fs = require('fs')
const path = require('path')

const BASE_URL = 'https://smsku.zelapi.eu.cc/api'

// ---------------------------------------------------------------- state bersama
const activePolls = (global.__nokosPolls ||= new Map())
const owners = (global.__nokosOwners ||= new Map())
const OWNER_TTL = 6 * 60 * 60 * 1000

const claim = (num, m) => owners.set(num, { sender: m.sender, chat: m.chat, at: Date.now() })

function myNumbers(m) {
    const now = Date.now()
    const out = []
    for (const [num, v] of owners) {
        if (now - v.at > OWNER_TTL) { owners.delete(num); continue }
        if (v.sender === m.sender) out.push(num)
    }
    return out
}

// ---------------------------------------------------------------- penyimpanan JSON
const DB_DIR = path.join(process.cwd(), 'library', 'database')

function docStore(name, fallback) {
    const file = path.join(DB_DIR, `${name}.json`)
    let data
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')) } catch { data = JSON.parse(JSON.stringify(fallback)) }
    let timer = null
    return {
        get: () => data,
        save() {
            if (timer) return
            timer = setTimeout(() => {
                timer = null
                try {
                    fs.mkdirSync(DB_DIR, { recursive: true })
                    fs.writeFileSync(file, JSON.stringify(data, null, 2))
                } catch (e) { console.error(`[NOKOS] gagal simpan ${name}:`, e.message) }
            }, 1500)
            timer.unref?.()
        }
    }
}

// ---------------------------------------------------------------- traffic per negara
const store = docStore('nokos_traffic', { countries: {} })
const KEEP_DAYS = 7
const keyOf = (name) => String(name || '').trim().toLowerCase()
const dayOf = (t = Date.now()) => new Date(t + 7 * 3600e3).toISOString().slice(0, 10)

function bucket(name) {
    const db = store.get()
    if (!db.countries) db.countries = {}
    const k = keyOf(name)
    if (!k) return null
    const c = (db.countries[k] ||= { name: String(name).trim(), req: 0, ok: 0, reg: 0, otp: 0, jamSum: 0, jamN: 0, last: 0, days: {} })
    const d = dayOf()
    const day = (c.days[d] ||= { req: 0, ok: 0, otp: 0 })
    const old = Object.keys(c.days).sort().slice(0, -KEEP_DAYS)
    for (const o of old) delete c.days[o]
    return { c, day }
}

function trackRequest(country, ok) {
    const b = bucket(country); if (!b) return
    b.c.req++; b.day.req++
    if (ok) { b.c.ok++; b.day.ok++ }
    b.c.last = Date.now()
    store.save()
}

function trackNumber(country, { registered = false, jam = null } = {}) {
    const b = bucket(country); if (!b) return
    if (registered) b.c.reg++
    if (typeof jam === 'number') { b.c.jamSum += jam; b.c.jamN++ }
    store.save()
}

function trackOtp(country) {
    const b = bucket(country); if (!b) return
    b.c.otp++; b.day.otp++
    b.c.last = Date.now()
    store.save()
}

function getHistory(country) {
    const c = store.get().countries?.[keyOf(country)]
    if (!c) return null
    const d = c.days?.[dayOf()] || { req: 0, ok: 0, otp: 0 }
    return {
        name: c.name, req: c.req, ok: c.ok, reg: c.reg, otp: c.otp,
        okRate: c.req ? c.ok / c.req : null,
        otpRate: c.ok ? Math.min(1, c.otp / c.ok) : null,
        regRate: c.ok ? Math.min(1, c.reg / c.ok) : null,
        jam: c.jamN ? Math.round(c.jamSum / c.jamN) : null,
        today: d, last: c.last
    }
}

function scoreCountry(c, maxStock) {
    const stock = Number(c.count ?? c.available ?? 0) || 0
    const h = getHistory(c.name || c.code)
    const apiOtp = Number(c.otp_count ?? c.otp ?? c.traffic ?? 0) || 0
    const stockPart = maxStock > 0 ? Math.log1p(stock) / Math.log1p(maxStock) : 0
    const otpPart = h?.otpRate ?? (apiOtp > 0 ? Math.min(1, apiOtp / 50) : 0.5)
    const okPart = h?.okRate ?? 0.5
    return Math.round(stockPart * 45 + otpPart * 30 + okPart * 25)
}

const gradeOf = (score) => score >= 70 ? '🟢 Ramai' : score >= 45 ? '🟡 Sedang' : '🔴 Sepi'

function rankCountries(countries) {
    const list = (countries || []).filter(c => (c.name || c.code) && (c.count === undefined || Number(c.count) > 0))
    const maxStock = Math.max(0, ...list.map(c => Number(c.count) || 0))
    return list
        .map(c => ({ ...c, name: c.name || c.code, score: scoreCountry(c, maxStock), history: getHistory(c.name || c.code) }))
        .sort((a, b) => b.score - a.score || (b.count || 0) - (a.count || 0))
}

function pickWeighted(countries) {
    const ranked = rankCountries(countries)
    if (!ranked.length) return null
    const weights = ranked.map(c => 1 + (c.score * c.score) / 100)
    let r = Math.random() * weights.reduce((a, b) => a + b, 0)
    for (let i = 0; i < ranked.length; i++) { r -= weights[i]; if (r <= 0) return ranked[i] }
    return ranked[0]
}

const pickBest = (countries) => rankCountries(countries)[0] || null

// ---------------------------------------------------------------- riwayat per user
const userStore = docStore('nokos_user', { users: {} })
const USER_KEEP_ITEMS = 30

function trackUserNumber(sender, number, country) {
    const num = String(number || '').replace(/\D/g, '')
    if (!sender || !num) return
    const db = userStore.get()
    if (!db.users) db.users = {}
    const u = (db.users[sender] ||= { list: [] })
    u.list.unshift({ num, country: String(country || '?'), at: Date.now(), otp: false, otpAt: 0 })
    if (u.list.length > USER_KEEP_ITEMS) u.list.length = USER_KEEP_ITEMS
    userStore.save()
}

function trackUserOtp(number) {
    const num = String(number || '').replace(/\D/g, '')
    if (!num) return
    let best = null
    for (const u of Object.values(userStore.get().users || {})) {
        for (const it of u.list || []) {
            if (it.num === num && (!best || it.at > best.at)) best = it
        }
    }
    if (best && !best.otp) { best.otp = true; best.otpAt = Date.now(); userStore.save() }
}

// ---------------------------------------------------------------- helper cek bio
function getJamPercentage(bioData, setAt, isBusiness) {
    let score = 50
    if (bioData) score += 20
    if (setAt) score += 15
    if (isBusiness) score += 15
    return Math.min(100, score)
}

async function checkMetaBusiness(conn, jid) {
    try {
        const profile = await conn.getBusinessProfile?.(jid).catch(() => null)
        return { isBusiness: Boolean(profile) }
    } catch {
        return { isBusiness: false }
    }
}

module.exports = {
    BASE_URL, activePolls, owners, claim, myNumbers,
    trackRequest, trackNumber, trackOtp, trackUserNumber, trackUserOtp,
    getHistory, rankCountries, pickWeighted, pickBest, gradeOf,
    getJamPercentage, checkMetaBusiness
}
