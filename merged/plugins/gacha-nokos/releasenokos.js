/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Lepas nomor nokos yang sudah di-gacha. Dipindah dari Kaguya MD.
 */

const axios = require('axios')
const { BASE_URL, activePolls, owners, myNumbers } = require('../../lib/nokos')

async function releaseOne(numClean) {
    if (activePolls.has(numClean)) {
        clearInterval(activePolls.get(numClean))
        activePolls.delete(numClean)
    }
    const { data } = await axios.post(`${BASE_URL}/release_number`, { number: numClean }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
    })
    if (data && data.success) {
        owners.delete(numClean)
        return true
    }
    throw new Error(data?.error || 'ɢᴀɢᴀʟ melepaskan nomor.')
}

let handler = async (m, { shorekeeper: sock, text, prefix, Reply }) => {
    const p = prefix || '.'

    try {
        if (!text) {
            const list = myNumbers(m)
            if (!list.length) {
                return sock.sendMessage(m.chat, { text: `❌ Masukkan nomor yang akan dilepas!\n*ᴄᴏɴᴛᴏʜ:* \`${p}lepasnokos 6288269202428\`\n\nBelum ada nomor aktif atas nama kamu.\n\n▢ ${p}gachanokos — 🎲 Gacha Nokos\n📋 Salin Format: ${p}lepasnokos 6288269202428` }, { quoted: m })
            }
            const aksi = list.slice(0, 10).map(n => `▢ ${p}releasenokos ${n} — 🗑 Lepas +${n}`)
            if (list.length > 1) aksi.push(`▢ ${p}releasenokos all — 🗑 Lepas Semua (${list.length})`)
            return sock.sendMessage(m.chat, { text: `🗑 *LEPAS NOMOR*\n\nKetik perintah di bawah untuk memilih nomor yang mau dilepas:\n${aksi.join('\n')}` }, { quoted: m })
        }

        const q = text.trim().toLowerCase()
        if (q === 'all' || q === 'semua') {
            const list = myNumbers(m)
            if (!list.length) return Reply('ℹ️ Tidak ada nomor aktif atas nama kamu.')
            await Reply(`⏳ Melepaskan ${list.length} nomor...`)
            let ok = 0
            const failed = []
            for (const n of list) {
                try { await releaseOne(n); ok++ } catch { failed.push(n) }
            }
            return sock.sendMessage(m.chat, {
                text: `✅ *${ok}/${list.length}* nomor berhasil dilepaskan.` +
                    (failed.length ? `\n\n❌ Gagal:\n${failed.map(n => `• +${n}`).join('\n')}` : '') +
                    `\n\n▢ ${p}gachanokos — 🎲 Gacha Nokos`
            }, { quoted: m })
        }

        const numClean = text.replace(/\D/g, '')
        if (numClean.length < 8 || numClean.length > 15) {
            return Reply(`❌ Nomor tidak valid.\n*ᴄᴏɴᴛᴏʜ:* \`${p}lepasnokos 6288269202428\``)
        }
        await Reply(`⏳ Melepaskan nomor +${numClean}...`)
        await releaseOne(numClean)

        return sock.sendMessage(m.chat, { text: `✅ Nomor +${numClean} berhasil dilepaskan.\n\n▢ ${p}gachanokos — 🎲 Gacha Nokos\n▢ ${p}traffic — 🚦 Cek Traffic` }, { quoted: m })

    } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Terjadi kesalahan sistem.'
        const num = (text || '').replace(/\D/g, '')
        return sock.sendMessage(m.chat, { text: `❌ *Error:* ${errorMsg}\n\n${num ? `▢ ${p}releasenokos ${num} — 🔄 Coba Lagi` : `▢ ${p}gachanokos — 🎲 Gacha Nokos`}` }, { quoted: m })
    }
}

handler.command = ['releasenokos', 'lepasnokos']
handler.help = ['releasenokos <nomor|all>', 'lepasnokos <nomor|all>']
handler.tags = ['gacha-nokos']

module.exports = handler
