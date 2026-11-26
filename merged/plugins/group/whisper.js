/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * .whisper — bisikan rahasia di grup via sBPR (Send Batch Private Relay).
 * Credit: Kureza (port ke Hitoshi) • library sBPR: Nixel • fitur asal: Ichigo MD
 */

let _spr = null
const loadSpr = async () => (_spr ||= await import('../../lib/spr/sbpr.mjs'))
const num = (j) => String(j || '').split('@')[0].split(':')[0]

let handler = async (m, { shorekeeper, text, prefix, command, Reply }) => {
    if (!m.isGroup) return Reply(global.mess?.group || 'Fitur ini hanya untuk grup.')
    if (!text || !text.includes('|')) {
        return Reply(
            `❌ *Format bisikan salah!*\n\n` +
            `> *${prefix + command} @target | pesan rahasianya*\n\n` +
            `> Contoh: *${prefix + command} @628123456789 | jangan bilang siapa-siapa ya*`
        )
    }

    const [targetRaw, ...parts] = text.split('|')
    const secret = parts.join('|').trim()
    if (!secret) return Reply('❌ Isi pesan rahasianya kosong.')

    const digits = targetRaw.replace(/[^0-9]/g, '')
    const targetJid = m.mentionedJid?.[0] || (digits ? digits + '@s.whatsapp.net' : null)
    if (!targetJid) return Reply('❌ Tag atau nomor targetnya mana nih? Coba benerin formatnya.')

    const senderNum = num(m.sender)
    const targetNum = num(targetJid)
    if (targetNum === senderNum) return Reply('⚠️ Bisik-bisik ke diri sendiri? Pilih target lain ya.')

    try {
        await Reply(`⏳ Mengirim bisikan rahasia ke @${targetNum}...`)
        const { sendBatchPrivateRelayUnified } = await loadSpr()
        await sendBatchPrivateRelayUnified(
            shorekeeper,
            m.chat,
            [targetJid],
            {
                extendedTextMessage: {
                    text: `👀 *ADA BISIKAN RAHASIA BUAT KAMU!* 👀\n\n` +
                          `Seseorang (@${senderNum}) membisiki kamu lewat grup:\n` +
                          `> _"${secret}"_\n\n` +
                          `🤫 _Dikirim lewat Private Relay (sBPR) — Kureza MD._`,
                    contextInfo: { mentionedJid: [m.sender] }
                }
            },
            { verbose: false, msgForOthers: '🤫 *[Ssstt... seseorang baru saja mengirim bisikan di grup ini]*' }
        )
        return Reply(`✅ *Bisikan terkirim!*\nTarget: @${targetNum}\nHanya dia yang bisa membaca isinya. 🤫`)
    } catch (e) {
        console.error('[WHISPER Error]', e)
        return Reply('⚠️ Gagal mengirim bisikan: ' + (e?.message || e))
    }
}

handler.help = ['whisper']
handler.tags = ['group']
handler.command = ['whisper', 'rahasia']
handler.group = true

module.exports = handler
