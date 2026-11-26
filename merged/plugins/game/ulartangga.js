/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * ULAR TANGGA multi-pemain (2-6 orang) di grup, kartu rich HTML.
 * Papan 100 kotak, harus sampai kotak 100 dengan angka PAS (kelebihan = mundur).
 * Dadu 6 = jalan lagi. Menimpa pemain lain = lawan kembali ke start.
 *
 * Perintah: .ulartangga  .ulartanggajoin  .ulartanggastart  .ulartanggaroll
 *           .ulartanggaboard  .ulartanggastop  .ulartanggahelp
 */

'use strict'

const GC = require('../../lib/gamecard.cjs')

const MIN_PLAYERS = 2
const MAX_PLAYERS = 6
const IDLE_MS = 30 * 60 * 1000 // permainan dibersihkan kalau 30 menit tanpa aktivitas

const COLORS = ['#ef4444', '#22c55e', '#eab308', '#3b82f6', '#a855f7', '#f97316']
const CEMO = ['🔴', '🟢', '🟡', '🔵', '🟣', '🟠']
const LADDERS = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91 }
const SNAKES = { 17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 79 }

const games = new Map() // chat -> game

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
const tag = (p) => `@${String(p.id).split('@')[0].split(':')[0]}`
const cur = (g) => g.players[g.turn]

// ───────────────────────── tampilan ─────────────────────────
const CSS = String.raw`
.bd{position:relative;z-index:2;display:grid;grid-template-columns:repeat(10,1fr);gap:2px;margin:6px 0 10px;background:#0b0d12;padding:3px;border-radius:10px;border:1px solid var(--line);}
.sq{position:relative;aspect-ratio:1;border-radius:4px;background:#1b2030;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.sq.alt{background:#232a3d;}
.sq .no{position:absolute;left:2px;top:1px;font-size:7.5px;font-weight:800;color:#6b7280;}
.sq.lad{background:#14532d;}.sq.snk{background:#7f1d1d;}
.sq.lad .no,.sq.snk .no{color:#d1d5db;}
.sq .mk{font-size:8.5px;font-weight:900;color:#fff;margin-top:6px;white-space:nowrap;}
.sq.fin{background:linear-gradient(135deg,#fbbf24,#f59e0b);}
.sq.fin .mk{color:#1a1200;font-size:11px;margin-top:0;}
.tk{position:absolute;bottom:2px;left:0;right:0;display:flex;justify-content:center;gap:1px;flex-wrap:wrap;}
.tk i{display:block;width:9px;height:9px;border-radius:50%;border:1.5px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.6);}
.sq.on{outline:2px solid #fff;outline-offset:-2px;}
.leg{position:relative;z-index:2;display:flex;gap:6px;flex-wrap:wrap;font-size:10px;color:var(--soft);margin-bottom:6px;}
.leg b{color:#fff;}
.dice{width:44px;height:44px;border-radius:10px;background:#fff;color:#111;font-size:26px;font-weight:900;display:flex;align-items:center;justify-content:center;flex:none;box-shadow:0 3px 8px rgba(0,0,0,.5);}
.pk{display:inline-block;width:12px;height:12px;border-radius:50%;border:2px solid #fff;margin-right:7px;vertical-align:-2px;}
.cnt{flex:none;font-size:14px;font-weight:900;color:var(--acc);}
`

function squareNums() {
  const out = []
  for (let r = 9; r >= 0; r--) {
    for (let c = 0; c < 10; c++) out.push(r % 2 === 0 ? r * 10 + c + 1 : r * 10 + (9 - c) + 1)
  }
  return out
}
const NUMS = squareNums()

