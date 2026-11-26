/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Fitur via API NexaDev (butuh internet di server bot, tanpa API key):
 *   .wmp1 teks1|teks2|teks3|teks4       gambar teks bertingkat
 *   .fakeff2 <username>                  kartu profil Free Fire palsu
 *   .iqcdark <teks> [| jam]              quote chat gelap  (alias: .iqc-dark) — reply gambar tanpa teks juga bisa
 *   .fakecall2 nama | durasi             tampilan telepon palsu (reply/kirim gambar = foto penelepon)
 *   .igstalk2 <username>                 info profil  (alias: .instagramstalker, .igstalker)
 *   .ss2 <url> [desktop|mobile|tablet]   screenshot web  (alias: .sspc = desktop, .ssmobile = mobile)
 *
 * Nama yang sudah dipakai fitur lain (fakeff, fakecall, igstalk, ss) sengaja tidak ditimpa, makanya bernama "2".
 */
'use strict'
const axios = require('axios')
const FormData = require('form-data')

const API1 = () => global.nexaApi1 || 'https://apii.nexadev.my.id'
const API2 = () => global.nexaApi2 || 'https://api.nexadev.my.id'
const UA = { 'User-Agent': 'Mozilla/5.0' }
const CAPTION = '© Kureza MD'

const mimeOf = (x) => ((x && (x.msg || x).mimetype) || '')
const react = (sock, m, e) => sock.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
const nf = (n) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString('id-ID') : String(n ?? '-'))
const wibClock = () => new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.')

