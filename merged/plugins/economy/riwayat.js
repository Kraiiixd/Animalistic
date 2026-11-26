/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Sistem Ekonomi — Riwayat Transaksi
 * .riwayat / .mutasi / .transaction / .history
 */
'use strict'
const eko = require('../../library/ekonomi')

let handler = async (m, { Reply }) => {
    const u = eko.getUser(m.sender)
    const list = (u.transaksi || []).slice(0, 10)
    if (!list.length) return Reply(`\`⌜ 🧾 Riwayat ⌟\`\n> ◦ Belum ada transaksi tercatat.`)

    const rows = list.map(t => {
        const d = new Date(t.waktu)
        const jam = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        return `> ◦ [${jam}] ${t.teks}`
    }).join('\n')

    return Reply(`\`⌜ 🧾 Riwayat Transaksi ⌟\`\n\n${rows}`)
}

handler.command = ['riwayat', 'mutasi', 'transaction', 'history']
handler.help = ['riwayat']
handler.tags = ['economy']

module.exports = handler