function boardHtml(g, lastRoll, log) {
  const cells = NUMS.map((n, i) => {
    const here = g.players.map((p, pi) => (p.pos === n ? pi : -1)).filter((x) => x >= 0)
    const cls = ['sq', (Math.floor(i / 10) + i) % 2 ? 'alt' : '', LADDERS[n] ? 'lad' : '', SNAKES[n] ? 'snk' : '', n === 100 ? 'fin' : '',
      g.state === 'playing' && cur(g) && cur(g).pos === n && n > 0 ? 'on' : ''].filter(Boolean).join(' ')
    const mk = n === 100 ? '🏁' : LADDERS[n] ? `↑${LADDERS[n]}` : SNAKES[n] ? `↓${SNAKES[n]}` : ''
    const tk = here.length ? `<div class="tk">${here.map((pi) => `<i style="background:${COLORS[pi]}"></i>`).join('')}</div>` : ''
    return `<div class="${cls}"><span class="no">${n}</span>${mk ? `<span class="mk">${mk}</span>` : ''}${tk}</div>`
  }).join('')

  const start = g.players.filter((p) => p.pos === 0)
  const rows = g.players.map((p, i) => {
    const turn = g.state === 'playing' && i === g.turn
    return `<div class="p${turn ? ' me' : ''}"><div class="nm"><span class="pk" style="background:${COLORS[i]}"></span>${GC.esc(p.name)}${turn ? '<span class="tg">GILIRAN</span>' : ''}</div><div class="cnt">${p.pos === 0 ? 'Start' : p.pos}</div></div>`
  }).join('')

  const diceRow = lastRoll
    ? `<div class="row" style="margin-bottom:8px"><div class="dice">${lastRoll}</div><div class="log" style="margin:0;flex:1">${String(log || '').split('\n').filter(Boolean).map((l) => `<div>${GC.esc(l)}</div>`).join('')}</div></div>`
    : GC.logHtml(log)

  const body = `${diceRow}
 <div class="bd">${cells}</div>
 <div class="leg"><span>🪜 <b>↑</b> tangga</span><span>🐍 <b>↓</b> ular</span><span>🏁 100 harus PAS</span><span>🎲 6 = jalan lagi</span></div>
 <div class="pl">${rows}</div>
 <div class="hint">${g.state === 'playing' ? `Giliran <b>${GC.esc(cur(g).name)}</b> · <code>.ulartanggaroll</code>` : '<code>.ulartanggajoin</code> gabung · <code>.ulartanggastart</code> mulai (host)'}</div>`
  void start
  return GC.frame(g.state === 'playing' ? `Giliran ${cur(g).name} · ${g.players.length} pemain` : `Lobby · ${g.players.length}/${MAX_PLAYERS} pemain`, body, { title: 'ULAR TANGGA', icon: '🐍', css: CSS })
}

function winHtml(g, winner, log) {
  const rows = g.players.map((p, i) => `<div class="p${p === winner ? ' me' : ''}"><div class="nm"><span class="pk" style="background:${COLORS[i]}"></span>${GC.esc(p.name)}</div><div class="cnt">${p === winner ? '🏁 100' : p.pos}</div></div>`).join('')
  const body = `<div class="win"><div class="tr">🏆</div><div class="wn">${GC.esc(winner.name)}</div><div class="muted" style="margin-top:4px">MENANG Ular Tangga! 🎉</div></div>
 ${GC.logHtml(log)}<div class="pl">${rows}</div><div class="hint">Main lagi? ketik <code>.ulartangga</code></div>`
  return GC.frame('Permainan selesai', body, { title: 'ULAR TANGGA', icon: '🐍', css: CSS })
}

// teks cadangan
function boardText(g) {
  const rows = []
  for (let r = 9; r >= 0; r--) {
    const line = []
    for (let c = 0; c < 10; c++) {
      const n = r % 2 === 0 ? r * 10 + c + 1 : r * 10 + (9 - c) + 1
      const pi = g.players.findIndex((p) => p.pos === n)
      line.push(pi >= 0 ? CEMO[pi] : n === 100 ? '🏁' : SNAKES[n] ? '🐍' : LADDERS[n] ? '🪜' : '⬜')
    }
    rows.push(line.join(''))
  }
  const pl = g.players.map((p, i) => `${CEMO[i]} ${tag(p)}: ${p.pos}${g.state === 'playing' && g.turn === i ? ' 👈' : ''}`).join('\n')
  return `${rows.join('\n')}\n\n${pl}\n\n🪜 ${Object.entries(LADDERS).map(([a, b]) => `${a}→${b}`).join(' ')}\n🐍 ${Object.entries(SNAKES).map(([a, b]) => `${a}→${b}`).join(' ')}`
}

