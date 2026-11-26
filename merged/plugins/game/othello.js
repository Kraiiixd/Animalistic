/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * OTHELLO / Reversi 8x8, 1 lawan 1 di grup. Tampilan: kartu rich HTML (fallback teks).
 * Hitam ⚫ jalan duluan (penantang), Putih ⚪ (yang ditantang).
 *
 * Perintah: .othello @user (atau balas pesan) · .othelloterima · .othellotolak · .othellolangkah <d3>
 *           .othelloboard · .othellohint · .othelloskor · .othellomenyerah · .othellodraw · .othellotimer <menit>
 * (penulisan dengan tanda hubung, mis. .othello-langkah, juga dikenali; .othello d3 tidak dipakai — gunakan langkah)
 */

'use strict'

const GC = require('../../lib/gamecard.cjs')
const { esc } = GC

const FILES = 'abcdefgh'
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
const SIDES = ['Hitam ⚫', 'Putih ⚪']
const PENDING_MS = 5 * 60 * 1000
const DEFAULT_LIMIT = 30 * 60 * 1000

const games = new Map() // chat -> game

// ───────────────────────── aturan ─────────────────────────
const inb = (x, y) => x >= 0 && x < 8 && y >= 0 && y < 8
const sqOf = (t) => {
  const m = /^([a-h])([1-8])$/i.exec(String(t || '').trim())
  return m ? { x: FILES.indexOf(m[1].toLowerCase()), y: parseInt(m[2], 10) - 1 } : null
}

function init() {
  const b = Array.from({ length: 8 }, () => Array(8).fill(-1))
  b[3][3] = 1; b[4][4] = 1; b[3][4] = 0; b[4][3] = 0 // d4,e5 putih; e4,d5 hitam
  return { b }
}

// bidak yang terbalik kalau `side` taruh di (x,y)
function flips(b, x, y, side) {
  if (!inb(x, y) || b[y][x] !== -1) return []
  const out = []
  for (const [dx, dy] of DIRS) {
    const line = []
    let cx = x + dx, cy = y + dy
    while (inb(cx, cy) && b[cy][cx] === 1 - side) { line.push([cx, cy]); cx += dx; cy += dy }
    if (line.length && inb(cx, cy) && b[cy][cx] === side) out.push(...line)
  }
  return out
}

function legal(b, side) {
  const out = []
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (flips(b, x, y, side).length) out.push(FILES[x] + (y + 1))
  return out
}

function score(b) {
  let a = 0, z = 0
  for (const r of b) for (const c of r) { if (c === 0) a++; else if (c === 1) z++ }
  return [a, z]
}

// mengembalikan { err } | { flipped, msg?, next?, end?: { winner, reason }, last }
function move(st, side, coord) {
  const t = sqOf(coord)
  if (!t) return { err: 'Format langkah: kotak tujuan, contoh d3.' }
  const f = flips(st.b, t.x, t.y, side)
  if (!f.length) return { err: `Langkah ${String(coord).toLowerCase()} tidak valid (harus membalik minimal 1 bidak lawan). Coba .othellohint.` }
  st.b[t.y][t.x] = side
  for (const [x, y] of f) st.b[y][x] = side
  st.last = { x: t.x, y: t.y }
  const foe = 1 - side
  const [a, z] = score(st.b)
  const base = { flipped: f.length, last: st.last }
  let msg = `🔄 ${f.length} bidak terbalik.`
  let next = foe
  if (!legal(st.b, foe).length) {
    if (!legal(st.b, side).length) {
      return { ...base, end: { winner: a === z ? -1 : a > z ? 0 : 1, reason: `Papan buntu. Skor akhir ⚫ ${a} - ${z} ⚪.` } }
    }
    next = side
    msg += '\n⏭️ Lawan tidak punya langkah, giliran dilewati — jalan lagi.'
  }
  if (a + z === 64) return { ...base, end: { winner: a === z ? -1 : a > z ? 0 : 1, reason: `Papan penuh. Skor akhir ⚫ ${a} - ${z} ⚪.` } }
  return { ...base, msg, next }
}

