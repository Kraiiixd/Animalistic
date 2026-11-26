/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * React Channel — kirim reaksi ke postingan saluran WhatsApp.
 * Scraper: lib/reactch.cjs (tanpa API key) — Credit: Sakaxabell
 *
 * Limit harian: free 3x, premium 5x (reset 00:00 WIB). Owner tanpa limit.
 * Limit bonus dari owner dipakai setelah jatah harian habis dan tidak ikut reset.
 *
 * .rch <link postingan channel> <emoji[,emoji...]>
 * .addrch <jumlah> <nomor/@tag/reply>   (khusus owner)
 *
 */

const fs = require('fs')
const path = require('path')
const { react: reactScrape } = require('../../lib/reactch.cjs')
const moment = require('moment-timezone')

const DB_PATH = path.join(__dirname, '..', '..', 'library', 'database', 'rch-limit.json')

const LIMIT_FREE = 3
const LIMIT_PREMIUM = 5
const MAX_ADD = 1000
const CREDIT = 'Powered by Kureza MD • React CH Scrape by Sakaxabell'

const today = () => moment().tz('Asia/Jakarta').format('YYYY-MM-DD')

const card = (title, body) => `\`⌜ ${title} ⌟\`\n${body}\n\n_${CREDIT}_`

// ---------- database: { usage: { id: {date,count} }, bonus: { id: n } } ----------
function loadDb() {
    let raw = {}
    try { raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) } catch {}
    return { usage: raw.usage || {}, bonus: raw.bonus || {} }
}

