/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Gacha Nokos (nomor kosong WhatsApp via ZELAPI) + cek bio + auto OTP.
 * Dipindah dari Kaguya MD.
 */

const axios = require('axios')
const {
    BASE_URL, activePolls, claim,
    trackRequest, trackNumber, trackOtp, trackUserNumber, trackUserOtp,
    pickWeighted, pickBest, getJamPercentage, checkMetaBusiness
} = require('../../lib/nokos')

const LIMIT_COST = 4

async function pollOtp(sock, m, numClean, p, maxMinutes = 3, country = '') {
    if (activePolls.has(numClean)) clearInterval(activePolls.get(numClean))

    const startTime = Date.now()
    const maxTime = maxMinutes * 60 * 1000

    const intervalId = setInterval(async () => {
        try {
            if (Date.now() - startTime > maxTime) {
                clearInterval(intervalId)
                activePolls.delete(numClean)
                await sock.sendMessage(m.chat, { text: `⏱️ *WAKTU OTP HABIS*\n\n📞 Nomor: +${numClean}\nWaktu tunggu ${maxMinutes} menit telah berakhir. OTP belum diterima.\n\n▢ ${p}cekotp ${numClean} — 🔄 Cek OTP Manual\n▢ ${p}releasenokos ${numClean} — 🗑 Lepas Nomor\n▢ ${p}gachanokos — 🎲 Gacha Lagi` }, { quoted: m })
                return
            }

            const { data } = await axios.get(`${BASE_URL}/latest_otp`, { params: { number: numClean }, timeout: 10000 })

            if (data && data.success && data.has_otp && data.otp_code) {
                clearInterval(intervalId)
                activePolls.delete(numClean)
                if (country) trackOtp(country)
                trackUserOtp(numClean)
                await sock.sendMessage(m.chat, {
                    text: `🎉 *KODE OTP MASUK OTOMATIS!*\n\n` +
                        `📞 *Nomor:* +${numClean}\n` +
                        `🔑 *Kode OTP:* \`${data.otp_code}\`\n\n` +
                        `💡 Segera gunakan kode OTP ini!\n\n` +
                        `📋 Salin OTP: ${String(data.otp_code)}\n📋 Salin Nomor: ${numClean}\n` +
                        `▢ ${p}releasenokos ${numClean} — 🗑 Lepas Nomor\n▢ ${p}gachanokos — 🎲 Gacha Lagi`
                }, { quoted: m })
            }
        } catch (e) {}
    }, 5000)
    intervalId.unref?.()

    activePolls.set(numClean, intervalId)
}