// teks papan (fallback)
function renderText(st) {
  const rows = []
  for (let y = 7; y >= 0; y--) {
    let r = String(y + 1) + ' '
    for (let x = 0; x < 8; x++) r += st.b[y][x] === 0 ? '⚫' : st.b[y][x] === 1 ? '⚪' : '🟩'
    rows.push(r)
  }
  rows.push('   ' + FILES.split('').join('  '))
  const [a, z] = score(st.b)
  return rows.join('\n') + `\n⚫ Hitam: ${a} • ⚪ Putih: ${z}`
}

// ───────────────────────── util ─────────────────────────
const now = () => Date.now()
const clamp = (n, a, b) => Math.max(a, Math.min(b, n))
const idOf = (jid) => String(jid || '').split('@')[0].split(':')[0]
const tag = (jid) => '@' + idOf(jid)
const timeLeft = (ms) => {
  const s = Math.ceil(ms / 1000)
  if (s < 60) return `${s} detik`
  const mm = Math.floor(s / 60)
  return mm < 60 ? `${mm} menit ${s % 60} detik` : `${Math.floor(mm / 60)} jam ${mm % 60} menit`
}

function targetOf(m, args) {
  const men = m.mentionedJid
  if (Array.isArray(men) && men[0]) return men[0]
  const q = m.quoted && m.quoted.sender
  if (q) return q
  const nr = (args || []).map((a) => String(a).replace(/[^0-9]/g, '')).find((a) => a.length >= 8 && a.length <= 16)
  return nr ? nr + '@s.whatsapp.net' : null
}

// ───────────────────────── tampilan ─────────────────────────
const CSS = String.raw`
.ot-top{position:relative;z-index:2;display:flex;gap:8px;margin-bottom:10px;}
.ot-pl{flex:1;min-width:0;display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--line);border-radius:11px;padding:7px 9px;}
.ot-pl.turn{border-color:var(--acc);background:linear-gradient(90deg,rgba(245,158,11,.2),var(--card));}
.ot-pl .nm{min-width:0;flex:1;font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ot-pl .sc{flex:none;font-size:18px;font-weight:900;color:var(--acc);}
.dsc{flex:none;width:18px;height:18px;border-radius:50%;}
.dsc.k{background:radial-gradient(circle at 35% 30%,#555,#050505);border:1px solid #777;}
.dsc.w{background:radial-gradient(circle at 35% 30%,#fff,#c9cdd6);border:1px solid #fff;}
.ot-wrap{position:relative;z-index:2;display:grid;grid-template-columns:14px 1fr;grid-template-rows:1fr 14px;gap:2px;}
.ot-rk{display:flex;flex-direction:column-reverse;justify-content:space-around;font-size:9px;font-weight:800;color:var(--soft);text-align:center;}
.ot-fl{display:flex;justify-content:space-around;font-size:9px;font-weight:800;color:var(--soft);grid-column:2;}
.ot-bd{display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);gap:2px;padding:3px;border-radius:9px;background:#0a3d22;border:2px solid #1f6b3b;}
.sq{aspect-ratio:1;background:#14803f;border-radius:3px;position:relative;display:flex;align-items:center;justify-content:center;}
.sq.last{box-shadow:inset 0 0 0 2px #fbbf24;}
.d{width:80%;height:80%;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,.5);}
.d.k{background:radial-gradient(circle at 35% 30%,#555,#050505);}
.d.w{background:radial-gradient(circle at 35% 30%,#fff,#c9cdd6);}
.sq.lg::after{content:"";width:28%;height:28%;border-radius:50%;background:rgba(251,191,36,.85);}
.ot-ev{position:relative;z-index:2;margin-top:10px;text-align:center;font-size:12px;font-weight:800;line-height:1.4;}
`
const FR = (sub, body, icon = '⚫') => GC.frame(sub, body, { title: 'OTHELLO', icon, css: CSS })

