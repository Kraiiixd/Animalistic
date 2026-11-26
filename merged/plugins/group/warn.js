/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Sistem Warn — diadaptasi dari Renzona MD V2
 * .warn <@tag/nomor/reply> [alasan] — tambah warn (admin)
 * .unwarn <@tag/nomor/reply> — kurangi 1 warn (admin)
 * .cekwarn [@tag] — cek jumlah warn (siapa saja, default diri sendiri)
 * .listwarn — lihat semua member yang punya warn di grup ini (admin)
 * .resetwarn <@tag/nomor/reply/all> — reset warn (admin)
 * .setmaxwarn <jumlah> — atur batas maksimal warn sebelum dikick (admin)
 */
'use strict'
const warnDb = require('../../library/warn')

function resolveTarget(m, args) {
    if (m.mentionedJid && m.mentionedJid[0]) return { target: m.mentionedJid[0], rest: args.slice(1) }
    if (m.quoted && m.quoted.sender) return { target: m.quoted.sender, rest: args.slice(0) }
    if (args[0] && /^\+?[0-9]{6,15}$/.test(args[0].replace(/[^0-9+]/g, ''))) {
        return { target: args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net', rest: args.slice(1) }
    }
    return { target: '', rest: args }
}

let handler = async (m, { shorekeeper, command, args, prefix, isCreator, Reply }) => {
    if (!m.isGroup) return Reply(global.mess?.group || 'Fitur ini hanya untuk grup.')
    const cmd = String(command).toLowerCase()

    // ── cekwarn: boleh siapa saja, target opsional ──
    if (cmd === 'cekwarn' || cmd === 'mywarn') {
        const { target } = resolveTarget(m, args)
        const jid = target || m.sender
        const u = warnDb.getWarn(m.chat, jid)
        const max = warnDb.getMaxWarn(m.chat)
        return shorekeeper.sendMessage(
            m.chat,
            { text: `\`⌜ ⚠️ Cek Warn ⌟\`\n> ◦ User  : @${jid.split('@')[0]}\n> ◦ Warn  : *${u.count}/${max}*`, mentions: [jid] },
            { quoted: m }
        )
    }

    // sisanya khusus admin grup / owner
    if (!m.isAdmin && !isCreator) return Reply(global.mess?.admin || 'Fitur ini khusus admin grup.')

    if (cmd === 'listwarn') {
        const list = warnDb.listWarn(m.chat)
        if (!list.length) return Reply(`\`⌜ ⚠️ List Warn ⌟\`\n> ◦ Belum ada member yang kena warn di grup ini.`)
        const max = warnDb.getMaxWarn(m.chat)
        const rows = list.map((u, i) => `${i + 1}. @${u.jid.split('@')[0]} — ${u.count}/${max}`).join('\n')
        return shorekeeper.sendMessage(
            m.chat,
            { text: `\`⌜ ⚠️ List Warn ⌟\`\n\n${rows}`, mentions: list.map(u => u.jid) },
            { quoted: m }
        )
    }

    if (cmd === 'setmaxwarn') {
        const amount = parseInt(args[0], 10)
        if (!amount || amount < 1) return Reply(`Format: ${prefix}setmaxwarn <jumlah>\nContoh: ${prefix}setmaxwarn 3`)
        const max = warnDb.setMaxWarn(m.chat, amount)
        return Reply(`\`⌜ ✅ Berhasil ⌟\`\n> ◦ Batas maksimal warn di grup ini diatur ke *${max}*.`)
    }

    const { target, rest } = resolveTarget(m, args)

    if (cmd === 'resetwarn') {
        if (String(args[0] || '').toLowerCase() === 'all' || String(args[0] || '').toLowerCase() === 'semua') {
            warnDb.resetAllWarn(m.chat)
            return Reply(`\`⌜ ✅ Berhasil ⌟\`\n> ◦ Semua data warn di grup ini sudah direset.`)
        }
        if (!target) return Reply(`Format: ${prefix}resetwarn <@tag/nomor/reply> atau ${prefix}resetwarn all`)
        warnDb.resetWarn(m.chat, target)
        return Reply(`\`⌜ ✅ Berhasil ⌟\`\n> ◦ Warn @${target.split('@')[0]} sudah direset.`, [target])
    }

    if (!target) {
        return Reply(
            `Format: ${prefix}${cmd} <@tag/nomor> [alasan]\n` +
            `Atau reply pesan orangnya lalu ketik: ${prefix}${cmd} [alasan]`
        )
    }

    if (cmd === 'unwarn') {
        const res = warnDb.removeWarn(m.chat, target, 1)
        return Reply(`\`⌜ ✅ Berhasil ⌟\`\n> ◦ Warn @${target.split('@')[0]} dikurangi.\n> ◦ Sisa  : *${res.count}/${res.max}*`, [target])
    }

    // cmd === 'warn' / 'addwarn'
    const reason = rest.join(' ').trim() || '-'
    const res = warnDb.addWarn(m.chat, target, reason, m.sender)

    if (res.reachedMax) {
        warnDb.resetWarn(m.chat, target)
        let kicked = false
        if (m.isBotAdmin) {
            try {
                await shorekeeper.groupParticipantsUpdate(m.chat, [target], 'remove')
                kicked = true
            } catch (e) {}
        }
        return shorekeeper.sendMessage(
            m.chat,
            {
                text: `\`⌜ 🚫 Warn Maksimal ⌟\`\n` +
                    `> ◦ User   : @${target.split('@')[0]}\n` +
                    `> ◦ Warn   : *${res.count}/${res.max}*\n` +
                    `> ◦ Alasan : ${reason}\n` +
                    `> ◦ Aksi   : ${kicked ? '*Dikeluarkan dari grup*' : '*Gagal dikeluarkan (bot bukan admin)*'}`,
                mentions: [target]
            },
            { quoted: m }
        )
    }

    return shorekeeper.sendMessage(
        m.chat,
        {
            text: `\`⌜ ⚠️ Warn ⌟\`\n` +
                `> ◦ User   : @${target.split('@')[0]}\n` +
                `> ◦ Warn   : *${res.count}/${res.max}*\n` +
                `> ◦ Alasan : ${reason}`,
            mentions: [target]
        },
        { quoted: m }
    )
}

handler.command = ['warn', 'addwarn', 'unwarn', 'cekwarn', 'mywarn', 'listwarn', 'resetwarn', 'setmaxwarn']
handler.help = ['warn <@tag> [alasan]', 'unwarn <@tag>', 'cekwarn [@tag]', 'listwarn', 'resetwarn <@tag/all>', 'setmaxwarn <jumlah>']
handler.tags = ['group']

module.exports = handler
