/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Sistem Ekonomi — Bank
 * .tabung <jumlah> / .deposit <jumlah>
 * .tarik <jumlah> / .withdraw <jumlah>
 */
'use strict'
const eko = require('../../library/ekonomi')

let handler = async (m, { command, args, prefix, Reply }) => {
    const cmd = String(command).toLowerCase()
    const isDeposit = cmd === 'tabung' || cmd === 'deposit'
    const raw = String(args[0] || '').toLowerCase().replace(/[.,]/g, '')
    const u0 = eko.getUser(m.sender)
    const sumber = isDeposit ? u0.money : u0.bank

    let amount
    if (raw === 'all' || raw === 'semua') amount = sumber
    else amount = parseInt(raw, 10)

    if (!amount || amount <= 0 || isNaN(amount)) {
        return Reply(
            `Format: ${prefix}${cmd} <jumlah>\n` +
            `Contoh: ${prefix}${cmd} 50000 atau ${prefix}${cmd} all`
        )
    }

    const result = isDeposit ? eko.deposit(m.sender, amount) : eko.withdraw(m.sender, amount)
    if (!result.success) {
        return Reply(`\`⌜ ❌ Gagal ⌟\`\n> ◦ Info : *${result.message}*`)
    }

    const u = result.user
    return Reply(
        `\`⌜ 🏦 ${isDeposit ? 'Tabung' : 'Tarik'} ⌟\`\n` +
        `> ◦ Status : *Berhasil*\n` +
        `> ◦ Jumlah : *Rp${eko.fmt(amount)}*\n` +
        `> ◦ Cash   : *Rp${eko.fmt(u.money)}*\n` +
        `> ◦ Bank   : *Rp${eko.fmt(u.bank)}*`
    )
}

handler.command = ['tabung', 'deposit', 'tarik', 'withdraw']
handler.help = ['tabung <jumlah>', 'tarik <jumlah>']
handler.tags = ['economy']

module.exports = handler
