/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * .absen     — absen harian di grup (streak berlanjut kalau absen tiap hari, zona WIB)
 * .topabsen  — 10 streak tertinggi di grup ini
 * Data: lib/database/absen.json
 */
'use strict'
const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, '..', '..', 'lib', 'database', 'absen.json')
let db = null
const load = () => {
  if (db) return db
  try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { db = {} }
  return db
}
const save = () => {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true })
    fs.writeFileSync(FILE + '.tmp', JSON.stringify(db))
    fs.renameSync(FILE + '.tmp', FILE)
  } catch (e) { console.error('[ABSEN] gagal simpan:', e.message) }
}

// tanggal WIB (UTC+7) 'YYYY-MM-DD'
const wibDate = (t = Date.now()) => new Date(t + 7 * 3600e3).toISOString().slice(0, 10)
const dayDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5)
const numOf = (jid) => String(jid || '').split('@')[0].split(':')[0]
const MILESTONE = [3, 7, 14, 30, 60, 100, 365]

let handler = async (m, { command, Reply, shorekeeper }) => {
  if (!m.isGroup) return Reply(global.mess?.group || 'Fitur ini hanya untuk grup.')
  const all = load()
  const g = (all[m.chat] ||= {})
  const cmd = String(command).toLowerCase()

  if (cmd === 'topabsen') {
    const top = Object.entries(g).sort((a, b) => b[1].streak - a[1].streak || b[1].total - a[1].total).slice(0, 10)
    if (!top.length) return Reply('Belum ada yang absen di grup ini. Mulai dengan *.absen*')
    return shorekeeper.sendMessage(m.chat, {
      text: `📅 *TOP STREAK ABSEN*\n\n${top.map(([id, u], i) => `${i + 1}. @${id} — 🔥 ${u.streak} hari (total ${u.total}x)`).join('\n')}`,
      mentions: top.map(([, u]) => u.jid)
    }, { quoted: m })
  }

  const me = numOf(m.sender)
  const today = wibDate()
  const u = (g[me] ||= { streak: 0, total: 0, last: null, best: 0, jid: m.sender })
  u.jid = m.sender
  if (u.last === today) return Reply(`Kamu sudah absen hari ini ✅\n🔥 Streak: ${u.streak} hari`)

  u.streak = u.last && dayDiff(u.last, today) === 1 ? u.streak + 1 : 1
  u.last = today
  u.total++
  u.best = Math.max(u.best, u.streak)
  save()

  const next = MILESTONE.find((d) => d > u.streak)
  const hit = MILESTONE.includes(u.streak)
  return shorekeeper.sendMessage(m.chat, {
    text: `╭─▣「 *ABSEN HARIAN* 」▣─╮\n┃ 👤 @${me}\n┃ 🔥 Streak : ${u.streak} hari\n┃ 🏅 Terbaik: ${u.best} hari\n┃ 📆 Total  : ${u.total}x\n╰─────────────➤` +
      (hit ? `\n🎉 *Streak hari ke-${u.streak}!*` : '') +
      (next ? `\n\n_Target berikutnya: hari ke-${next} (${next - u.streak} hari lagi)_` : '') +
      `\n\n© Kureza MD`,
    mentions: [m.sender]
  }, { quoted: m })
}

handler.command = ['absen', 'topabsen']
handler.help = ['absen', 'topabsen']
handler.tags = ['group']
handler._internals = { wibDate, dayDiff, load }

module.exports = handler
