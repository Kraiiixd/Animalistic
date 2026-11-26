/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Cek OTP terbaru untuk nomor hasil gachanokos. Dipindah dari Kaguya MD.
 */

const axios = require('axios')
const { BASE_URL, activePolls, myNumbers } = require('../../lib/nokos')

const LIMIT_COST = 2

let handler = async (m, { shorekeeper: sock, text, prefix, Reply, isCreator, isPremium, checkLimit, addLimit }) => {
    const p = prefix || '.'

    try {
        if (!text) {
            const list = myNumbers(m)
            if (!list.length) {
                return sock.sendMessage(m.chat, { text: `❌ Masukkan nomor!\n*ᴄᴏɴᴛᴏʜ:* \`${p}cekotp 6288269202428\`\n\nBelum ada nomor aktif atas nama kamu.\n\n▢ ${p}gachanokos — 🎲 Gacha Nokos\n📋 Salin Format: ${p}cekotp 6288269202428` }, { quoted: m })
            }
            const rows = list.slice(0, 10).map(n => `▢ ${p}cekotp ${n} — +${n}`)
            return sock.sendMessage(m.chat, { text: `📞 *NOMOR AKTIF KAMU (${list.length})*\n\nPilih nomor yang mau dicek OTP-nya.\n\n${rows.join('\n')}\n\n▢ ${p}gachanokos — 🎲 Gacha Nokos` }, { quoted: m })
        }

        const numClean = text.replace(/\D/g, '')
        if (numClean.length < 8 || numClean.length > 15) {
            return Reply(`❌ Nomor tidak valid.\n*ᴄᴏɴᴛᴏʜ:* \`${p}cekotp 6288269202428\``)
        }

        if (checkLimit(m.sender, isPremium, isCreator)) return Reply(global.mess.limit)
        await Reply(`🔍 Memeriksa OTP untuk nomor +${numClean}...`)

        const { data } = await axios.get(`${BASE_URL}/latest_otp`, { params: { number: numClean }, timeout: 15000 })

        if (!data || !data.success) throw new Error(data?.error || 'ɢᴀɢᴀʟ memeriksa OTP.')

        addLimit(m.sender, isPremium, isCreator, LIMIT_COST)

        if (data.has_otp && data.otp_code) {
            if (activePolls.has(numClean)) {
                clearInterval(activePolls.get(numClean))
                activePolls.delete(numClean)
            }
            return sock.sendMessage(m.chat, {
                text: `📩 *OTP DITERIMA!*\n\n` +
                    `📞 *Nomor:* +${numClean}\n` +
                    `🔑 *Kode OTP:* \`${data.otp_code}\`\n` +
                    `🕒 *Waktu:* Baru saja\n\n` +
                    `📋 Salin OTP: ${String(data.otp_code)}\n📋 Salin Nomor: ${numClean}\n▢ ${p}releasenokos ${numClean} — 🗑 Lepas Nomor\n▢ ${p}gachanokos — 🎲 Gacha Nokos`
            }, { quoted: m })
        }

        const monitoring = activePolls.has(numClean)
        return sock.sendMessage(m.chat, {
            text: `⏳ *BELUM ADA OTP*\n\n` +
                `📞 *Nomor:* +${numClean}\n` +
                (monitoring
                    ? `ℹ️ Kode OTP belum masuk. Bot masih memantau OTP secara otomatis.`
                    : `ℹ️ Kode OTP belum masuk. Pemantauan otomatis tidak aktif untuk nomor ini, tekan *Cek Lagi* untuk memeriksa ulang.`) +
                `\n\n▢ ${p}cekotp ${numClean} — 🔄 Cek Lagi\n📋 Salin Nomor: ${numClean}\n▢ ${p}releasenokos ${numClean} — 🗑 Lepas Nomor`
        }, { quoted: m })

    } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Terjadi kesalahan sistem.'
        const num = (text || '').replace(/\D/g, '')
        return sock.sendMessage(m.chat, { text: `❌ *Error:* ${errorMsg}\n\n${num ? `▢ ${p}cekotp ${num} — 🔄 Coba Lagi` : `▢ ${p}gachanokos — 🎲 Gacha Nokos`}` }, { quoted: m })
    }
}

handler.command = ['cekotp']
handler.help = ['cekotp <nomor>']
handler.tags = ['gacha-nokos']

module.exports = handler
