/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

// .mutegc [durasi] — tutup grup (hanya admin yang bisa kirim pesan), otomatis dibuka lagi setelah durasi. .unmutegc — buka sekarang.

const mg = require('../../lib/mutegc.cjs')

let handler = async (m, { shorekeeper, text, command, prefix, isCreator, Reply }) => {
    if (!m.isGroup) return Reply(global.mess?.group || 'Fitur ini hanya untuk grup.')
    if (!m.isAdmin && !isCreator) return Reply(global.mess?.admin || 'Fitur ini khusus admin grup.')
    if (!m.isBotAdmin) return Reply(global.mess?.botAdmin || 'Jadikan bot admin dulu supaya bisa mengatur grup.')

    const cmd = String(command).toLowerCase()

    if (cmd === 'unmutegc') {
        try {
            await shorekeeper.groupSettingUpdate(m.chat, 'not_announcement')
            const was = mg.clear(m.chat)
            return Reply(was ? '🔊 *Mute grup dihentikan.* Semua member bisa mengirim pesan lagi.' : '🔊 Grup dibuka. Semua member bisa mengirim pesan.')
        } catch (e) {
            return Reply(`❌ Gagal membuka grup: ${e.message}`)
        }
    }

    const arg = String(text || '').trim()
    let ms = 0
    if (arg) {
        ms = mg.parseDuration(arg)
        if (!ms) return Reply(`Durasi tidak valid.\nContoh: ${prefix}mutegc 30m, ${prefix}mutegc 2h, ${prefix}mutegc 1d\nTanpa durasi = tutup sampai dibuka manual (${prefix}unmutegc).`)
        if (ms < 10e3 || ms > 30 * 864e5) return Reply('Durasi minimal 10 detik dan maksimal 30 hari.')
    }

    try {
        await shorekeeper.groupSettingUpdate(m.chat, 'announcement')
        mg.set(m.chat, ms ? Date.now() + ms : 0, m.sender)
        return Reply(ms
            ? `🔇 *Grup di-mute selama ${mg.fmtDuration(ms)}.*\nHanya admin yang bisa mengirim pesan. Grup dibuka otomatis setelah waktunya habis, atau ketik ${prefix}unmutegc.`
            : `🔇 *Grup di-mute.*\nHanya admin yang bisa mengirim pesan. Buka dengan ${prefix}unmutegc.`)
    } catch (e) {
        return Reply(`❌ Gagal me-mute grup: ${e.message}`)
    }
}

handler.command = ['mutegc', 'unmutegc']
handler.help = ['mutegc [durasi]', 'unmutegc']
handler.tags = ['group']

module.exports = handler