const hasImage = (m) => [m.quoted, m].some((x) => x && /^image\//.test(mimeOf(x)))

// gambar dari pesan ini / pesan yang di-reply
async function getImage(m) {
  for (const x of [m.quoted, m]) {
    if (x && /^image\//.test(mimeOf(x)) && typeof x.download === 'function') {
      try { return await x.download() } catch {}
    }
  }
  return null
}

// upload gambar ke host publik (API NexaDev butuh URL, bukan file)
async function uploadImage(buffer) {
  const opt = (f) => ({ headers: f.getHeaders(), maxBodyLength: Infinity, maxContentLength: Infinity, timeout: 40000 })
  const meta = { filename: 'image.jpg', contentType: 'image/jpeg' }
  const hosts = [
    async () => {
      const f = new FormData(); f.append('reqtype', 'fileupload'); f.append('fileToUpload', buffer, meta)
      return String((await axios.post('https://catbox.moe/user/api.php', f, opt(f))).data || '').trim()
    },
    async () => {
      const f = new FormData(); f.append('files[]', buffer, meta)
      return (await axios.post('https://uguu.se/upload.php', f, opt(f))).data?.files?.[0]?.url
    },
    async () => {
      const f = new FormData(); f.append('file', buffer, meta)
      return (await axios.post('https://tmpfiles.org/api/v1/upload', f, opt(f))).data?.data?.url?.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    }
  ]
  for (const host of hosts) {
    try {
      const url = await host()
      if (/^https?:\/\//i.test(url || '')) return url
    } catch {}
  }
  return null
}

// URL gambar publik: gambar yang dikirim/di-reply, kalau tidak ada → foto profil (orang yang di-reply, atau pengirim)
async function publicImageUrl(sock, m, preferQuoted = false) {
  const buf = await getImage(m)
  if (buf) return uploadImage(buf)
  const target = (preferQuoted && m.quoted?.sender) || m.sender
  let pp = null
  try { pp = await sock.profilePictureUrl(target, 'image') } catch {}
  if (!pp) return null
  try {
    const b = Buffer.from((await axios.get(pp, { responseType: 'arraybuffer', timeout: 20000, headers: UA })).data)
    return (await uploadImage(b)) || pp
  } catch { return pp }
}

const fetchRaw = async (url, timeout) => {
  const r = await axios.get(url, { responseType: 'arraybuffer', timeout, headers: UA, validateStatus: () => true })
  if (r.status >= 400) throw new Error(`HTTP ${r.status}`)
  return { buf: Buffer.from(r.data), ct: String(r.headers['content-type'] || '') }
}
const pickUrl = (j) => {
  for (const v of [j?.url, j?.result, j?.data, j?.data?.url, j?.result?.url, j?.image, j?.data?.image, j?.screenshot]) {
    if (typeof v === 'string' && /^https?:\/\//i.test(v)) return v
  }
  return null
}

// panggil endpoint yang membalas gambar (langsung, atau JSON berisi link gambar)
async function imageFromApi(url, timeout = 60000) {
  const { buf, ct } = await fetchRaw(url, timeout)
  if (/^image\//i.test(ct)) return buf
  let j
  try { j = JSON.parse(buf.toString('utf8')) } catch { throw new Error('respons bukan gambar') }
  const link = pickUrl(j)
  if (!link) throw new Error(String(j?.message || j?.error || 'respons tidak berisi gambar').slice(0, 120))
  const r2 = await fetchRaw(link, timeout)
  if (!/^image\//i.test(r2.ct)) throw new Error('link hasil bukan gambar')
  return r2.buf
}

let handler = async (m, { shorekeeper: sock, command, text, prefix, Reply, isCreator, checkLimit, addLimit }) => {
  const p = prefix || '.'
  const cmd = String(command).toLowerCase()
  text = String(text || '').trim()
  const done = async (emoji = '✅') => { try { addLimit?.(m.sender, isCreator) } catch {} ; await react(sock, m, emoji) }
  const sendImg = (buf) => sock.sendMessage(m.chat, { image: buf, caption: CAPTION }, { quoted: m })

  // ── bantuan pemakaian dicek dulu supaya tidak memotong limit ──
  const usage = {
    wmp1: `🖼️ *WMP1*\n\n${p}wmp1 teks1|teks2|teks3|teks4\n\nContoh: ${p}wmp1 ngapain cemburu|kan|cuman sebatas|teman`,
    fakeff2: `🎮 *FAKE FF*\n\n${p}fakeff2 <username>\n\nContoh: ${p}fakeff2 NexaDev`,
    iqcdark: `💬 *IQC DARK*\n\n${p}iqcdark <teks>\n${p}iqcdark <teks> | 01.27  (jam bebas)\natau reply pesan teks.\nReply gambar (dengan/tanpa teks) = gambar itu yang dipakai. Tanpa gambar: foto profilmu / orang yang di-reply.`,
    fakecall2: `📞 *FAKE CALL 2*\n\n${p}fakecall2 nama | durasi\n\nContoh: ${p}fakecall2 NexaDev | 19.45\nReply/kirim gambar untuk foto penelepon (default: foto profilmu).`,
    igstalk2: `🔍 *INSTAGRAM STALK*\n\n${p}igstalk2 <username>\n\nContoh: ${p}igstalk2 Kyzeee48`,
    ss2: `📸 *SCREENSHOT WEB*\n\n${p}ss2 <url> [desktop|mobile|tablet]\n${p}sspc <url>  /  ${p}ssmobile <url>\n\nContoh: ${p}ss2 google.com mobile`
  }
  const group = { 'iqc-dark': 'iqcdark', instagramstalker: 'igstalk2', igstalker: 'igstalk2', sspc: 'ss2', ssmobile: 'ss2' }[cmd] || cmd
  const quotedText = m.quoted && (m.quoted.text || m.quoted.body || '')

  if (group === 'iqcdark') { if (!text && !quotedText && !hasImage(m)) return Reply(usage.iqcdark) }
  else if (group === 'ss2') { if (!text && !quotedText) return Reply(usage.ss2) }
  else if (!text) return Reply(usage[group])
  if (group === 'fakecall2' && (!text.includes('|') || text.split('|').some((s) => !s.trim()))) return Reply(usage.fakecall2)
  if (checkLimit && checkLimit(m.sender, isCreator)) return Reply(global.mess?.limit || 'Limit harianmu habis.')

  try {
    await react(sock, m, '🕕')

    if (cmd === 'wmp1') {
      const img = await imageFromApi(`${API1()}/wmp1?text=${encodeURIComponent(text)}`)
      await sendImg(img)
      return done()
    }

    if (cmd === 'fakeff2') {
      const img = await imageFromApi(`${API1()}/fakeff?usn=${encodeURIComponent(text)}`)
      await sendImg(img)
      return done()
    }

    if (group === 'iqcdark') {
      let teks = text || quotedText
      let jam = wibClock()
      const parts = teks.split('|')
      if (parts.length > 1 && /^\s*\d{1,2}[.:]\d{2}\s*$/.test(parts[parts.length - 1])) {
        jam = parts.pop().trim().replace(':', '.')
        teks = parts.join('|').trim()
      }
      const avatar = await publicImageUrl(sock, m, true)
      if (!avatar && hasImage(m)) throw Object.assign(new Error('gagal mengunggah gambarmu, coba lagi sebentar lagi'), { user: true })
      const url = `${API1()}/iqc-dark?text=${encodeURIComponent(teks)}&time=${encodeURIComponent(jam)}${avatar ? `&url=${encodeURIComponent(avatar)}` : ''}`
      await sendImg(await imageFromApi(url))
      return done()
    }

    if (group === 'fakecall2') {
      const [nama, durasi] = text.split('|').map((s) => s.trim())
      const avatar = await publicImageUrl(sock, m, false)
      if (!avatar && hasImage(m)) throw Object.assign(new Error('gagal mengunggah gambarmu, coba lagi sebentar lagi'), { user: true })
      const url = `${API2()}/fakecall?${avatar ? `ppurl=${encodeURIComponent(avatar)}&` : ''}name=${encodeURIComponent(nama)}&duration=${encodeURIComponent(durasi.replace(/:/g, '.'))}`
      await sendImg(await imageFromApi(url))
      return done()
    }

    if (group === 'igstalk2') {
      const user = text.replace(/^@/, '').split(/\s+/)[0]
      const res = await axios.get(`${API2()}/api/instagramstalker?username=${encodeURIComponent(user)}`, { timeout: 35000, headers: UA })
      const d = res.data?.data
      if (!res.data?.status || !d || !d.username) throw Object.assign(new Error('akun tidak ditemukan'), { user: true })
      const cap = `\`⌜ Instagram Profile Info ⌟\`
> ◦ *Username :* *${d.username}*${d.verified ? ' ✅' : ''}
> ◦ *Nama :* ${d.name || '-'}
> ◦ *Followers :* ${nf(d.followers)}
> ◦ *Following :* ${nf(d.following)}
> ◦ *Postingan :* ${nf(d.posts)}
> ◦ *Likes :* ${nf(d.likes)}
> ◦ *Akun :* ${d.private ? 'Private 🔒' : 'Publik'}
> ◦ *Bio :* ${d.bio || 'Tidak ada bio'}

${CAPTION}`
      let photo = null
      if (d.photo) { try { photo = (await fetchRaw(d.photo, 25000)).buf } catch {} }
      if (photo) await sock.sendMessage(m.chat, { image: photo, caption: cap }, { quoted: m })
      else await Reply(cap)
      return done()
    }

    if (group === 'ss2') {
      const fixed = cmd === 'sspc' ? 'desktop' : cmd === 'ssmobile' ? 'mobile' : null
      const tokens = (text || quotedText).trim().split(/\s+/)
      let device = fixed || 'desktop'
      if (!fixed && /^(desktop|mobile|tablet)$/i.test(tokens[tokens.length - 1]) && tokens.length > 1) device = tokens.pop().toLowerCase()
      let target = tokens.join(' ').trim()
      if (!target) return Reply(usage.ss2)
      if (!/^https?:\/\//i.test(target)) target = `https://${target}`
      const img = await imageFromApi(`${API2()}/api/ss?url=${encodeURIComponent(target)}&device=${device}`, 100000)
      await sock.sendMessage(m.chat, { image: img, caption: `${target}\n\n${CAPTION}` }, { quoted: m })
      return done()
    }
  } catch (e) {
    console.error(`[NEXADEV:${cmd}]`, e.message)
    await react(sock, m, '❌')
    if (e.user) return Reply(`❌ ${e.message[0].toUpperCase()}${e.message.slice(1)}.`)
    return Reply('❌ Gagal memproses. Server API NexaDev sedang bermasalah atau tidak terjangkau, coba lagi nanti.')
  }
}

handler.command = ['wmp1', 'fakeff2', 'iqcdark', 'iqc-dark', 'fakecall2', 'igstalk2', 'instagramstalker', 'igstalker', 'ss2', 'sspc', 'ssmobile']
handler.help = ['wmp1', 'fakeff2', 'iqcdark', 'fakecall2', 'igstalk2', 'ss2']
handler.tags = ['tools']

module.exports = handler
