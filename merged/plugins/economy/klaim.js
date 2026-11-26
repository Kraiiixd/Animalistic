/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Sistem Ekonomi — Klaim Bonus
 * .daily / .weekly / .monthly
 */
'use strict'
const eko = require('../../library/ekonomi')

const CONFIG = {
    daily: { field: 'lastDaily', key: () => eko.todayKey(), reward: [10000, 25000], label: 'harian', next: 'besok (00:00 WIB)' },
    weekly: { field: 'lastWeekly', key: () => eko.weekKey(), reward: [50000, 120000], label: 'mingguan', next: 'minggu depan' },
    monthly: { field: 'lastMonthly', key: () => eko.monthKey(), reward: [200000, 500000], label: 'bulanan', next: 'bulan depan' }
}

function randReward([min, max]) {
    return Math.floor(min + Math.random() * (max - min + 1))
}

let handler = async (m, { command, Reply }) => {
    const cmd = String(command).toLowerCase()
    const cfg = CONFIG[cmd]
    if (!cfg) return

    const u = eko.getUser(m.sender)
    const nowKey = cfg.key()
    if (u[cfg.field] === nowKey) {
        return Reply(
            `\`⌜ ⏳ Sudah Klaim ⌟\`\n` +
            `> ◦ Kamu sudah klaim bonus ${cfg.label} ini.\n` +
            `> ◦ Coba lagi ${cfg.next}.`
        )
    }

    const reward = randReward(cfg.reward)
    u[cfg.field] = nowKey
    u.money += reward
    eko.logTransaksi(u, `Klaim bonus ${cfg.label} +Rp${eko.fmt(reward)}`)
    eko.saveUser(m.sender, u)

    return Reply(
        `\`⌜ 🎁 Bonus ${cfg.label[0].toUpperCase() + cfg.label.slice(1)} ⌟\`\n` +
        `> ◦ Status : *Berhasil*\n` +
        `> ◦ Dapat  : *Rp${eko.fmt(reward)}*\n` +
        `> ◦ Saldo  : *Rp${eko.fmt(u.money)}*`
    )
}

handler.command = ['daily', 'weekly', 'monthly']
handler.help = ['daily', 'weekly', 'monthly']
handler.tags = ['economy']

module.exports = handler
