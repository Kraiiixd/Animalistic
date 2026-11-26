/**
 * © Kureza MD — Hitoshi MD V1
 * Diadaptasi dari DeniaMD (plugins/canvas/codesnap.js)
 *
 * .codesnap <code> — gambar cuplikan code ala carbon, render via carbonara.solopov.dev
 */
const axios = require('axios')
const FormData = require('form-data')

let handler = async (m, { shorekeeper, text, prefix, command, Reply }) => {
    const code = String(text || m.quoted?.text || '').trim()
    if (!code) return Reply(`⚠️ Masukkan kodenya.\nContoh: ${prefix}${command} console.log('hello')`)

    const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
    await react('⏳')
    try {
        const form = new FormData()
        form.append('code', code)
        const img = await axios.post('https://carbonara.solopov.dev/api/cook', form, {
            headers: { ...form.getHeaders(), Accept: 'image/png' },
            responseType: 'arraybuffer',
            timeout: 30000
        })
        await shorekeeper.sendMessage(m.chat, {
            image: Buffer.from(img.data),
            caption: '💻 CodeSnap'
        }, { quoted: m })
        await react('✅')
    } catch (e) {
        await react('❌')
        Reply(`❌ Gagal membuat gambar code: ${e.message}`)
    }
}

handler.command = ['codesnap']
module.exports = handler