let handler = async (m, { shorekeeper: sock, text, args, prefix, Reply, isCreator, isPremium, checkLimit, addLimit }) => {
    const p = prefix || '.'

    if (checkLimit(m.sender, isPremium, isCreator)) return Reply(global.mess.limit)

    try {
        let countryInput = text ? text.trim() : ''
        let count = 3

        if (args && args.length > 0) {
            const lastArgNum = parseInt(args[args.length - 1])
            if (!isNaN(lastArgNum) && lastArgNum > 0) {
                count = Math.min(10, Math.max(1, lastArgNum))
                countryInput = args.slice(0, -1).join(' ').trim()
            }
        }

        let targetCountries = []
        try {
            const cRes = await axios.get(`${BASE_URL}/countries?service=WhatsApp`, { timeout: 10000 })
            if (cRes.data && cRes.data.success && Array.isArray(cRes.data.countries)) {
                targetCountries = cRes.data.countries
            }
        } catch (e) {}

        const mode = countryInput.toLowerCase()
        const bestMode = mode === 'auto' || mode === 'top' || mode === 'best'
        const randomMode = mode === 'acak' || mode === 'random'
        if (bestMode || randomMode) countryInput = ''

        const results = []
        let pickedLabel = ''
        for (let i = 0; i < count; i++) {
            let selectedCountry = countryInput
            try {
                if (!selectedCountry && targetCountries.length > 0) {
                    const pick = randomMode
                        ? targetCountries[Math.floor(Math.random() * targetCountries.length)]
                        : (bestMode ? pickBest(targetCountries) : pickWeighted(targetCountries)) || targetCountries[0]
                    selectedCountry = pick.name || pick.code || 'TG'
                    if (!randomMode && pick.score !== undefined && !pickedLabel) pickedLabel = `${selectedCountry} (skor ${pick.score})`
                }
                if (!selectedCountry) selectedCountry = 'TG'

                const res = await axios.post(`${BASE_URL}/request_number`, { service: 'WhatsApp', country: selectedCountry }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 20000
                })

                let data = res.data
                if ((!data || !data.success || !data.number) && targetCountries.length > 0) {
                    for (const cItem of targetCountries) {
                        const fallbackC = cItem.name || cItem.code
                        try {
                            const fbRes = await axios.post(`${BASE_URL}/request_number`, { service: 'WhatsApp', country: fallbackC }, {
                                headers: { 'Content-Type': 'application/json' },
                                timeout: 15000
                            })
                            if (fbRes.data && fbRes.data.success && fbRes.data.number) {
                                data = fbRes.data
                                selectedCountry = fallbackC
                                break
                            }
                        } catch (_) {}
                    }
                }

                trackRequest(selectedCountry, !!(data && data.success && data.number))

                if (data && data.success && data.number) {
                    const numClean = data.number.replace(/\D/g, '')
                    let isRegistered = false
                    let bioText = ''
                    let setAt = null
                    let metaBusiness = false

                    try {
                        const jid = numClean + '@s.whatsapp.net'
                        const [waCheck] = await sock.onWhatsApp(jid)
                        if (waCheck && waCheck.exists) {
                            isRegistered = true
                            try {
                                const statusResult = await sock.fetchStatus(jid)
                                const rawStatus = Array.isArray(statusResult) ? statusResult[0]?.status || statusResult[0] : statusResult?.status || statusResult
                                if (rawStatus && typeof rawStatus === 'object') {
                                    bioText = rawStatus.status !== undefined ? String(rawStatus.status) : (rawStatus.text !== undefined ? String(rawStatus.text) : '')
                                    if (rawStatus.setAt) setAt = new Date(rawStatus.setAt)
                                } else if (typeof rawStatus === 'string') {
                                    bioText = rawStatus
                                }
                            } catch (_) {}

                            try {
                                const busCheck = await checkMetaBusiness(sock, jid)
                                metaBusiness = busCheck.isBusiness
                            } catch (_) {}
                        }
                    } catch (_) {}

                    const jamPct = getJamPercentage(bioText, setAt, metaBusiness)

                    results.push({
                        number: numClean,
                        registered: isRegistered,
                        bio: bioText,
                        setAt,
                        metaBusiness,
                        jamPercentage: jamPct,
                        country: data.country || selectedCountry
                    })

                    trackNumber(selectedCountry, { registered: isRegistered, jam: jamPct })
                    claim(numClean, m)
                    trackUserNumber(m.sender, numClean, selectedCountry)
                    pollOtp(sock, m, numClean, p, 3, selectedCountry)
                }
            } catch (err) {
                console.error(`[GACHANOKOS] gagal request nomor ke-${i + 1}:`, err.message)
            }
            if (i < count - 1) await new Promise(r => setTimeout(r, 500))
        }

        if (results.length === 0) throw new Error('Nomor pada server ZELAPI saat ini sedang habis.')

        addLimit(m.sender, isPremium, isCreator, LIMIT_COST)

        let resText = `🎉 *GACHA NOKOS & CEK BIO (${results.length})*\n`
        resText += pickedLabel ? `🌍 Negara pilihan traffic: *${pickedLabel}*\n\n` : `\n`

        results.forEach((item, idx) => {
            const regStatus = item.registered ? '✅ Terdaftar' : '❌ Belum Terdaftar'
            const bioInfo = item.bio ? `"${item.bio}"` : 'Tanpa Bio'
            const busInfo = item.metaBusiness ? ' MetaBiz' : ''

            resText += `*${idx + 1}.* \`+${item.number}\`\n`
            resText += `   └ ${regStatus} | 📝 ${bioInfo}${busInfo}\n`
            resText += `   └ 📮 ${item.jamPercentage}% Anti-Jam\n\n`
        })

        resText += `\n▢ ${`${p}gachanokos ${countryInput} ${results.length}`.replace(/\s+/g, ' ').trim()} — 🔄 Gacha Lagi\n`
        results.slice(0, 10).forEach((item, idx) => {
            resText += `▢ ${p}cekotp ${item.number} — 📩 Cek OTP #${idx + 1}\n`
            resText += `▢ ${p}releasenokos ${item.number} — 🗑 Lepas #${idx + 1}\n`
        })
        resText += `▢ ${p}traffic — 🚦 Cek Traffic`

        return await sock.sendMessage(m.chat, { text: `${resText.trim()}\n\n📌 Auto OTP aktif 3 menit` }, { quoted: m })

    } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Terjadi kesalahan sistem.'
        return sock.sendMessage(m.chat, { text: `❌ *Error:* ${errorMsg}\n\n▢ ${`${p}gachanokos ${text || ''}`.trim()} — 🔄 Coba Lagi\n▢ ${p}traffic — 🚦 Cek Traffic` }, { quoted: m })
    }
}

handler.command = ['gachanokos']
handler.help = ['gachanokos [negara|auto|acak] [jumlah]']
handler.tags = ['gacha-nokos']

module.exports = handler
