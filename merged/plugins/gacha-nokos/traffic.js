/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Traffic / ranking negara untuk gachanokos. Dipindah dari Kaguya MD.
 */

const axios = require('axios')
const { BASE_URL, rankCountries, gradeOf, getHistory } = require('../../lib/nokos')

const bar = (score) => '█'.repeat(Math.round(score / 10)) + '░'.repeat(10 - Math.round(score / 10))
const pct = (v) => v === null || v === undefined ? '-' : `${Math.round(v * 100)}%`

let handler = async (m, { shorekeeper: sock, text, prefix, Reply }) => {
    const p = prefix || '.'

    try {
        await Reply('🚦 Mengambil data traffic ZELAPI...')

        const [statRes, countryRes] = await Promise.allSettled([
            axios.get(`${BASE_URL}/stats/detailed`, { params: { period: 'daily' }, timeout: 10000 }),
            axios.get(`${BASE_URL}/countries`, { params: { service: 'WhatsApp' }, timeout: 10000 })
        ])

        const stats = statRes.status === 'fulfilled' ? statRes.value.data : null
        const countries = (countryRes.status === 'fulfilled' && countryRes.value.data?.success && Array.isArray(countryRes.value.data.countries))
            ? countryRes.value.data.countries
            : []

        if (!countries.length) throw new Error('Data negara ZELAPI tidak tersedia. Coba lagi nanti.')

        const ranked = rankCountries(countries)
        if (!ranked.length) throw new Error('Semua negara sedang kehabisan nomor.')

        const q = (text || '').trim().toLowerCase()
        if (q && !/^\d+$/.test(q)) {
            const c = ranked.find(x => String(x.name).toLowerCase() === q) || ranked.find(x => String(x.name).toLowerCase().includes(q))
            if (!c) throw new Error(`Negara "${text.trim()}" tidak ditemukan / stok kosong.`)
            const h = getHistory(c.name)
            const out =
                `🚦 *TRAFFIC ${String(c.name).toUpperCase()}*\n\n` +
                `${gradeOf(c.score)}  ${bar(c.score)} *${c.score}/100*\n` +
                `📞 Stok nomor: *${c.count ?? '?'}*\n` +
                (h
                    ? `🎲 Gacha dari bot: *${h.req}* percobaan, *${h.ok}* dapat nomor (${pct(h.okRate)})\n` +
                      `✅ Terdaftar WA: ${pct(h.regRate)}\n` +
                      `📩 OTP masuk: *${h.otp}* (${pct(h.otpRate)} dari nomor)\n` +
                      `📅 Hari ini: ${h.today.req} request • ${h.today.ok} nomor • ${h.today.otp} OTP\n` +
                      (h.jam !== null ? `📮 Rata-rata anti-jam: ${h.jam}%\n` : '')
                    : `_Belum ada riwayat gacha untuk negara ini._\n`)
            return sock.sendMessage(m.chat, { text: `${out.trim()}\n\n▢ ${p}gachanokos ${c.name} 3 — 🎲 Gacha ${c.name} x3\n▢ ${p}traffic — 🚦 Semua Traffic` }, { quoted: m })
        }

        const top = ranked.slice(0, 10)
        let out = `🚦 *TRAFFIC NOKOS WHATSAPP*\n\n`
        if (stats && stats.otp_count !== undefined) {
            out += `📩 OTP masuk hari ini: *${stats.otp_count}*\n`
            out += `📞 Nomor tersedia: *${stats.available_numbers}*\n\n`
        }
        top.forEach((c, i) => {
            const h = c.history
            out += `*${i + 1}.* ${c.name} — ${gradeOf(c.score)}\n`
            out += `   └ ${bar(c.score)} *${c.score}* | 📞 ${c.count ?? '?'} nomor`
            if (h && h.ok) out += ` | 📩 OTP ${pct(h.otpRate)}`
            out += `\n`
        })
        out += `\n_Skor = stok nomor + OTP masuk + keberhasilan dapat nomor. Makin tinggi makin enak digacha._`

        out += `\n\nKetik perintah di bawah untuk gacha:\n`
        out += `▢ ${p}gachanokos ${top[0].name} 3 — 🏆 Gacha ${top[0].name} x3\n`
        out += `▢ ${p}gachanokos auto 3 — 🤖 Gacha Otomatis\n`
        top.forEach(c => {
            out += `▢ ${p}gachanokos ${c.name} 3 — ${String(c.name).slice(0, 24)} (${gradeOf(c.score)} • skor ${c.score} • ${c.count ?? '?'} nomor)\n`
        })
        out += `▢ ${p}traffic — 🔄 Refresh`

        return await sock.sendMessage(m.chat, { text: `${out.trim()}\n\n🚦 Traffic ZELAPI` }, { quoted: m })

    } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Terjadi kesalahan sistem.'
        return sock.sendMessage(m.chat, { text: `❌ *Error:* ${errorMsg}\n\n▢ ${`${p}traffic ${text || ''}`.trim()} — 🔄 Coba Lagi` }, { quoted: m })
    }
}

handler.command = ['traffic', 'trafficnokos', 'trafficgacha']
handler.help = ['traffic [negara]']
handler.tags = ['gacha-nokos']

module.exports = handler
