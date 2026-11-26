/**
 * © Kureza MD — Hitoshi MD V1
 * Diadaptasi dari DeniaMD (plugins/maker/quotesmaker.js)
 *
 * .quotesmaker <teks>,<author> — gambar kutipan dari api.azbry.com
 */
const axios = require('axios')

let handler = async (m, { shorekeeper, text, prefix, command, Reply }) => {
    const raw = String(text || '').trim()
    if (!raw.includes(',')) return Reply(`Contoh: ${prefix}${command} Halo dunia,Kureza MD`)
    const [quoteRaw, authorRaw] = raw.split(',')
    const quote = String(quoteRaw || '').trim()
    const author = String(authorRaw || '').trim()
    if (!quote || !author) return Reply(`Format salah. Contoh: ${prefix}${command} Halo dunia,Kureza MD`)

    const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
    await react('⏳')
    try {
        const url = `https://api.azbry.com/api/maker/quotesmaker?text=${encodeURIComponent(quote)}&author=${encodeURIComponent(author)}`
        const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
        await shorekeeper.sendMessage(m.chat, {
            image: Buffer.from(data),
            caption: `✨ Quotes Maker\n📝 Text: ${quote}\n👤 Author: ${author}`
        }, { quoted: m })
        await react('✅')
    } catch (e) {
        await react('❌')
        Reply(`❌ Gagal membuat quotes: ${e.message}`)
    }
}

handler.command = ['quotesmaker']
module.exports = handler
