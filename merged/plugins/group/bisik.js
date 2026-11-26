/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * .bisik — kirim pesan rahasia di grup via sBPR (Send Batch Private Relay).
 * Hanya target yang bisa membaca isinya; member lain melihat pesan kamuflase.
 * Credit: Kureza (port ke Hitoshi) • library sBPR: Nixel • fitur asal: Ichigo MD
 */

let _spr = null
const loadSpr = async () => (_spr ||= await import('../../lib/spr/sbpr.mjs'))

let handler = async (m, { shorekeeper, text, prefix, command, Reply }) => {
    if (!m.isGroup) return Reply(global.mess?.group || 'Fitur ini hanya untuk grup.')

    const targetJid = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0]) || null
    if (!targetJid) {
        return Reply(
            `❌ *Format salah!*\n\n` +
            `> *Cara 1 (Reply):* balas pesan target lalu ketik:\n> *${prefix + command} <pesan rahasia>*\n\n` +
            `> *Cara 2 (Tag):*\n> *${prefix + command} @target <pesan rahasia>*`
        )
    }

    let secret = String(text || '').trim()
    if (!m.quoted && m.mentionedJid?.length) secret = secret.replace(/@\d+/g, '').trim()
    if (!secret) return Reply(`❌ *Tuliskan isi pesan rahasianya!*\n\n> Contoh: *${prefix + command} besok jadi nongkrong ga?*`)

    const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
    await react('⏳')

    try {
        const { sendBatchPrivateRelayUnified } = await loadSpr()
        await sendBatchPrivateRelayUnified(
            shorekeeper,
            m.chat,
            [targetJid],
            { extendedTextMessage: { text: secret, contextInfo: { mentionedJid: m.mentionedJid || [] } } },
            { msgForOthers: '🔒 _Seseorang mengirim pesan rahasia._', verbose: false }
        )
        await react('✅')
    } catch (e) {
        console.error('[Bisik sBPR Error]', e)
        await react('❌')
        return Reply(`⚠️ *Gagal mengirim pesan rahasia.*\n\n> Error: ${e?.message || e}`)
    }
}

handler.help = ['bisik']
handler.tags = ['group']
handler.command = ['bisik', 'bisikreply', 'secretreply', 'hiddenreply']
handler.group = true

module.exports = handler