function boardHtml(g, { marks = true } = {}) {
  const st = g.st
  const lg = marks && g.on ? new Set(legal(st.b, g.turn)) : new Set()
  let cells = ''
  for (let y = 7; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const v = st.b[y][x]
      const cls = ['sq']
      if (st.last && st.last.x === x && st.last.y === y) cls.push('last')
      if (lg.has(FILES[x] + (y + 1))) cls.push('lg')
      cells += `<div class="${cls.join(' ')}">${v === -1 ? '' : `<div class="d ${v === 0 ? 'k' : 'w'}"></div>`}</div>`
    }
  }
  const ranks = Array.from({ length: 8 }, (_, i) => `<span>${i + 1}</span>`).join('')
  const files = FILES.split('').map((c) => `<span>${c}</span>`).join('')
  return `<div class="ot-wrap"><div class="ot-rk">${ranks}</div><div class="ot-bd">${cells}</div><div class="ot-fl">${files}</div></div>`
}

function topHtml(g) {
  const [a, z] = score(g.st.b)
  const one = (i, sc, cls) => `<div class="ot-pl${g.on && g.turn === i ? ' turn' : ''}"><span class="dsc ${cls}"></span><div class="nm">${esc(g.names[i])}</div><div class="sc">${sc}</div></div>`
  return `<div class="ot-top">${one(0, a, 'k')}${one(1, z, 'w')}</div>`
}

function gameCard(g, note) {
  const left = timeLeft(Math.max(0, g.limit - (now() - g.last)))
  return FR(`${g.names[0]} vs ${g.names[1]}`, `${topHtml(g)}${boardHtml(g)}
 <div class="ot-ev">${note ? esc(note).replace(/\n/g, '<br>') + '<br>' : ''}Giliran: ${esc(g.names[g.turn])} (${SIDES[g.turn]}) · sisa ${left}</div>
 <div class="hint"><code>.othellolangkah &lt;d3&gt;</code> · titik kuning = langkah legal</div>`)
}

function challengeCard(g) {
  return FR('Tantangan!', `<div class="win" style="padding-top:10px"><div class="tr">⚔️</div><div class="wn" style="font-size:16px">${esc(g.names[0])} <span class="muted">menantang</span> ${esc(g.names[1])}</div></div>
 <div class="hint">${esc(g.names[1])}: <code>.othelloterima</code> atau <code>.othellotolak</code><div class="muted" style="margin-top:4px">kedaluwarsa 5 menit</div></div>`, '⚔️')
}

function endCard(g, winner, reason) {
  const head = winner === -1 ? 'SERI' : `${g.names[winner]} MENANG!`
  return FR('Permainan selesai', `<div class="win"><div class="tr">${winner === -1 ? '🤝' : '🏆'}</div><div class="wn">${esc(head)}</div><div class="muted" style="margin-top:4px">${esc(reason)}</div></div>
 ${topHtml(g)}${boardHtml(g, { marks: false })}
 <div class="hint">Main lagi? <code>.othello @user</code></div>`, winner === -1 ? '🤝' : '🏆')
}

async function emit(sock, chat, html, title, fallback, mentions = []) {
  if (await GC.sendCard(sock, chat, html, title)) return true
  try { await sock.sendMessage(chat, { text: fallback, mentions }) } catch (e) { console.error('[OTHELLO] gagal kirim:', e.message) }
  return false
}

function boardText(g) {
  return `⚫ *OTHELLO*\n${tag(g.p[0])} (${SIDES[0]}) vs ${tag(g.p[1])} (${SIDES[1]})\n\n${renderText(g.st)}\n\n` +
    `Giliran: ${tag(g.p[g.turn])} (${SIDES[g.turn]})\nLangkah: *.othellolangkah d3* • sisa waktu ${timeLeft(Math.max(0, g.limit - (now() - g.last)))}`
}

// ───────────────────────── timer giliran ─────────────────────────
function armTimer(g, sock) {
  clearTimeout(g.timer)
  if (!g.on) return
  const token = ++g.token
  g.timer = setTimeout(() => {
    if (!g.on || g.token !== token || games.get(g.chat) !== g) return
    const loser = g.turn
    finish(sock, g, 1 - loser, `⏰ ${g.names[loser]} kehabisan waktu (${timeLeft(g.limit)} per langkah).`).catch((e) => console.error('[OTHELLO] timeout:', e))
  }, g.limit)
  if (g.timer.unref) g.timer.unref()
}

