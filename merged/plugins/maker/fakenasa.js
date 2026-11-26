/**
 * © Kureza MD — Hitoshi MD V1
 * Diadaptasi dari DeniaMD (plugins/maker/fakenasa.js)
 *
 * .fakenasa <nama> — gambar sertifikat NASA
 */
const axios = require('axios')

let handler = async (m, { shorekeeper, text, prefix, command, Reply }) => {
    const nama = String(text || '').trim()
    if (!nama) return Reply(`❌ Masukkan nama.\nContoh: ${prefix}${command} Nama Kamu`)

    const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
    await react('⏳')
    try {
        const url = `https://api-nanzz.my.id/docs/api/maker/sertifikat-nasa.php?nama=${encodeURIComponent(nama)}`
        const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
        await shorekeeper.sendMessage(m.chat, {
            image: Buffer.from(data),
            caption: `🎓 Sertifikat NASA\nNama: ${nama}`
        }, { quoted: m })
        await react('✅')
    } catch (e) {
        await react('❌')
        Reply(`❌ Gagal membuat sertifikat: ${e.message}`)
    }
}

handler.command = ['fakenasa']
module.exports = handler
