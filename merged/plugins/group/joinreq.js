/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Kelola permintaan bergabung grup (grup dengan "Setujui anggota baru" aktif). Khusus admin; bot harus admin.
 *   .listreq                  daftar yang menunggu
 *   .accreq all | <jumlah> | <nomor>     terima semua / N pertama / nomor tertentu
 *   .tolakreq all | <jumlah> | <nomor>   tolak
 */
'use strict'

const CHUNK = 20
const SHOW = 15
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const digits = (j) => String(j || '').split('@')[0].split(':')[0].replace(/\D/g, '')
const normNum = (n) => { let d = String(n || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '62' + d.slice(1); return d }
const phoneOf = (r) => digits(r.phone_number || r.pn || r.jid)
const via = (r) => {
  const v = String(r.request_method || '').toLowerCase()
  if (v.includes('invite')) return 'lewat link'
  if (v.includes('linked')) return 'lewat komunitas'
  if (v.includes('non_admin')) return 'ditambah member'
  return ''
}
const wib = (t) => {
  t = Number(t); if (!Number.isFinite(t) || t <= 0) return ''
  return new Date((t < 1e12 ? t * 1000 : t) + 7 * 3600e3).toISOString().replace('T', ' ').slice(0, 16) + ' WIB'
}

async function pending(sock, jid) {
  const list = await sock.groupRequestParticipantsList(jid)
  return Array.isArray(list) ? list.filter((r) => r && r.jid) : []
}

let handler = async (m, { shorekeeper: sock, command, args, prefix, isCreator, Reply }) => {
  if (!m.isGroup) return Reply(global.mess?.group || 'Fitur ini hanya untuk grup.')
  if (!m.isAdmin && !isCreator) return Reply(global.mess?.admin || 'Fitur ini khusus admin grup.')
  if (!m.isBotAdmin) return Reply(global.mess?.botAdmin || 'Jadikan bot admin dulu.')
  const cmd = String(command).toLowerCase()
  const p = prefix || '.'

  let list
  try { list = await pending(sock, m.chat) } catch (e) { return Reply('❌ Gagal membaca permintaan. Pastikan fitur "Setujui anggota baru" aktif di grup ini.') }

  if (cmd === 'listreq') {
    if (!list.length) return Reply('✅ Tidak ada permintaan bergabung yang menunggu.')
    const rows = list.slice(0, SHOW).map((r, i) => `${i + 1}. +${phoneOf(r)}${via(r) ? ` · ${via(r)}` : ''}${wib(r.request_time) ? `\n    ${wib(r.request_time)}` : ''}`).join('\n')
    return Reply(`📥 *PERMINTAAN BERGABUNG* (${list.length})\n\n${rows}${list.length > SHOW ? `\n…dan ${list.length - SHOW} lainnya` : ''}\n\n${p}accreq all | <jumlah> | <nomor>\n${p}tolakreq all | <jumlah> | <nomor>`)
  }

  const action = cmd === 'accreq' ? 'approve' : 'reject'
  const label = action === 'approve' ? 'diterima' : 'ditolak'
  const arg = String(args[0] || '').toLowerCase()
  if (!arg) return Reply(`Format: ${p}${cmd} all | <jumlah> | <nomor>\nContoh: ${p}${cmd} 5 (5 pertama) atau ${p}${cmd} 08123456789`)
  if (!list.length) return Reply('✅ Tidak ada permintaan bergabung yang menunggu.')

  let target
  if (arg === 'all' || arg === 'semua') target = list
  else if (/^\d{1,3}$/.test(arg)) target = list.slice(0, Math.max(1, parseInt(arg, 10)))
  else {
    const want = normNum(arg)
    target = list.filter((r) => phoneOf(r) === want || digits(r.jid) === want)
    if (!target.length) return Reply(`Nomor ${want} tidak ada di daftar permintaan. Lihat *${p}listreq*.`)
  }

  let ok = 0, fail = 0
  for (let i = 0; i < target.length; i += CHUNK) {
    const part = target.slice(i, i + CHUNK).map((r) => r.jid)
    try { await sock.groupRequestParticipantsUpdate(m.chat, part, action); ok += part.length } catch { fail += part.length }
    if (i + CHUNK < target.length) await sleep(1500)
  }
  return Reply(`${action === 'approve' ? '✅' : '🚫'} ${ok} permintaan ${label}${fail ? `, ${fail} gagal` : ''}.`)
}

handler.command = ['listreq', 'accreq', 'tolakreq']
handler.help = ['listreq', 'accreq', 'tolakreq']
handler.tags = ['group']

module.exports = handler
