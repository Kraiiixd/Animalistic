/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

// .bratgif [white|black|green] [blur0-3] <teks> — stiker brat animasi (teks muncul kata demi kata), render lokal

const fs = require('fs')
const os = require('os')
const path = require('path')
const { ffmpeg } = require('../../library/converter')

// pakai ffmpeg bawaan paket kalau ada
try {
    const p = require('@ffmpeg-installer/ffmpeg').path
    process.env.PATH = `${path.dirname(p)}${path.delimiter}${process.env.PATH}`
} catch {}

const THEMES = { black: 'black', hitam: 'black', white: 'white', putih: 'white', green: 'green', hijau: 'green' }
const MAX_QUEUE = 4
let waiting = 0
let tail = Promise.resolve()

let handler = async (m, { shorekeeper, args, text, prefix, command, Reply }) => {
    const words = [...(args || [])]
    let theme, blur
    while (words.length) {
        const w = words[0].toLowerCase()
        if (THEMES[w]) theme = THEMES[w]
        else if (/^blur[0-3]$/.test(w)) blur = Number(w.slice(4))
        else break
        words.shift()
    }
    const input = (words.join(' ') || m.quoted?.text || '').replace(/\s+/g, ' ').trim()
    if (!input) return Reply(`Masukkan teksnya (atau reply pesan).\nContoh: ${prefix}${command} yang ini anak baik\nOpsi: ${prefix}${command} black blur1 halo`)
    if (input.length > 60) return Reply('Teks terlalu panjang untuk stiker animasi. Maksimal 60 karakter.')
    if (waiting >= MAX_QUEUE) return Reply('Antrian pembuatan brat penuh. Coba lagi sebentar lagi.')

    const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
    await react('⏳')
    waiting++
    const job = tail.then(async () => {
        const { makeBrat } = require('../../lib/bratvid.cjs')
        const out = path.join(os.tmpdir(), `brat-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`)
        try {
            await makeBrat({ text: input, theme, blur, out, format: 'mp4', hold: 1.2 })
            const mp4 = fs.readFileSync(out)
            return await ffmpeg(mp4, ['-vcodec', 'libwebp', '-vf', 'scale=512:512:flags=lanczos,fps=15', '-loop', '0', '-preset', 'default', '-an', '-vsync', '0', '-t', '8', '-q:v', '50'], 'mp4', 'webp')
        } finally {
            fs.rmSync(out, { force: true })
        }
    })
    tail = job.catch(() => {})
    try {
        const webp = await job
        await shorekeeper.sendMessage(m.chat, { sticker: webp }, { quoted: m })
        await react('✅')
    } catch (e) {
        console.error('[bratgif]', e)
        await react('❌')
        Reply(e.code === 'MODULE_NOT_FOUND'
            ? 'Modul @napi-rs/canvas belum terpasang. Jalankan npm install lalu restart bot.'
            : 'Gagal membuat stiker animasi. Coba lagi nanti.')
    } finally {
        waiting--
    }
}

handler.command = ['bratgif', 'bratanim']
handler.help = ['bratgif [white|black|green] [blur0-3] <teks>']
handler.tags = ['sticker']

module.exports = handler
