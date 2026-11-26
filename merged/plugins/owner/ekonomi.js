/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Sistem Ekonomi — Kelola Saldo (khusus Owner)
 * .addmoney <@tag/nomor/reply> <jumlah>
 * .delmoney <@tag/nomor/reply> <jumlah>
 * .addbank <@tag/nomor/reply> <jumlah>
 * .delbank <@tag/nomor/reply> <jumlah>
 * .resetsaldo <@tag/nomor/reply>
 */
'use strict'
const eko = require('../../library/ekonomi')

function resolveTarget(m, args) {
    if (m.mentionedJid && m.mentionedJid[0]) return { target: m.mentionedJid[0], rest: args.slice(1) }
    if (m.quoted && m.quoted.sender) return { target: m.quoted.sender, rest: args.slice(0) }
    if (args[0] && /^\+?[0-9]{6,15}$/.test(args[0].replace(/[^0-9+]/g, ''))) {
        return { target: args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net', rest: args.slice(1) }
    }
    return { target: '', rest: args }
}

let handler = async (m, { command, args, prefix, isCreator, Reply }) => {
    if (!isCreator) return Reply(global.mess.owner)
    const cmd = String(command).toLowerCase()

    const { target, rest } = resolveTarget(m, args)
    if (!target) {
        return Reply(
            `Format: ${prefix}${cmd} <@tag/nomor> <jumlah>\n` +
            `Atau reply pesan orangnya lalu ketik: ${prefix}${cmd} <jumlah>`
        )
    }

    if (cmd === 'resetsaldo') {
        eko.saveUser(target, { money: 0, bank: 0, lastDaily: 0, lastWeekly: 0, lastMonthly: 0, lastKerja: 0, inventory: [], transaksi: [] })
        return Reply(`\`⌜ ✅ Reset Saldo ⌟\`\n> ◦ Saldo @${eko.cleanJid(target).split('@')[0]} berhasil direset ke 0.`, [target])
    }

    const amount = parseInt(String(rest[0] || '').replace(/[^0-9]/g, ''), 10)
    if (!amount || amount <= 0) {
        return Reply(`Jumlah tidak valid.\nContoh: ${prefix}${cmd} @tag 100000`)
    }

    let u
    if (cmd === 'addmoney') u = eko.addMoney(target, amount)
    else if (cmd === 'delmoney') u = eko.addMoney(target, -amount)
    else if (cmd === 'addbank') u = eko.addBank(target, amount)
    else if (cmd === 'delbank') u = eko.addBank(target, -amount)

    eko.logTransaksi(u, `${cmd === 'addmoney' || cmd === 'addbank' ? '+' : '-'}Rp${eko.fmt(amount)} (owner)`)
    eko.saveUser(target, u)

    return Reply(
        `\`⌜ ✅ Berhasil ⌟\`\n` +
        `> ◦ Target : @${eko.cleanJid(target).split('@')[0]}\n` +
        `> ◦ Cash   : *Rp${eko.fmt(u.money)}*\n` +
        `> ◦ Bank   : *Rp${eko.fmt(u.bank)}*`,
        [target]
    )
}

handler.command = ['addmoney', 'delmoney', 'addbank', 'delbank', 'resetsaldo']
handler.help = ['addmoney <@tag> <jumlah>', 'delmoney <@tag> <jumlah>']
handler.tags = ['owner', 'economy']

module.exports = handler
