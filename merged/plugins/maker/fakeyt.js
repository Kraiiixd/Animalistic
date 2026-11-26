/**
 * © Kureza MD — Hitoshi MD V1
 * Diadaptasi dari DeniaMD (plugins/maker/fakeyt.js)
 *
 * .fakeyt <nama>|<silver/gold> — gambar tombol play YouTube
 */
const axios = require('axios')

let handler = async (m, { shorekeeper, text, prefix, command, Reply }) => {
    const raw = String(text || '').trim()
    if (!raw.includes('|')) return Reply(`❌ Format salah.\nContoh: ${prefix}${command} Anita|silver\nPilihan template: silver atau gold`)
    const [nameRaw, templateRaw] = raw.split('|')
    const nama = String(nameRaw || '').trim()
    const template = String(templateRaw || '').trim().toLowerCase()
    if (!nama || !['silver', 'gold'].includes(template)) return Reply(`❌ Masukkan nama dan template silver/gold.\nContoh: ${prefix}${command} Anita|silver`)

    const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
    await react('⏳')
    try {
        const url = `https://api-nanzz.my.id/docs/api/maker/play-button.php?nama=${encodeURIComponent(nama)}&template=${encodeURIComponent(template)}`
        const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
        await shorekeeper.sendMessage(m.chat, {
            image: Buffer.from(data),
            caption: `🎬 YouTube Play Button\nNama: ${nama}\nTemplate: ${template}`
        }, { quoted: m })
        await react('✅')
    } catch (e) {
        await react('❌')
        Reply(`❌ Gagal membuat play button: ${e.message}`)
    }
}

handler.command = ['fakeyt']
module.exports = handler
