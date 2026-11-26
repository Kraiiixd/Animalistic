// AI filter gambar via Termai: .toanime .toreal .enlarge .filter <tipe>
const { tJson, minimizeImage, webpToPng, uploadCdn, statusMsg, progressBar, cfg } = require('../../lib/services/termai.cjs')
const { pickMedia, reactTo } = require('../../lib/hitoshi-compat.cjs')
const axios = require('axios')

const TYPE = { toanime: 'anime2d', jadianime: 'anime2d', toreal: 'anime2real', jadinyata: 'anime2real', imglarger: 'enlarger', enlarger: 'enlarger', enlarge: 'enlarger' }
const sleep = ms => new Promise(r => setTimeout(r, ms))

let handler = async (m, { sock, text, prefix, command, reply }) => {
  const cmd = String(command).toLowerCase()
  const p = prefix || '.'
  let type = TYPE[cmd]
  if (cmd === 'filter' || cmd === 'filters') {
    if (!text) return reply(`Tulis tipe filter-nya.\n\n*Contoh:* kirim/reply gambar dengan caption ${p}filter anime2d`)
    type = String(text).trim()
  }
  const media = pickMedia(m)
  if (!media || !(/image|webp/.test(media.mime))) return reply(`Kirim gambar atau reply gambar dengan caption ${p}${cmd}${type && !TYPE[cmd] ? ' ' + type : ''}`)

  const status = statusMsg(sock, m)
  try {
    await reactTo(sock, m, '⏳')
    let buf = await media.download()
    if (/webp/.test(media.mime)) buf = await webpToPng(buf)
    await status('⏳ Menyiapkan gambar...')
    const url = await uploadCdn(await minimizeImage(buf))
    const job = await tJson('/api/img2img/filters', { params: { action: type, url } })
    if (!job?.status) throw new Error(job?.msg || 'Gagal memulai proses.')
    const base = cfg().url
    for (let i = 0; i < 75; i++) {
      const { data: s } = await axios.get(`${base}/api/img2img/filters/batchProgress`, { params: { id: job.id }, timeout: 30_000 })
      if (s?.status == 3) {
        await sock.sendMessage(m.chat, { image: { url: s.url } }, { quoted: m })
        return reactTo(sock, m, '✅')
      }
      if (s?.status == 4) throw new Error('Proses gagal, coba gambar lain.')
      let prog = String(s?.progress || 'Memproses')
      const pm = prog.match(/(\d+(?:\.\d+)?)\s*%/) || (/^\d+(\.\d+)?$/.test(prog) ? [prog + '%', prog] : null)
      let bar = ''
      if (pm) { bar = `\n[${progressBar(pm[1])}] ${pm[1]}%`; prog = prog.replace(pm[0], '').trim() }
      await status(`⏳ ${prog || 'Memproses'}${bar}`)
      await sleep(1500)
    }
    throw new Error('Timeout, coba lagi nanti.')
  } catch (e) {
    console.error('[TERMAI-FILTER]', e)
    await reactTo(sock, m, '❌')
    return reply(`❌ Gagal: ${e?.message || e}`)
  }
}

handler.command = [...Object.keys(TYPE), 'filter', 'filters']
handler.help = ['toanime', 'toreal', 'enlarge', 'filter <tipe>']
handler.tags = ['ai']
handler.limit = true
handler.premium = true


module.exports = require('../../lib/hitoshi-compat.cjs').adapt(handler)