// ───────────────────────── kirim ─────────────────────────
async function say(g, text, extra = []) {
  const mentions = [...new Set([...g.players.map((p) => p.id), ...extra])]
  try { await g.sock.sendMessage(g.chat, { text, mentions }) } catch (e) { console.error('[ULARTANGGA] gagal kirim:', e.message) }
}

// kartu papan + mention singkat; cadangan: teks
async function announce(g, log, roll, extra = []) {
  const ok = await GC.sendCard(g.sock, g.chat, boardHtml(g, roll, log), 'Ular Tangga')
  if (!ok) return say(g, `${log ? log + '\n\n' : ''}${boardText(g)}${g.state === 'playing' ? `\n\nGiliran ${tag(cur(g))} — *.ulartanggaroll*` : ''}`, extra)
  if (g.state === 'playing') return say(g, `👉 Giliran ${tag(cur(g))}`, [cur(g).id])
}

function touch(g) {
  clearTimeout(g.idle)
  g.idle = setTimeout(() => {
    if (games.get(g.chat) === g) {
      games.delete(g.chat)
      g.sock.sendMessage(g.chat, { text: '⌛ Ular Tangga dihentikan karena lama tidak ada aktivitas.' }).catch(() => {})
    }
  }, IDLE_MS)
  if (g.idle.unref) g.idle.unref()
}

function end(g) { clearTimeout(g.idle); g.state = 'done'; games.delete(g.chat) }

const HELP = `🐍 *ULAR TANGGA*\n\n*.ulartangga* — buat permainan\n*.ulartanggajoin* — gabung (${MIN_PLAYERS}-${MAX_PLAYERS} pemain)\n*.ulartanggastart* — mulai (host)\n*.ulartanggaroll* — kocok dadu\n*.ulartanggaboard* — lihat papan\n*.ulartanggastop* — hentikan (host/admin/owner)\n\nSampai kotak 100 dengan angka PAS (kelebihan akan mundur). Dadu 6 = giliran tambahan. Menimpa pemain lain = lawan kembali ke start.`

async function isGroupAdmin(sock, m) {
  try {
    const meta = await sock.groupMetadata(m.chat)
    const n = (id) => String(id || '').split('@')[0].split(':')[0]
    return (meta.participants || []).some((p) => p.admin && [p.id, p.jid, p.lid].some((x) => x && n(x) === n(m.sender)))
  } catch { return false }
}

// ───────────────────────── logika ─────────────────────────
// gerakkan pemain idx sebanyak roll. Mengembalikan { log, pos, won }
function move(g, idx, roll) {
  const p = g.players[idx]
  let pos = p.pos + roll
  let note = ''
  if (pos > 100) { pos = 100 - (pos - 100); note = ' (kelebihan, mundur!)' }
  if (LADDERS[pos]) { note += ` 🪜 naik tangga ${pos}→${LADDERS[pos]}!`; pos = LADDERS[pos] }
  else if (SNAKES[pos]) { note += ` 🐍 digigit ular ${pos}→${SNAKES[pos]}!`; pos = SNAKES[pos] }
  g.players.forEach((o, oi) => {
    if (oi !== idx && o.pos === pos && pos > 0 && pos < 100) { o.pos = 0; note += ` 💥 ${o.name} tertimpa, kembali ke start!` }
  })
  p.pos = pos
  return { pos, note, won: pos === 100 }
}

