/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Sistem Ekonomi — Transfer
 * .transfer <@tag/nomor/reply> <jumlah>
 */
'use strict'
const eko = require('../../library/ekonomi')

let handler = async (m, { args, prefix, Reply }) => {
    let target = ''
    let amountArg = ''

    if (m.mentionedJid && m.mentionedJid[0]) {
        target = m.mentionedJid[0]
        amountArg = args[1]
    } else if (m.quoted && m.quoted.sender) {
        target = m.quoted.sender
        amountArg = args[0]
    } else if (args[0] && /^\+?[0-9]{6,15}$/.test(args[0].replace(/[^0-9+]/g, ''))) {
        target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        amountArg = args[1]
    }

    if (!target) {
        return Reply(
            `Format: ${prefix}transfer <@tag/nomor> <jumlah>\n` +
            `Atau reply pesan orangnya lalu ketik: ${prefix}transfer <jumlah>`
        )
    }

    const amount = parseInt(String(amountArg || '').replace(/[^0-9]/g, ''), 10)
    if (!amount || amount <= 0) {
        return Reply(`Jumlah transfer tidak valid.\nContoh: ${prefix}transfer @tag 50000`)
    }

    const targetClean = eko.cleanJid(target)
    const senderClean = eko.cleanJid(m.sender)
    if (targetClean === senderClean) {
        return Reply('Gak bisa transfer ke diri sendiri 😅')
    }

    const result = eko.transfer(m.sender, target, amount)
    if (!result.success) {
        return Reply(`\`⌜ ❌ Gagal ⌟\`\n> ◦ Info : *${result.message}*`)
    }

    const uFrom = eko.getUser(m.sender)
    return Reply(
        `\`⌜ 💸 Transfer ⌟\`\n` +
        `> ◦ Status  : *Berhasil*\n` +
        `> ◦ Ke      : @${targetClean.split('@')[0]}\n` +
        `> ◦ Jumlah  : *Rp${eko.fmt(amount)}*\n` +
        `> ◦ Sisa    : *Rp${eko.fmt(uFrom.money)}*`,
        [m.sender, target]
    )
}

handler.command = ['transfer', 'pay', 'kirimsaldo']
handler.help = ['transfer <@tag> <jumlah>']
handler.tags = ['economy']

module.exports = handler
