/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

// .badge — ganti stiker badge (reply stiker) / .badge on | off | status

const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { saveBadge, setAuto, getAuto } = require('../../lib/autobadge.cjs')

let handler = async (m, { shorekeeper, text, isCreator, prefix, Reply }) => {
    if (!isCreator) return Reply('*Khusus Owner*')
    const arg = String(text || '').trim().toLowerCase()

    if (/^(on|off|status)$/.test(arg)) {
        if (arg === 'on') setAuto(shorekeeper, true)
        else if (arg === 'off') setAuto(shorekeeper, false)
        const st = getAuto(shorekeeper) ? 'ON' : 'OFF'
        return Reply(arg === 'status' ? `ℹ️ *Auto Badge:* ${st}` : `✅ *Auto Badge ${st}*\nPengaturan hanya berlaku untuk bot ini.`)
    }

    const sticker = m.msg?.contextInfo?.quotedMessage?.stickerMessage || m.quoted?.msg?.stickerMessage || (m.quoted?.mtype === 'stickerMessage' ? m.quoted.msg || m.quoted : null)
    if (!sticker) return Reply(`❌ Reply sebuah stiker untuk mengganti badge.\n\nPengaturan: ${prefix}badge on / off / status`)

    const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
    await react('⏱️')
    try {
        const stream = await downloadContentFromMessage(sticker, 'sticker')
        const chunks = []
        for await (const c of stream) chunks.push(c)
        const buf = Buffer.concat(chunks)
        if (!buf.length) throw new Error('Gagal mengunduh file stiker.')

        const animated = !!sticker.isAnimated
        saveBadge(buf, animated)
        await react('✅')
        return Reply(`✅ *Badge berhasil diganti!*\n\n*Tipe:* ${animated ? 'Animasi 🎞️' : 'Statis 🖼️'}\n*Ukuran:* ${(buf.length / 1024).toFixed(1)} KB\n\nPengaturan Auto Badge: ${prefix}badge on / off / status`)
    } catch (e) {
        console.error('[badge] Error:', e)
        await react('❌')
        return Reply(`❌ Gagal menyimpan badge: ${e.message}`)
    }
}

handler.command = ['badge']
handler.help = ['badge on|off|status']
handler.tags = ['owner']
handler.owner = true

module.exports = handler
