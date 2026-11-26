/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Pembuat gambar via API canvas (butuh internet di server bot):
 *   .fakecall [ios] nama | durasi   (reply/kirim gambar = avatar, default foto profil)
 *   .tiktokchat username | pesan    (wajib kirim/reply gambar avatar)
 *   .iqc2 <teks> / reply            quote gaya iPhone dengan jam & baterai acak
 */
'use strict'
const axios = require('axios')
const FormData = require('form-data')

const mimeOf = (x) => ((x && (x.msg || x).mimetype) || '')
async function getImage(m) {
  for (const x of [m.quoted, m]) {
    if (x && /^image\//.test(mimeOf(x)) && typeof x.download === 'function') {
      try { return await x.download() } catch {}
    }
  }
  return null
}
const react = (sock, m, e) => sock.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
const post = async (url, form) => Buffer.from((await axios.post(url, form, { headers: form.getHeaders(), responseType: 'arraybuffer', timeout: 60000 })).data)

let handler = async (m, { shorekeeper: sock, command, text, prefix, Reply }) => {
  const p = prefix || '.'
  const cmd = String(command).toLowerCase()
  text = String(text || '').trim()

  try {
    if (cmd === 'fakecall') {
      const ios = /^ios\s+/i.exec(text)
      const body = ios ? text.slice(ios[0].length) : text
      if (!body.includes('|')) return Reply(`📞 *FAKE CALL*\n\n${p}fakecall Zann | 03:33:33\n${p}fakecall ios Sayangku | 12:00:00\n\nReply/kirim gambar untuk avatar penelepon (default: foto profilmu).`)
      const [nama, durasi] = body.split('|').map((s) => s.trim())
      if (!nama || !durasi) return Reply('Nama dan durasi tidak boleh kosong.')
      await react(sock, m, '🕕')
      let buf = await getImage(m)
      if (!buf) {
        try { buf = Buffer.from((await axios.get(await sock.profilePictureUrl(m.sender, 'image'), { responseType: 'arraybuffer', timeout: 20000 })).data) } catch {}
      }
      if (!buf) buf = Buffer.from((await axios.get('https://files.catbox.moe/nwvkbt.png', { responseType: 'arraybuffer', timeout: 20000 })).data)
      const form = new FormData()
      form.append('avatarUrl', buf, { filename: 'avatar.jpg', contentType: 'image/jpeg' })
      form.append('name', nama)
      form.append('duration', durasi)
      const img = await post(`https://my.izuka-api.xyz/api/canvas/${ios ? 'fakecall-ios' : 'fakecall-android'}`, form)
      await sock.sendMessage(m.chat, { image: img, caption: '© Kureza MD' }, { quoted: m })
      return react(sock, m, '📞')
    }

    if (cmd === 'tiktokchat') {
      const buf = await getImage(m)
      if (!buf || !text.includes('|')) return Reply(`💬 *TIKTOK CHAT*\n\nKirim/reply foto avatar dengan:\n${p}tiktokchat username | pesan kamu\n\nContoh: ${p}tiktokchat Zann | Halo, hari ini cerah ya!`)
      const [user, ...rest] = text.split('|')
      await react(sock, m, '🕕')
      const form = new FormData()
      form.append('username', user.trim())
      form.append('text', rest.join('|').trim())
      form.append('avatar', buf, { filename: 'avatar.jpg', contentType: 'image/jpeg' })
      const img = await post('https://my.izuka-api.xyz/api/canvas/tiktok-chat', form)
      await sock.sendMessage(m.chat, { image: img, caption: '© Kureza MD' }, { quoted: m })
      return react(sock, m, '✅')
    }

    if (cmd === 'iqc2') {
      const t = text || (m.quoted && (m.quoted.text || m.quoted.body)) || ''
      if (!t) return Reply(`💬 *IQC 2*\n\n${p}iqc2 <teks kamu>\natau reply pesan teks dengan ${p}iqc2`)
      await react(sock, m, '🕕')
      const prov = ['INDOSAT', 'TELKOMSEL', 'XL', 'TRI', 'SMARTFREN', 'WIFI'][Math.floor(Math.random() * 6)]
      const jam = new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }).replace('.', ':')
      const bat = 10 + Math.floor(Math.random() * 91)
      const url = `https://api.nexray.eu.cc/maker/v1/iqc?text=${encodeURIComponent(t)}&provider=${prov}&jam=${encodeURIComponent(jam)}&baterai=${bat}`
      await sock.sendMessage(m.chat, { image: { url }, caption: '© Kureza MD' }, { quoted: m })
      return react(sock, m, '✅')
    }
  } catch (e) {
    console.error(`[CANVASAPI:${cmd}]`, e.message)
    await react(sock, m, '❌')
    return Reply('❌ Gagal membuat gambar. Server API sedang bermasalah atau tidak terjangkau, coba lagi nanti.')
  }
}

handler.command = ['fakecall', 'tiktokchat', 'iqc2']
handler.help = ['fakecall', 'tiktokchat', 'iqc2']
handler.tags = ['tools']

module.exports = handler
