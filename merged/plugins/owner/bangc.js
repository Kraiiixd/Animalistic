/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

// .bangc [id grup] — ban grup (bot diam di grup itu) | .unbangc [id grup] | .listbangc

const { isBanned, ban, unban, list } = require('../../lib/bangc.cjs')

const pickJid = (m, text) => {
    const raw = String(text || '').trim().split(/\s+/)[0] || ''
    if (/@g\.us$/.test(raw)) return raw
    if (/^\d{10,}-?\d*$/.test(raw)) return raw.includes('@') ? raw : `${raw}@g.us`
    return m.isGroup ? m.chat : ''
}

let handler = async (m, { shorekeeper, text, command, prefix, isCreator, Reply }) => {
    if (!isCreator) return Reply('*Khusus Owner*')
    const cmd = String(command).toLowerCase()

    if (cmd === 'listbangc') {
        const d = list()
        const ids = Object.keys(d)
        if (!ids.length) return Reply('Tidak ada grup yang di-ban.')
        const lines = await Promise.all(ids.map(async (id, i) => {
            let name = d[id].name || ''
            if (!name) {
                try { name = (await shorekeeper.groupMetadata(id)).subject } catch {}
            }
            return `${i + 1}. ${name || '(nama tidak diketahui)'}\n   ${id}`
        }))
        return Reply(`*Daftar Grup Di-ban (${ids.length})*\n\n${lines.join('\n')}`)
    }

    const jid = pickJid(m, text)
    if (!jid) return Reply(`Pakai di dalam grup, atau sertakan ID grup.\nContoh: ${prefix}${cmd} 1203630000000000@g.us`)

    if (cmd === 'unbangc') {
        return Reply(unban(jid) ? `✅ Grup di-unban:\n${jid}` : 'Grup ini tidak sedang di-ban.')
    }

    // bangc
    let name = ''
    try { name = (await shorekeeper.groupMetadata(jid)).subject } catch {}
    if (isBanned(jid)) return Reply('Grup ini sudah di-ban.')
    ban(jid, { name })
    return Reply(`🚫 Grup di-ban${name ? `: *${name}*` : ''}\n${jid}\n\nBot tidak akan merespons command di grup ini (kecuali dari owner). Unban: ${prefix}unbangc${m.isGroup && jid === m.chat ? '' : ' ' + jid}`)
}

handler.command = ['bangc', 'unbangc', 'listbangc']
handler.help = ['bangc [id grup]', 'unbangc [id grup]', 'listbangc']
handler.tags = ['owner']
handler.owner = true

module.exports = handler
