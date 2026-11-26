/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Sistem Ekonomi — diadaptasi dari Renzona MD V2
 * Data: library/database/ekonomi.json
 *
 * Satu user = { money, bank, lastDaily, lastWeekly, lastMonthly, lastKerja, inventory: [], transaksi: [] }
 */
'use strict'
const fs = require('fs')
const path = require('path')

const DB_DIR = path.join(process.cwd(), 'library', 'database')
const FILE = path.join(DB_DIR, 'ekonomi.json')

function ensureDir() {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
}

let cache = null
function load() {
    if (cache) return cache
    ensureDir()
    try {
        if (!fs.existsSync(FILE)) {
            cache = {}
            fs.writeFileSync(FILE, JSON.stringify(cache, null, 2))
        } else {
            cache = JSON.parse(fs.readFileSync(FILE, 'utf8'))
        }
    } catch (e) {
        cache = {}
    }
    return cache
}

let saveTimer = null
function save() {
    ensureDir()
    if (saveTimer) return
    saveTimer = setTimeout(() => {
        saveTimer = null
        try {
            fs.writeFileSync(FILE + '.tmp', JSON.stringify(cache, null, 2))
            fs.renameSync(FILE + '.tmp', FILE)
        } catch (e) { console.error('[EKONOMI] gagal simpan:', e.message) }
    }, 800)
    saveTimer.unref?.()
}

function cleanJid(jid) {
    return (jid || '').toString().split(':')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
}

function defaultUser() {
    return {
        money: 0,
        bank: 0,
        lastDaily: 0,
        lastWeekly: 0,
        lastMonthly: 0,
        lastKerja: 0,
        inventory: [],
        transaksi: []
    }
}

function getUser(jid) {
    const db = load()
    const key = cleanJid(jid)
    if (!db[key] || typeof db[key] !== 'object') db[key] = defaultUser()
    const u = db[key]
    // isi field yang mungkin belum ada (migrasi data lama)
    const def = defaultUser()
    for (const k in def) if (!(k in u)) u[k] = def[k]
    return u
}

function saveUser(jid, user) {
    const db = load()
    db[cleanJid(jid)] = user
    save()
}

function logTransaksi(user, teks) {
    user.transaksi = user.transaksi || []
    user.transaksi.unshift({ teks, waktu: Date.now() })
    user.transaksi = user.transaksi.slice(0, 20)
}

function getWIBTime() {
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    return new Date(utc + 7 * 60 * 60000)
}
function todayKey() { return getWIBTime().toISOString().slice(0, 10) }
function weekKey() {
    const d = getWIBTime()
    const onejan = new Date(d.getFullYear(), 0, 1)
    const week = Math.ceil((((d - onejan) / 864e5) + onejan.getDay() + 1) / 7)
    return `${d.getFullYear()}-W${week}`
}
function monthKey() { return getWIBTime().toISOString().slice(0, 7) }

function fmt(n) {
    n = Math.floor(Number(n) || 0)
    return n.toLocaleString('id-ID')
}

function addMoney(jid, amount) {
    const u = getUser(jid)
    u.money = Math.max(0, Math.floor(u.money + amount))
    saveUser(jid, u)
    return u
}
function addBank(jid, amount) {
    const u = getUser(jid)
    u.bank = Math.max(0, Math.floor(u.bank + amount))
    saveUser(jid, u)
    return u
}

function transfer(fromJid, toJid, amount) {
    amount = Math.floor(Number(amount) || 0)
    if (amount <= 0) return { success: false, message: 'Jumlah transfer tidak valid.' }
    const from = getUser(fromJid)
    if (from.money < amount) return { success: false, message: 'Saldo cash kamu tidak cukup.' }
    const to = getUser(toJid)
    from.money -= amount
    to.money += amount
    logTransaksi(from, `Transfer -Rp${fmt(amount)} ke ${cleanJid(toJid).split('@')[0]}`)
    logTransaksi(to, `Terima +Rp${fmt(amount)} dari ${cleanJid(fromJid).split('@')[0]}`)
    saveUser(fromJid, from)
    saveUser(toJid, to)
    return { success: true, message: `Berhasil transfer Rp${fmt(amount)}.` }
}

