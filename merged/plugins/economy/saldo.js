/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Sistem Ekonomi — Saldo
 * .saldo / .money / .bal — cek cash & bank milik sendiri
 */
'use strict'
const eko = require('../../library/ekonomi')

let handler = async (m, { Reply }) => {
    const u = eko.getUser(m.sender)
    const total = u.money + u.bank
    return Reply(
        `\`⌜ 💰 Dompet ⌟\`\n` +
        `> ◦ Cash  : *Rp${eko.fmt(u.money)}*\n` +
        `> ◦ Bank  : *Rp${eko.fmt(u.bank)}*\n` +
        `> ◦ Total : *Rp${eko.fmt(total)}*\n\n` +
        `> Ketik *.ekonomi* buat lihat daftar fitur ekonomi.`
    )
}

handler.command = ['saldo', 'money', 'bal', 'cekdompet', 'dompet']
handler.help = ['saldo']
handler.tags = ['economy']

module.exports = handler
