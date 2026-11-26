/**
 * © Kureza MD — Hitoshi MD V1
 * Diadaptasi dari DeniaMD (plugins/canvas/fakewa.js)
 *
 * .fakewa <nama>|<nomor>|[status] (reply foto) — bikin profil WA palsu, render lokal pakai @napi-rs/canvas
 */
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const axios = require('axios')

const BG_URL = 'https://raw.githubusercontent.com/kayzzaoshi-code/Uploader/main/file_1772230249397.jpeg'

function formatNomor(n) {
    if (n.startsWith('62') && n.length >= 10) return `+62 ${n.slice(2, 5)}-${n.slice(5, 9)}-${n.slice(9)}`
    if (n.startsWith('+')) return n
    if (/^\d+$/.test(n)) return `+${n}`
    return n
}

let handler = async (m, { shorekeeper, text, prefix, command, Reply, qmsg, mime }) => {
    const input = String(text || '').trim()
    if (!input || !input.includes('|')) {
        return Reply(`⚠️ Format: ${prefix}${command} <nama>|<nomor>|[status] (reply foto)\nContoh: ${prefix}${command} Fauzan|08123456789|Sibuk`)
    }

    const parts = input.split('|')
    const nama = parts[0]?.trim()
    let nomor = parts[1]?.trim()
    const status = parts[2]?.trim() || 'Busy'
    if (!nama || !nomor) return Reply(`⚠️ Nama dan nomor wajib diisi.`)
    if (nomor.startsWith('08')) nomor = '62' + nomor.slice(1)

    if (!mime || !/image/.test(mime)) {
        return Reply(`⚠️ Reply/kirim foto dengan caption:\n${prefix}${command} <nama>|<nomor>|[status]`)
    }

    const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
    await react('⏳')

    try {
        const media = await qmsg.download()
        if (!media) throw new Error('Gagal membaca media')

        const bgBuffer = (await axios.get(BG_URL, { responseType: 'arraybuffer', timeout: 20000 })).data
        const avatar = await loadImage(media)
        const background = await loadImage(Buffer.from(bgBuffer))

        const canvas = createCanvas(background.width, background.height)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(background, 0, 0)

        const avatarSize = 350
        const avatarX = (canvas.width - avatarSize) / 2
        const avatarY = 163

        ctx.save()
        ctx.beginPath()
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        const minSide = Math.min(avatar.width, avatar.height)
        const cropX = (avatar.width - minSide) / 2
        const cropY = (avatar.height - minSide) / 2
        ctx.drawImage(avatar, cropX, cropY, minSide, minSide, avatarX, avatarY, avatarSize, avatarSize)
        ctx.restore()

        ctx.fillStyle = '#25D366'
        ctx.font = '25px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Edit', avatarX + avatarSize / 2, avatarY + avatarSize + 104)

        const startY = 760
        const gapY = 150
        ctx.textAlign = 'left'
        ctx.font = '30px Arial'
        ctx.fillStyle = '#a7a4a4'
        ctx.fillText(nama, 165, startY + 25)
        ctx.fillText(status, 165, startY + gapY + 25)
        ctx.fillText(formatNomor(nomor), 165, startY + gapY * 2 + 25)
        ctx.fillStyle = '#25D366'
        ctx.fillText('Instagram', 165, startY + gapY * 3 + 26)

        const buffer = await canvas.encode('png')
        await shorekeeper.sendMessage(m.chat, { image: buffer, caption: '📱 Fake WA' }, { quoted: m })
        await react('✅')
    } catch (e) {
        await react('❌')
        console.error('[fakewa]', e)
        Reply(`❌ Gagal membuat fake WA: ${e.message}`)
    }
}

handler.command = ['fakewa']
module.exports = handler