function deposit(jid, amount) {
    amount = Math.floor(Number(amount) || 0)
    const u = getUser(jid)
    if (amount <= 0) return { success: false, message: 'Jumlah tidak valid.' }
    if (u.money < amount) return { success: false, message: 'Saldo cash tidak cukup.' }
    u.money -= amount
    u.bank += amount
    logTransaksi(u, `Nabung +Rp${fmt(amount)} ke bank`)
    saveUser(jid, u)
    return { success: true, message: `Berhasil menabung Rp${fmt(amount)}.`, user: u }
}

function withdraw(jid, amount) {
    amount = Math.floor(Number(amount) || 0)
    const u = getUser(jid)
    if (amount <= 0) return { success: false, message: 'Jumlah tidak valid.' }
    if (u.bank < amount) return { success: false, message: 'Saldo bank tidak cukup.' }
    u.bank -= amount
    u.money += amount
    logTransaksi(u, `Tarik +Rp${fmt(amount)} dari bank`)
    saveUser(jid, u)
    return { success: true, message: `Berhasil menarik Rp${fmt(amount)}.`, user: u }
}

// ── Toko sederhana ──
const SHOP = [
    { id: 'pancing', nama: '🎣 Pancingan', harga: 50000, desc: 'Buat mancing (hiasan, belum ada efek game).' },
    { id: 'cangkul', nama: '⛏️ Cangkul', harga: 35000, desc: 'Buat berkebun (hiasan, belum ada efek game).' },
    { id: 'cincin', nama: '💍 Cincin', harga: 250000, desc: 'Item prestise, bisa dipamerkan di inventory.' },
    { id: 'motor', nama: '🏍️ Motor', harga: 1000000, desc: 'Kendaraan keren buat gaya-gayaan.' },
    { id: 'rumah', nama: '🏠 Rumah', harga: 5000000, desc: 'Tempat tinggal virtual, naikin gengsi.' }
]
function getShopItem(id) { return SHOP.find(s => s.id === id.toLowerCase()) }

function buyItem(jid, itemId, qty = 1) {
    qty = Math.max(1, Math.floor(Number(qty) || 1))
    const item = getShopItem(itemId)
    if (!item) return { success: false, message: 'Item tidak ditemukan di toko.' }
    const total = item.harga * qty
    const u = getUser(jid)
    if (u.money < total) return { success: false, message: `Saldo cash kurang. Butuh Rp${fmt(total)}.` }
    u.money -= total
    u.inventory = u.inventory || []
    const existing = u.inventory.find(i => i.id === item.id)
    if (existing) existing.qty += qty
    else u.inventory.push({ id: item.id, nama: item.nama, qty })
    logTransaksi(u, `Beli ${item.nama} x${qty} -Rp${fmt(total)}`)
    saveUser(jid, u)
    return { success: true, message: `Berhasil membeli ${item.nama} x${qty} seharga Rp${fmt(total)}.`, item, total }
}

function sellItem(jid, itemId, qty = 1) {
    qty = Math.max(1, Math.floor(Number(qty) || 1))
    const item = getShopItem(itemId)
    if (!item) return { success: false, message: 'Item tidak ditemukan.' }
    const u = getUser(jid)
    u.inventory = u.inventory || []
    const existing = u.inventory.find(i => i.id === item.id)
    if (!existing || existing.qty < qty) return { success: false, message: 'Jumlah item di inventory tidak cukup.' }
    const hargaJual = Math.floor(item.harga * 0.6) // dijual 60% dari harga beli
    const total = hargaJual * qty
    existing.qty -= qty
    if (existing.qty <= 0) u.inventory = u.inventory.filter(i => i.id !== item.id)
    u.money += total
    logTransaksi(u, `Jual ${item.nama} x${qty} +Rp${fmt(total)}`)
    saveUser(jid, u)
    return { success: true, message: `Berhasil menjual ${item.nama} x${qty} seharga Rp${fmt(total)}.`, total }
}

function leaderboard(limit = 10) {
    const db = load()
    return Object.entries(db)
        .map(([jid, u]) => ({ jid, total: (u.money || 0) + (u.bank || 0), money: u.money || 0, bank: u.bank || 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit)
}

module.exports = {
    FILE,
    getUser,
    saveUser,
    logTransaksi,
    getWIBTime,
    todayKey,
    weekKey,
    monthKey,
    fmt,
    cleanJid,
    addMoney,
    addBank,
    transfer,
    deposit,
    withdraw,
    SHOP,
    getShopItem,
    buyItem,
    sellItem,
    leaderboard
}
