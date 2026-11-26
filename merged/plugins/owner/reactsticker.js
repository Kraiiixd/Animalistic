/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * React Sticker — reaksi stiker yang menempel di chat (messageAssociation tipe 11).
 * Konsep & kode asli: noxXza.exe (ReactSticker). Diadaptasi ke Hitoshi MD oleh Kureza MD.
 *
 *   .addstc            (owner) reply stiker → simpan ke database
 *   .delstc <jumlah>   (owner) hapus stiker dari urutan paling awal
 *   .clearstc          (owner) hapus semua stiker
 *   .reactstc <jumlah> reply chat target → kirim reaksi stiker (berurutan & berputar)
 * Data: lib/database/reactstc.json
 */
'use strict'
const fs = require('fs')
const path = require('path')

const STC_PATH = path.join(__dirname, '..', '..', 'lib', 'database', 'reactstc.json')
const MAX_REACT = 100       // batas aman per perintah (spam berlebihan bisa bikin nomor kena limit)
const DELAY = 500
const KEYS = ['url', 'fileSha256', 'fileEncSha256', 'mediaKey', 'mimetype', 'directPath', 'fileLength', 'mediaKeyTimestamp', 'isAnimated', 'isAvatar']

const load = () => {
  try {
    if (!fs.existsSync(STC_PATH)) { fs.mkdirSync(path.dirname(STC_PATH), { recursive: true }); fs.writeFileSync(STC_PATH, '[]') }
    const d = JSON.parse(fs.readFileSync(STC_PATH, 'utf8'))
    return Array.isArray(d) ? d : []
  } catch { return [] }
}
const save = (list) => fs.writeFileSync(STC_PATH, JSON.stringify(list, null, 2))
const idOf = (j) => String(j || '').split('@')[0].split(':')[0]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const running = new Set()   // satu proses reaksi per chat

let handler = async (m, { shorekeeper: sock, command, args, prefix, isCreator, Reply }) => {
  const cmd = String(command).toLowerCase()
  const p = prefix || '.'
  const ownerOnly = cmd !== 'reactstc'
  if (ownerOnly && !isCreator) return Reply(global.mess?.owner || 'Fitur ini khusus owner.')

  if (cmd === 'addstc') {
    if (!m.quoted) return Reply('Reply stiker yang mau ditambahkan')
    if (!String(m.quoted.mtype || m.quoted.type || '').includes('sticker')) return Reply('Yang kamu reply bukan sticker')
    const raw = JSON.parse(JSON.stringify(m.quoted.msg || m.quoted))
    const st = {}
    for (const k of KEYS) if (raw[k] !== undefined) st[k] = raw[k]
    if (typeof st.mediaKey !== 'string' || !st.directPath) return Reply('Data sticker tidak lengkap, coba sticker lain')
    const list = load()
    if (list.some((s) => s.fileSha256 === st.fileSha256)) return Reply('Sticker ini sudah ada di database')
    list.push(st); save(list)
    return Reply(`Sticker berhasil ditambahkan! Total sticker: ${list.length}`)
  }

  if (cmd === 'delstc') {
    const list = load()
    if (!list.length) return Reply('Database sticker masih kosong')
    const n = parseInt(args[0], 10)
    if (isNaN(n) || n < 1) return Reply(`Contoh: ${p}delstc 1`)
    if (n > list.length) return Reply(`Total sticker di database cuma ${list.length}`)
    list.splice(0, n); save(list)
    return Reply(`Berhasil menghapus ${n} sticker. Sisa sticker: ${list.length}`)
  }

  if (cmd === 'clearstc') {
    const total = load().length
    if (!total) return Reply('Database sticker sudah kosong')
    save([])
    return Reply(`Berhasil menghapus semua sticker (${total} sticker)`)
  }

  // reactstc
  if (!m.quoted) return Reply('Reply chat orang yang mau di-react stiker')
  const stickers = load()
  if (!stickers.length) return Reply(`Database sticker masih kosong, tambah dulu pakai ${p}addstc`)
  let n = parseInt(args[0], 10)
  if (isNaN(n) || n < 1) return Reply(`Contoh: ${p}reactstc 30`)
  if (n > MAX_REACT) { n = MAX_REACT }
  if (running.has(m.chat)) return Reply('Reaksi stiker di chat ini masih berjalan, tunggu selesai.')

  const ctx = m.msg?.contextInfo || m.message?.extendedTextMessage?.contextInfo || {}
  const stanzaId = ctx.stanzaId || m.quoted.id || m.quoted.key?.id
  const quotedSender = ctx.participant || m.quoted.sender || m.quoted.key?.participant
  if (!stanzaId) return Reply('Gagal membaca pesan yang di-reply, coba reply ulang.')
  const mine = [sock.user?.id, sock.user?.lid].filter(Boolean).map(idOf)
  const isMine = mine.includes(idOf(quotedSender)) || !!m.quoted.fromMe
  const targetKey = {
    remoteJid: m.chat,
    fromMe: isMine,
    id: stanzaId,
    ...(m.isGroup && !isMine ? { participant: quotedSender } : {})
  }

  running.add(m.chat)
  let sent = 0
  try {
    for (let i = 0; i < n; i++) {
      await sock.relayMessage(m.chat, {
        messageContextInfo: { messageAssociation: { associationType: 11, parentMessageKey: targetKey } },
        stickerMessage: stickers[i % stickers.length]
      }, {})
      sent++
      if (i < n - 1) await sleep(DELAY)
    }
  } catch (e) {
    console.error('[REACTSTC]', e.message)
    return Reply(`❌ Berhenti di ${sent}/${n} reaksi: ${e.message}`)
  } finally { running.delete(m.chat) }
  if (sent < parseInt(args[0], 10)) return Reply(`ℹ️ Dibatasi maksimal ${MAX_REACT} reaksi per perintah. Terkirim: ${sent}.`)
}

handler.command = ['addstc', 'delstc', 'clearstc', 'reactstc']
handler.help = ['reactstc', 'addstc', 'delstc', 'clearstc']
handler.tags = ['owner']

module.exports = handler
