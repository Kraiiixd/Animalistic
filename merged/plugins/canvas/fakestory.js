/**
 * © Kureza MD — Hitoshi MD V1
 * Diadaptasi dari DeniaMD (plugins/canvas/fakestory.js)
 *
 * .fakestory <nama> (reply 1-2 foto) — fake Instagram story, render lokal dengan @napi-rs/canvas
 */
const { createCanvas, loadImage, Path2D } = require('@napi-rs/canvas')
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const CFG = { width: 720, cardBg: '#121212', textColor: '#ffffff', cornerRadius: 35 }
const ICONS = {
    heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    comment: 'M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z',
    share: 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z'
}

function roundedRectPath(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
}
function drawAvatar(ctx, img, x, y, size) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(img, x, y, size, size)
    ctx.restore()
}
function drawCoverImage(ctx, img, x, y, w, h) {
    const imgRatio = img.width / img.height
    const canvasRatio = w / h
    let drawW, drawH, drawX, drawY
    if (imgRatio > canvasRatio) { drawH = h; drawW = h * imgRatio; drawX = x - (drawW - w) / 2; drawY = y }
    else { drawW = w; drawH = w / imgRatio; drawX = x; drawY = y - (drawH - h) / 2 }
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()
    ctx.drawImage(img, drawX, drawY, drawW, drawH)
    ctx.restore()
}
function drawBlurredBackground(ctx, canvas, imgTop, imgBottom) {
    const w = canvas.width, h = canvas.height
    ctx.save()
    ctx.filter = 'blur(30px) brightness(30%)'
    const bleed = 40
    drawCoverImage(ctx, imgTop, -bleed, -bleed, w + bleed * 2, h / 2 + bleed)
    drawCoverImage(ctx, imgBottom, -bleed, h / 2, w + bleed * 2, h / 2 + bleed)
    ctx.restore()
}

async function createFakeStory(username, avatarBuffer, imgTopBuffer, imgBottomBuffer) {
    const height = 1150
    const canvas = createCanvas(CFG.width, height)
    const ctx = canvas.getContext('2d')
    const avatar = await loadImage(avatarBuffer)
    const imgTop = await loadImage(imgTopBuffer)
    const imgBottom = await loadImage(imgBottomBuffer)
    drawBlurredBackground(ctx, canvas, imgTop, imgBottom)

    const cardMarginX = 25, cardMarginY = 60
    const cardW = CFG.width - cardMarginX * 2
    const cardH = height - cardMarginY * 2
    const cardX = cardMarginX, cardY = cardMarginY

    ctx.save()
    roundedRectPath(ctx, cardX, cardY, cardW, cardH, CFG.cornerRadius)
    ctx.fillStyle = CFG.cardBg
    ctx.fill()
    ctx.clip()

    const headerHeight = 90, avatarSize = 45
    drawAvatar(ctx, avatar, cardX + 20, cardY + 22, avatarSize)
    ctx.font = 'bold 18px Arial'
    ctx.fillStyle = CFG.textColor
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(username, cardX + 80, cardY + 45)

    const footerHeight = 70
    const contentAvailableHeight = cardH - headerHeight - footerHeight
    const singleImageHeight = contentAvailableHeight / 2
    drawCoverImage(ctx, imgTop, cardX, cardY + headerHeight, cardW, singleImageHeight)
    drawCoverImage(ctx, imgBottom, cardX, cardY + headerHeight + singleImageHeight, cardW, singleImageHeight)

    const iconY = cardY + cardH - footerHeight / 2
    function drawSvgOutline(pathData, x, y, scale) {
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(scale, scale)
        ctx.translate(-12, -12)
        const p = new Path2D(pathData)
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1.8
        ctx.stroke(p)
        ctx.restore()
    }
    drawSvgOutline(ICONS.heart, cardX + 40, iconY, 1.3)
    drawSvgOutline(ICONS.comment, cardX + 100, iconY, 1.2)
    drawSvgOutline(ICONS.share, cardX + 160, iconY, 1.2)
    ctx.restore()
    return await canvas.encode('png')
}

async function getAvatarBuffer(shorekeeper, jid) {
    try {
        const ppUrl = await shorekeeper.profilePictureUrl(jid, 'image')
        if (ppUrl) {
            const res = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 15000 })
            return Buffer.from(res.data)
        }
    } catch {}
    const fallback = path.join(__dirname, '..', '..', 'source', 'media', 'foto', 'imgdokumen.jpg')
    if (fs.existsSync(fallback)) return fs.readFileSync(fallback)
    throw new Error('Tidak dapat mengambil foto profil')
}

let handler = async (m, { shorekeeper, args, prefix, command, Reply, qmsg, mime }) => {
    const username = (args || []).join(' ').trim() || m.pushName || 'User'

    const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
    await react('⏳')

    if (!mime || !/image/.test(mime)) {
        await react('❌')
        return Reply(`📷 Fake Story\n\nReply 1 foto (atau 2, dipisah kirim ulang).\nFormat: ${prefix}${command} <nama>\nContoh: ${prefix}${command} Misaki`)
    }

    try {
        const avatarBuffer = await getAvatarBuffer(shorekeeper, m.sender)
        const imageBuffer = await qmsg.download()
        if (!imageBuffer) throw new Error('Gagal download gambar')

        const resultBuffer = await createFakeStory(username, avatarBuffer, imageBuffer, imageBuffer)
        await shorekeeper.sendMessage(m.chat, { image: resultBuffer, caption: '📷 Fake Story' }, { quoted: m })
        await react('✅')
    } catch (e) {
        await react('❌')
        console.error('[fakestory]', e)
        Reply(`❌ Gagal membuat fake story: ${e.message}`)
    }
}

handler.command = ['fakestory', 'fstory', 'fakeinsta']
module.exports = handler
