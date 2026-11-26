// AI audio via Termai: .songai <prompt>  |  .voicecover <model> (reply audio)
const { sse, statusMsg } = require('../../lib/services/termai.cjs')
const { pickMedia, reactTo } = require('../../lib/hitoshi-compat.cjs')

let handler = async (m, { sock, text, prefix, command, reply }) => {
  const cmd = String(command).toLowerCase()
  const p = prefix || '.'
  const q = String(text || '').trim()
  const status = statusMsg(sock, m)
  let ok = false

  try {
    if (cmd === 'songai' || cmd === 'songgenerator') {
      if (!q) return reply(`Tulis deskripsi lagunya.\n\n*Contoh:* ${p}${cmd} lagu pop ceria tentang liburan, bahasa Indonesia`)
      await reactTo(sock, m, '⏳'); await status('⏳ Menunggu antrian...')
      await sse({ path: '/api/audioProcessing/song-generator', params: { prompt: q } }, async (d) => {
        const s = String(d.status || '')
        if (/queueing|generating/i.test(s)) { await status(`⏳ ${d.msg || s}`); return false }
        if (s === 'failed') throw new Error('Gagal membuat lagu.')
        if (s === 'reject') throw new Error(d.msg || 'Permintaan ditolak.')
        if (d.result?.audioUrl) {
          await sock.sendMessage(m.chat, { text: `🎵 *${q}*\n_${d.result.tags || ''}_\n\n${d.result.lyrics || ''}` }, { quoted: m })
          await sock.sendMessage(m.chat, { audio: { url: d.result.audioUrl }, mimetype: 'audio/mp4' }, { quoted: m })
          ok = true; return true
        }
        return false
      })
    } else {
      // cover / covers (voice changer)
      if (!q) return reply(`Sertakan nama model suaranya.\n\n*Contoh:* reply audio dengan caption ${p}${cmd} <model>`)
      const media = pickMedia(m)
      if (!media || !/audio/.test(media.mime)) return reply(`Reply audio/VN dengan caption ${p}${cmd} <model>`)
      await reactTo(sock, m, '⏳'); await status('⏳ Mengunggah audio...')
      const audio = await media.download()
      await sse({ path: '/api/audioProcessing/voice-covers', params: { model: q }, data: audio, headers: { 'Content-Type': 'application/octet-stream' } }, async (d) => {
        const s = String(d.status || '')
        if (s === 'reject') throw new Error(d.msg || 'Permintaan ditolak.')
        if (/eror|error|failed/i.test(s)) throw new Error('Gagal memproses audio.')
        if (d.result) {
          await sock.sendMessage(m.chat, { audio: { url: d.result }, mimetype: 'audio/mp4' }, { quoted: m })
          ok = true; return true
        }
        if (d.msg) await status(`⏳ ${d.msg}`)
        return false
      })
    }
    await reactTo(sock, m, ok ? '✅' : '❌')
    if (!ok) return reply('❌ Tidak ada hasil dari server, coba lagi.')
  } catch (e) {
    console.error('[TERMAI-AUDIO]', e)
    await reactTo(sock, m, '❌')
    return reply(`❌ Gagal: ${e?.message || e}`)
  }
}

handler.command = ['songai', 'songgenerator', 'voicecover', 'termaicover']
handler.help = ['songai <prompt>', 'voicecover <model> (reply audio)']
handler.tags = ['ai']
handler.limit = true
handler.premium = true


module.exports = require('../../lib/hitoshi-compat.cjs').adapt(handler)