// ───────────────────────── handler ─────────────────────────
const handler = async (m, { shorekeeper, Reply, command, isCreator }) => {
  if (!m.isGroup) return Reply('🐍 Ular Tangga hanya bisa dimainkan di grup.')
  const sock = shorekeeper
  const cmd = String(command).toLowerCase()
  const sub = cmd === 'ulartangga' ? 'create' : cmd.replace(/^ulartangga/, '')
  const name = m.pushName || 'Pemain'

  let g = games.get(m.chat)

  if (sub === 'help' || sub === 'menu') return Reply(HELP)

  if (sub === 'create') {
    if (g) return Reply(g.state === 'lobby' ? `🐍 Sudah ada lobby (${g.players.length} pemain). Ketik *.ulartanggajoin*.` : '🐍 Permainan sedang berjalan. Ketik *.ulartanggaboard*.')
    g = { chat: m.chat, sock, host: m.sender, state: 'lobby', players: [{ id: m.sender, name, pos: 0 }], turn: 0, idle: null }
    games.set(m.chat, g)
    touch(g)
    return announce(g, `${name} membuat Ular Tangga`, null, [m.sender])
  }

  if (!g) return Reply('🐍 Belum ada permainan. Buat dengan *.ulartangga*.')
  touch(g)
  const idx = g.players.findIndex((p) => p.id === m.sender)

  if (sub === 'join') {
    if (g.state !== 'lobby') return Reply('Permainan sudah dimulai.')
    if (idx >= 0) return Reply('Kamu sudah bergabung.')
    if (g.players.length >= MAX_PLAYERS) return Reply(`Pemain penuh (maks ${MAX_PLAYERS}).`)
    g.players.push({ id: m.sender, name, pos: 0 })
    return announce(g, `${name} bergabung sebagai ${CEMO[g.players.length - 1]}`, null, [m.sender])
  }

  if (sub === 'board') return announce(g, '')

  if (sub === 'stop') {
    if (m.sender !== g.host && !isCreator && !(await isGroupAdmin(sock, m))) return Reply('Hanya host/admin/owner yang bisa menghentikan.')
    end(g)
    return Reply('🛑 Ular Tangga dihentikan.')
  }

  if (sub === 'start') {
    if (g.state !== 'lobby') return Reply('Permainan sudah dimulai.')
    if (m.sender !== g.host && !isCreator) return Reply('Hanya host yang bisa memulai.')
    if (g.players.length < MIN_PLAYERS) return Reply(`Minimal ${MIN_PLAYERS} pemain.`)
    g.state = 'playing'
    g.turn = 0
    return announce(g, 'Ular Tangga dimulai! Semua mulai dari Start.', null)
  }

  if (sub === 'roll') {
    if (g.state !== 'playing') return Reply(`Belum dimulai. Host ketik *.ulartanggastart*.`)
    if (idx !== g.turn) return Reply(`Sekarang giliran ${cur(g).name}.`)
    const me = g.players[idx]
    const roll = rnd(1, 6)
    const from = me.pos
    const res = move(g, idx, roll)
    const log = `${me.name} dapat ${roll}: ${from === 0 ? 'Start' : from} → ${res.pos}${res.note}`
    if (res.won) {
      end(g)
      const ok = await GC.sendCard(sock, m.chat, winHtml(g, me, log), 'Ular Tangga · Pemenang')
      if (!ok) return say(g, `🎲 ${log}\n\n🏆 *${me.name} MENANG Ular Tangga!* 🎉`, [me.id])
      return say(g, `🏆 Selamat ${tag(me)}! 🎉`, [me.id])
    }
    const extra = roll === 6
    if (!extra) g.turn = (g.turn + 1) % g.players.length
    return announce(g, extra ? `${log}\n➕ Dadu 6! ${me.name} jalan lagi.` : log, roll, [me.id])
  }

  return Reply(HELP)
}

handler.command = ['ulartangga', 'ulartanggajoin', 'ulartanggastart', 'ulartanggaroll', 'ulartanggaboard', 'ulartanggastop', 'ulartanggahelp']
handler.help = ['ulartangga']
handler.tags = ['game']

// dipakai tes
handler._internals = { games, move, LADDERS, SNAKES, boardHtml, winHtml }

module.exports = handler
