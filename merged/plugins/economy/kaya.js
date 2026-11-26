/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Sistem Ekonomi — Leaderboard Orang Terkaya
 * .kaya / .rich / .topkaya
 */
'use strict'
const eko = require('../../library/ekonomi')

let handler = async (m, { shorekeeper, Reply }) => {
    const top = eko.leaderboard(10)
    if (!top.length) return Reply('Belum ada data ekonomi sama sekali di bot ini.')

    const medali = ['🥇', '🥈', '🥉']
    const rows = top.map((u, i) => `${medali[i] || `${i + 1}.`} @${u.jid.split('@')[0]} — *Rp${eko.fmt(u.total)}*`).join('\n')

    return shorekeeper.sendMessage(
        m.chat,
        { text: `\`⌜ 🏆 Orang Terkaya ⌟\`\n\n${rows}`, mentions: top.map(u => u.jid) },
        { quoted: m }
    )
}

handler.command = ['kaya', 'rich', 'topkaya', 'richest', 'terkaya']
handler.help = ['kaya']
handler.tags = ['economy']

module.exports = handler
