/**
 * © Kureza MD — Hitoshi MD V1
 * Diadaptasi dari DeniaMD (plugins/maker/fakemovi2.js)
 *
 * .fakemovi2 <quote>,<author> — gambar quote ala poster film
 */
const axios = require('axios')

let handler = async (m, { shorekeeper, text, prefix, command, Reply }) => {
    const raw = String(text || '').trim()
    if (!raw || !raw.includes(',')) return Reply(`Contoh: ${prefix}${command} Tak semua kawan bisa menerima kita,Kureza MD`)
    const [quoteRaw, authorRaw] = raw.split(',')
    const quote = String(quoteRaw || '').trim()
    const author = String(authorRaw || '').trim()
    if (!quote || !author) return Reply(`Format salah. Contoh: ${prefix}${command} Tak semua kawan bisa menerima kita,Kureza MD`)

    const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
    await react('⏳')
    try {
        const url = `https://api.synoxcloud.xyz/canvas/quotes-v1?quote=${encodeURIComponent(quote)}&author=${encodeURIComponent(author)}`
        const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
        await shorekeeper.sendMessage(m.chat, {
            image: Buffer.from(data),
            caption: `🎬 Fake Movi V2\n💬 Quote: ${quote}\n✍️ Author: ${author}`
        }, { quoted: m })
        await react('✅')
    } catch (e) {
        await react('❌')
        Reply(`❌ Gagal membuat gambar: ${e.message}`)
    }
}

handler.command = ['fakemovi2']
module.exports = handler
