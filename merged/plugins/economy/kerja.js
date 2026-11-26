/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Sistem Ekonomi — Kerja
 * .kerja / .work — kerja buat dapat cash, cooldown 1 jam
 */
'use strict'
const eko = require('../../library/ekonomi')

const COOLDOWN_MS = 60 * 60 * 1000 // 1 jam
const REWARD = [5000, 20000]
const JOBS = [
    'nganterin pesanan ojol', 'jagain warung kopi', 'ngoding fitur bot',
    'nyuci motor tetangga', 'jualan gorengan di depan gang', 'jadi kurir paket',
    'bantuin bongkar barang di pasar', 'live streaming game'
]

function fmtDuration(ms) {
    const s = Math.ceil(ms / 1000)
    const h = Math.floor(s / 3600)
    const mnt = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const parts = []
    if (h) parts.push(`${h} jam`)
    if (mnt) parts.push(`${mnt} menit`)
    if (!h && sec) parts.push(`${sec} detik`)
    return parts.join(' ') || 'sebentar lagi'
}

let handler = async (m, { Reply }) => {
    const u = eko.getUser(m.sender)
    const now = Date.now()
    const sisa = COOLDOWN_MS - (now - (u.lastKerja || 0))
    if (sisa > 0) {
        return Reply(
            `\`⌜ ⏳ Masih Capek ⌟\`\n` +
            `> ◦ Kamu baru saja kerja.\n` +
            `> ◦ Coba lagi dalam *${fmtDuration(sisa)}*.`
        )
    }

    const reward = Math.floor(REWARD[0] + Math.random() * (REWARD[1] - REWARD[0] + 1))
    const job = JOBS[Math.floor(Math.random() * JOBS.length)]
    u.lastKerja = now
    u.money += reward
    eko.logTransaksi(u, `Kerja (${job}) +Rp${eko.fmt(reward)}`)
    eko.saveUser(m.sender, u)

    return Reply(
        `\`⌜ 💼 Kerja ⌟\`\n` +
        `> ◦ Kamu habis *${job}*.\n` +
        `> ◦ Dapat  : *Rp${eko.fmt(reward)}*\n` +
        `> ◦ Saldo  : *Rp${eko.fmt(u.money)}*`
    )
}

handler.command = ['kerja', 'work']
handler.help = ['kerja']
handler.tags = ['economy']

module.exports = handler