async function finish(sock, g, winner, reason) {
  clearTimeout(g.timer)
  g.on = false
  games.delete(g.chat)
  const head = winner === -1 ? '🤝 *Othello* berakhir SERI' : `🏆 *Othello* — pemenang: ${tag(g.p[winner])} (${SIDES[winner]})`
  return emit(sock, g.chat, endCard(g, winner, reason), 'Othello · Selesai', `${head}\n${reason}\n\n${renderText(g.st)}`, g.p)
}

// ───────────────────────── handler ─────────────────────────
const HELP = `⚫ *OTHELLO*\n\n` +
  `Othello (Reversi) 8x8.\n• Taruh bidak di kotak kosong yang mengapit bidak lawan (lurus/diagonal) → bidak terapit terbalik jadi warnamu.\n• Tidak ada langkah → giliran otomatis dilewati.\n• Menang: bidak terbanyak saat papan penuh/buntu.\n\n` +
  `*Perintah*\n• .othello @user — tantang pemain (atau balas pesannya)\n• .othelloterima / .othellotolak\n• .othellolangkah d3\n• .othelloboard — lihat papan\n• .othellohint — daftar langkah legal\n• .othelloskor — skor sekarang\n• .othellomenyerah • .othellodraw (seri)\n• .othellotimer <menit 1-120>`

const ALIAS = { buat: 'create', create: 'create', terima: 'terima', tolak: 'tolak', board: 'board', papan: 'board', langkah: 'langkah', move: 'langkah',
  menyerah: 'menyerah', draw: 'draw', seri: 'draw', timer: 'timer', hint: 'hint', skor: 'skor', help: 'help', menu: 'help' }