function saveDb(db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

function getUsed(db, id) {
    const d = today()
    for (const k of Object.keys(db.usage)) if (db.usage[k]?.date !== d) delete db.usage[k]
    return db.usage[id]?.date === d ? db.usage[id].count : 0
}
const setUsed = (db, id, count) => { db.usage[id] = { date: today(), count: Math.max(0, count) } }
const getBonus = (db, id) => Math.max(0, Number(db.bonus[id]) || 0)
const setBonus = (db, id, n) => {
    n = Math.max(0, n)
    if (n) db.bonus[id] = n
    else delete db.bonus[id]
}

const CHANNEL_RE = /^https?:\/\/(www\.)?whatsapp\.com\/channel\/[A-Za-z0-9_-]+\/\d+/i
const line = (k, v) => `> ◦ ${k} : *${v}*`

// ---------- .addrch ----------
async function addRch(m, { args, isCreator, Reply, prefix }) {
    if (!isCreator) return Reply(global.mess.owner)

    const amountArg = args.find((a) => /^-?\d{1,4}$/.test(a))
    const amount = amountArg === undefined ? 1 : parseInt(amountArg, 10)
    if (!amount) return Reply(card('Add Limit RCH', line('Info', 'Jumlah tidak boleh 0')))
    if (Math.abs(amount) > MAX_ADD) return Reply(card('Add Limit RCH', line('Info', `Maksimal ${MAX_ADD} per perintah`)))

    // target: mention > reply > nomor di argumen
    let target = m.mentionedJid?.[0] || m.quoted?.sender || null
    if (!target) {
        const num = args.find((a) => /^\d{8,}$/.test(a.replace(/[^0-9]/g, '')) && a !== amountArg)
        if (num) target = num.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    }
    if (!target) {
        return Reply(card('Add Limit RCH', `${line('Info', 'Target belum ada')}\n> ◦ Contoh : *${prefix || '.'}addrch 3 628xxxxxxxxxx*\n> ◦ Atau : *tag / reply user*\n> ◦ Catatan : *Jumlah minus untuk mengurangi*`))
    }

    const db = loadDb()
    setBonus(db, target, getBonus(db, target) + amount)
    saveDb(db)
    return Reply(card('Add Limit RCH', `${line('Status', 'Berhasil')}\n${line('Target', target.split('@')[0])}\n${line('Aksi', `${amount > 0 ? 'Ditambah' : 'Dikurangi'} ${Math.abs(amount)}`)}\n${line('Limit Bonus', getBonus(db, target))}`))
}

let handler = async (m, ctx) => {
    const { command, args, text, isCreator, isPremium, Reply, prefix } = ctx
    if (command === 'addrch') return addRch(m, ctx)

    const TITLE = 'React Channel'
    const link = args.find((a) => /^https?:\/\//i.test(a))
    const emoji = (text || '').replace(link || '', '').trim()

    if (!link || !emoji) {
        return Reply(card(TITLE, `${line('Status', 'Format salah')}\n> ◦ Cara pakai : *${prefix || '.'}rch <link postingan> <emoji>*\n> ◦ Contoh : *${prefix || '.'}rch https://whatsapp.com/channel/0029Vxxxx/123 🔥*\n> ◦ Info : *Link harus link postingan channel (ada angka di belakang kode)*`))
    }
    if (!CHANNEL_RE.test(link)) {
        return Reply(card(TITLE, `${line('Status', 'Gagal')}\n${line('Info', 'Link bukan link postingan saluran')}\n> ◦ Format : *whatsapp.com/channel/<kode>/<id postingan>*`))
    }
    const emojiList = emoji.split(',').map((x) => x.trim()).filter(Boolean)
    if (!emojiList.length || emojiList.length > 5 || emojiList.some((x) => [...x].length > 8)) return Reply(card(TITLE, `${line('Status', 'Gagal')}\n${line('Info', 'Pakai emoji saja, maksimal 5 (pisah koma)')}`))

    const limit = isPremium ? LIMIT_PREMIUM : LIMIT_FREE
    const id = m.sender
    const db = loadDb()
    const used = getUsed(db, id)
    const bonus = getBonus(db, id)

    // sumber jatah: harian dulu, lalu bonus
    let source = null
    if (isCreator) source = 'owner'
    else if (used < limit) source = 'daily'
    else if (bonus > 0) source = 'bonus'

    if (!source) {
        return Reply(card(TITLE, `${line('Status', 'Limit habis')}\n${line('Harian', `${used}/${limit}`)}\n${line('Bonus', 0)}${isPremium ? '' : `\n> ◦ Info : *User premium dapat ${LIMIT_PREMIUM}x per hari*`}\n> ◦ Reset : *Jatah harian reset jam 00:00 WIB*`))
    }

    // reservasi dulu supaya spam cepat tidak menembus limit
    if (source === 'daily') setUsed(db, id, used + 1)
    if (source === 'bonus') setBonus(db, id, bonus - 1)
    if (source !== 'owner') saveDb(db)

    const refund = () => {
        if (source === 'owner') return
        const f = loadDb()
        if (source === 'daily') setUsed(f, id, getUsed(f, id) - 1)
        if (source === 'bonus') setBonus(f, id, getBonus(f, id) + 1)
        saveDb(f)
    }
    const scrub = (s) => String(s)

    try {
        const result = await reactScrape(link, emojiList.join(','))
        console.log('[rch] respons:', JSON.stringify(result.raw || result))
        if (!result.ok) {
            const why = result.msg || result.error || result.hint || 'Permintaan ditolak'
            throw new Error(typeof why === 'string' ? why : JSON.stringify(why))
        }

        let sisa = 'Tanpa batas'
        if (!isCreator) {
            const f = loadDb()
            sisa = `${Math.max(0, limit - getUsed(f, id))} harian + ${getBonus(f, id)} bonus`
        }
        return Reply(card(TITLE, `${line('Status', 'Reaksi berhasil dikirim')}\n${line('Reaksi', emojiList.join(' '))}\n${line('Sisa Limit', sisa)}`))
    } catch (e) {
        refund()
        const rd = e.response?.data
        console.log('[rch] error:', e.response?.status, scrub(rd ? JSON.stringify(rd) : e.message))
        const msg = (rd && (rd.message || rd.msg || rd.error || (typeof rd === 'string' ? rd : JSON.stringify(rd)))) || e.message || 'unknown error'
        return Reply(card(TITLE, `${line('Status', 'Gagal')}\n${line('Info', scrub(typeof msg === 'string' ? msg : JSON.stringify(msg)).slice(0, 300))}\n> ◦ Limit : *Jatah kamu tidak terpotong*`))
    }
}

handler.command = ['rch', 'reactch', 'reactchannel', 'addrch']

module.exports = handler