const handler = async (m, { shorekeeper, Reply, command, args }) => {
  if (!m.isGroup) return Reply('⚫ Othello hanya bisa dimainkan di grup.')
  const sock = shorekeeper
  const chat = m.chat
  const sender = m.sender
  const cmd = String(command).toLowerCase().replace(/-/g, '')
  const raw = cmd === 'othello' ? '' : cmd.replace(/^othello/, '')
  const sub = cmd === 'othello' ? 'create' : (ALIAS[raw] || 'help')
  const rest = [...args]
  let g = games.get(chat)

  if (sub === 'help') return Reply(HELP)

  // kedaluwarsa tantangan
  if (g && !g.on && now() - g.at > PENDING_MS) { games.delete(chat); g = null }

  const idx = (jid) => (g ? g.p.indexOf(jid) : -1)

  if (sub === 'create') {
    if (g) return Reply(g.on ? 'Sudah ada permainan Othello di grup ini. Lihat dengan *.othelloboard*.' : 'Masih ada tantangan Othello yang menunggu jawaban.')
    const foe = targetOf(m, rest)
    if (!foe) return Reply('Tantang seseorang dengan cara: *.othello @user* (atau balas pesannya).\nPanduan: *.othellohelp*')
    if (idOf(foe) === idOf(sender)) return Reply('Tidak bisa menantang diri sendiri.')
    if (sock.user && (idOf(foe) === idOf(sock.user.id) || idOf(foe) === idOf(sock.user.jid))) return Reply('Bot tidak ikut bermain 😅')
    const foeName = (m.quoted && m.quoted.sender === foe && (m.quoted.pushName || m.quoted.name)) || ('+' + idOf(foe))
    g = { chat, p: [sender, foe], names: [m.pushName || 'Pemain 1', foeName], on: false, at: now(), st: null, turn: 0, n: 0, limit: DEFAULT_LIMIT, last: now(), draw: null, timer: null, token: 0 }
    g.st = init() // untuk kartu tantangan
    games.set(chat, g)
    return emit(sock, chat, challengeCard(g), 'Othello · Tantangan',
      `⚫ ${tag(sender)} menantang ${tag(foe)} main *Othello*!\n${tag(foe)}, ketik *.othelloterima* untuk setuju atau *.othellotolak* untuk menolak (kedaluwarsa 5 menit).`, g.p)
  }

  if (sub === 'terima') {
    if (!g) return Reply('Tidak ada tantangan Othello. Buat dengan *.othello @user*.')
    if (g.on) return Reply('Permainan sudah berjalan.')
    if (idOf(sender) !== idOf(g.p[1])) return Reply('Hanya orang yang ditantang yang bisa menerima.')
    g.p[1] = sender
    if (m.pushName) g.names[1] = m.pushName
    g.on = true; g.st = init(); g.turn = 0; g.last = now()
    armTimer(g, sock)
    return emit(sock, chat, gameCard(g, 'Tantangan diterima!'), 'Othello · Papan', `✅ Tantangan diterima!\n\n${boardText(g)}`, g.p)
  }

  if (sub === 'tolak') {
    if (!g) return Reply('Tidak ada tantangan.')
    if (g.on) return Reply('Permainan sudah berjalan. Gunakan *.othellomenyerah* kalau ingin berhenti.')
    if (idx(sender) < 0 && idOf(sender) !== idOf(g.p[1])) return Reply('Kamu bukan peserta tantangan ini.')
    games.delete(chat)
    return sock.sendMessage(chat, { text: `❌ Tantangan Othello dibatalkan oleh ${tag(sender)}.`, mentions: [sender] })
  }

  if (!g || !g.on) return Reply('Belum ada permainan Othello yang berjalan.')

  if (sub === 'board') return emit(sock, chat, gameCard(g), 'Othello · Papan', boardText(g), g.p)

  const me = idx(sender)
  if (me < 0) return Reply('Kamu bukan pemain di permainan ini.')

  if (sub === 'skor') {
    const [a, z] = score(g.st.b)
    return Reply(`📊 Skor Othello: ⚫ ${a} - ${z} ⚪`)
  }

  if (sub === 'hint') {
    if (me !== g.turn) return Reply('Hint hanya untuk pemain yang sedang giliran.')
    return Reply(`💡 Langkah legal: ${legal(g.st.b, me).join(', ')}`)
  }

  if (sub === 'menyerah') return finish(sock, g, 1 - me, `🏳️ ${g.names[me]} menyerah.`)

  if (sub === 'draw') {
    if (g.draw === null || g.draw === me) {
      g.draw = me
      return sock.sendMessage(chat, { text: `🤝 ${tag(sender)} menawarkan seri. ${tag(g.p[1 - me])} ketik *.othellodraw* untuk menerima.`, mentions: g.p })
    }
    return finish(sock, g, -1, '🤝 Kedua pemain sepakat seri.')
  }

  if (sub === 'timer') {
    const min = parseInt(String(rest[0] || '').replace(/[^0-9-]/g, ''), 10)
    if (!Number.isFinite(min)) return Reply(`⏱️ Batas waktu: ${timeLeft(g.limit)} per langkah.\nSisa giliran ini: ${timeLeft(Math.max(0, g.limit - (now() - g.last)))}\nUbah: *.othellotimer <menit 1-120>*`)
    g.limit = clamp(min, 1, 120) * 60000
    g.last = now()
    armTimer(g, sock)
    return Reply(`⏱️ Batas waktu diubah: ${timeLeft(g.limit)} per langkah.`)
  }

  if (sub === 'langkah') {
    if (me !== g.turn) return Reply(`Sekarang giliran ${tag(g.p[g.turn])}.`)
    if (!rest.length) return Reply('Format: *.othellolangkah d3*')
    const r = move(g.st, me, rest[0])
    if (r.err) return Reply('❌ ' + r.err)
    g.n++; g.last = now(); g.draw = null
    if (r.end) return finish(sock, g, r.end.winner, r.end.reason)
    g.turn = r.next
    armTimer(g, sock)
    return emit(sock, chat, gameCard(g, `${g.names[me]} → ${String(rest[0]).toLowerCase()}\n${r.msg}`), 'Othello · Papan',
      `${r.msg}\n\n${boardText(g)}`, g.p)
  }

  return Reply(HELP)
}

handler.command = [
  'othello', 'othelloterima', 'othellotolak', 'othellolangkah', 'othelloboard', 'othellohint', 'othelloskor', 'othellomenyerah', 'othellodraw', 'othellotimer', 'othellohelp',
  'othello-terima', 'othello-tolak', 'othello-langkah', 'othello-board', 'othello-hint', 'othello-skor', 'othello-menyerah', 'othello-draw', 'othello-timer', 'othello-help'
]
handler.help = ['othello']
handler.tags = ['game']

handler._internals = { init, flips, legal, score, move, games, boardHtml, gameCard }

module.exports = handler
