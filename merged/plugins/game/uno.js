/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * UNO multi-pemain (2-10 orang) di grup. Kartu tangan dikirim lewat chat pribadi.
 *
 * Perintah: .uno [buat|join|start|play|draw|pass|hand|info|leave|stop]
 * Pintasan : .unojoin .unostart .unoplay <nomor> [warna] .unodraw .unopass .unohand .unoinfo .unoleave .unostop
 */

'use strict'

const UC = require('../../lib/unocard.cjs')

const COLORS = ['r', 'y', 'g', 'b']
const CNAME = { r: 'Merah', y: 'Kuning', g: 'Hijau', b: 'Biru' }
const CEMO = { r: '🟥', y: '🟨', g: '🟩', b: '🟦', w: '⬛' }
const COLOR_ALIAS = {
  r: 'r', merah: 'r', red: 'r',
  y: 'y', kuning: 'y', yellow: 'y',
  g: 'g', hijau: 'g', green: 'g',
  b: 'b', biru: 'b', blue: 'b'
}
const VALUE_NAME = { S: 'Skip', R: 'Reverse', D: '+2', W: 'Wild', F: 'Wild +4' }

const MIN_PLAYERS = 2
const MAX_PLAYERS = 10
const START_HAND = 7
const TURN_MS = 120 * 1000          // batas waktu satu giliran
const MAX_TIMEOUTS = 3              // berturut-turut tidak bergerak -> dikeluarkan
const LOBBY_MS = 10 * 60 * 1000     // lobby kedaluwarsa

const games = new Map() // chat -> game

// ───────────────────────── kartu ─────────────────────────
function buildDeck() {
  const deck = []
  for (const c of COLORS) {
    deck.push({ c, v: '0' })
    for (let n = 1; n <= 9; n++) { deck.push({ c, v: String(n) }); deck.push({ c, v: String(n) }) }
    for (const v of ['S', 'R', 'D']) { deck.push({ c, v }); deck.push({ c, v }) }
  }
  for (let i = 0; i < 4; i++) { deck.push({ c: 'w', v: 'W' }); deck.push({ c: 'w', v: 'F' }) }
  return deck // 108 kartu
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const label = (card) => card.c === 'w'
  ? `${CEMO.w} ${VALUE_NAME[card.v]}`
  : `${CEMO[card.c]} ${CNAME[card.c]} ${VALUE_NAME[card.v] || card.v}`

const canPlay = (g, card) => card.c === 'w' || card.c === g.color || card.v === g.top.v

// Wild +4 hanya boleh kalau tidak punya kartu warna yang sedang berlaku
const wildFourAllowed = (g, hand) => !hand.some((x) => x.c === g.color)

function draw(g, n) {
  const out = []
  for (let i = 0; i < n; i++) {
    if (!g.deck.length) {
      // kocok ulang tumpukan buangan (kecuali kartu teratas)
      const keep = g.discard.pop()
      g.deck = shuffle(g.discard.map((x) => (x.c === 'w' || x.wildColor ? { c: 'w', v: x.v } : x)))
      g.discard = keep ? [keep] : []
    }
    if (!g.deck.length) break
    out.push(g.deck.pop())
  }
  return out
}

// ───────────────────────── giliran ─────────────────────────
const cur = (g) => g.players[g.turn]
const idxFrom = (g, steps) => (((g.turn + g.dir * steps) % g.players.length) + g.players.length) % g.players.length

function advance(g, steps = 1) {
  g.turn = idxFrom(g, steps)
  g.drawn = false
}

function removePlayer(g, i) {
  const [p] = g.players.splice(i, 1)
  g.deck = shuffle([...g.deck, ...p.hand.map((x) => (x.c === 'w' || x.wildColor ? { c: 'w', v: x.v } : x))])
  if (!g.players.length) return p
  if (i === g.turn) {
    g.turn = g.dir === 1 ? i % g.players.length : (i - 1 + g.players.length) % g.players.length
    g.drawn = false
  } else if (i < g.turn) {
    g.turn--
  }
  return p
}

// ───────────────────────── tampilan ─────────────────────────
const tag = (p) => `@${String(p.id).split('@')[0].split(':')[0]}`

function handText(g, p) {
  const mine = cur(g) && cur(g).id === p.id
  const lines = p.hand.map((card, i) => {
    const ok = mine && canPlay(g, card) && (card.v !== 'F' || wildFourAllowed(g, p.hand))
    return `${String(i + 1).padStart(2, ' ')}. ${label(card)}${ok ? ' ✅' : ''}`
  })
  return `🃏 *KARTU KAMU* (${p.hand.length})\n${lines.join('\n')}\n\n` +
    `Teratas : ${label(g.top)}\nWarna   : ${CEMO[g.color]} ${CNAME[g.color]}\n` +
    (mine ? `\n*Giliranmu!* ✅ = bisa dimainkan\n.unoplay <nomor> [warna]  ·  .unodraw` : '\nTunggu giliranmu.')
}

function statusText(g) {
  const p = cur(g)
  const order = g.players.map((x, i) => `${i === g.turn ? '👉' : '▫️'} ${x.name} — ${x.hand.length} kartu`).join('\n')
  return `🎴 *UNO*\nTeratas : ${label(g.top)}\nWarna   : ${CEMO[g.color]} ${CNAME[g.color]}\nArah    : ${g.dir === 1 ? '➡️' : '⬅️'}\nSisa deck : ${g.deck.length}\n\n${order}\n\nGiliran: ${tag(p)}`
}

async function say(g, text, extraMentions = []) {
  const mentions = [...new Set([...g.players.map((p) => p.id), ...extraMentions])]
  try { await g.sock.sendMessage(g.chat, { text, mentions }) } catch (e) { console.error('[UNO] gagal kirim ke grup:', e.message) }
}

async function sendHand(g, p) {
  const mine = !!cur(g) && cur(g).id === p.id
  const playable = (c) => canPlay(g, c) && (c.v !== 'F' || wildFourAllowed(g, p.hand))
  const html = UC.handHtml(g, p, { playable, mine })
  if (await UC.sendCard(g.sock, p.id, html, 'UNO · Kartu kamu')) return true
  try {
    await g.sock.sendMessage(p.id, { text: handText(g, p) })
    return true
  } catch (e) {
    await say(g, `⚠️ ${tag(p)} kartumu gagal dikirim ke chat pribadi. Chat bot dulu secara pribadi, lalu ketik *.unohand*.`)
    return false
  }
}

// kartu meja di grup (+ mention singkat untuk yang gilirannya). Cadangan: teks.
async function announce(g, log, extraMentions = []) {
  const ok = await UC.sendCard(g.sock, g.chat, UC.tableHtml(g, log), 'UNO · Meja')
  if (!ok) return say(g, `${log ? log + '\n\n' : ''}${statusText(g)}`, extraMentions)
  const p = cur(g)
  if (p) return say(g, `👉 Giliran ${tag(p)}`, [p.id])
}

async function announceLobby(g, note, fallback, extraMentions = []) {
  const ok = await UC.sendCard(g.sock, g.chat, UC.lobbyHtml(g, MIN_PLAYERS, MAX_PLAYERS, note), 'UNO · Lobby')
  if (!ok) return say(g, fallback, extraMentions)
  return say(g, `🎴 Ketik *.unojoin* untuk gabung · host: *.unostart*`, extraMentions)
}

async function announceWin(g, winner, log) {
  const ok = await UC.sendCard(g.sock, g.chat, UC.winHtml(g, winner, log), 'UNO · Pemenang')
  if (!ok) return say(g, `${log}\n\n🏆 *${winner.name} MENANG!* Selamat 🎉`, [winner.id])
  return say(g, `🏆 Selamat ${tag(winner)}! 🎉`, [winner.id])
}

// ───────────────────────── timer ─────────────────────────
function armTimer(g) {
  clearTimeout(g.timer)
  if (g.state !== 'playing') return
  const token = ++g.token
  g.timer = setTimeout(() => onTimeout(g, token).catch((e) => console.error('[UNO] timeout error:', e)), TURN_MS)
  if (g.timer.unref) g.timer.unref()
}

async function onTimeout(g, token) {
  if (g.state !== 'playing' || g.token !== token) return
  const p = cur(g)
  p.skips = (p.skips || 0) + 1
  if (p.skips >= MAX_TIMEOUTS) {
    removePlayer(g, g.turn)
    await say(g, `⏰ ${p.name} dikeluarkan karena ${MAX_TIMEOUTS}x tidak bergerak.`, [p.id])
    if (g.players.length < MIN_PLAYERS) return finishAlone(g)
    await announce(g)
    armTimer(g)
    return sendHand(g, cur(g))
  }
  if (!g.drawn) p.hand.push(...draw(g, 1))
  advance(g, 1)
  await announce(g, `⏰ ${p.name} kehabisan waktu: ambil 1 kartu, giliran dilewati.`, [p.id])
  armTimer(g)
  return sendHand(g, cur(g))
}

async function finishAlone(g) {
  const w = g.players[0]
  games.delete(g.chat)
  clearTimeout(g.timer)
  g.state = 'done'
  if (w) await announceWin(g, w, 'Pemain lain keluar, menang otomatis.')
  else await say(g, '🏆 Semua pemain keluar.')
}

// ───────────────────────── aksi ─────────────────────────
function newGame(m, sock) {
  const g = {
    chat: m.chat, sock, host: m.sender, state: 'lobby',
    players: [{ id: m.sender, name: m.pushName || 'Pemain', hand: [], skips: 0 }],
    deck: [], discard: [], top: null, color: 'r', turn: 0, dir: 1, drawn: false,
    timer: null, token: 0, createdAt: Date.now()
  }
  games.set(m.chat, g)
  g.timer = setTimeout(() => {
    if (games.get(m.chat) === g && g.state === 'lobby') {
      games.delete(m.chat)
      sock.sendMessage(m.chat, { text: '⌛ Lobby UNO kedaluwarsa karena tidak dimulai.' }).catch(() => {})
    }
  }, LOBBY_MS)
  if (g.timer.unref) g.timer.unref()
  return g
}

function startGame(g) {
  clearTimeout(g.timer)
  g.deck = shuffle(buildDeck())
  g.discard = []
  for (const p of g.players) p.hand = draw(g, START_HAND)
  // kartu awal harus kartu angka
  let first = draw(g, 1)[0]
  while (first.c === 'w' || !/^\d$/.test(first.v)) { g.deck.unshift(first); shuffle(g.deck); first = draw(g, 1)[0] }
  g.top = first
  g.color = first.c
  g.discard.push(first)
  g.state = 'playing'
  g.turn = Math.floor(Math.random() * g.players.length)
  g.dir = 1
  g.drawn = false
  g.players.forEach((p) => { p.skips = 0 })
}

// mainkan kartu nomor idx (1-based). Mengembalikan { error } atau { log, winner }
function playCard(g, p, idx, colorArg) {
  const i = idx - 1
  const card = p.hand[i]
  if (!card) return { error: `Nomor kartu tidak ada. Kartumu 1-${p.hand.length}.` }
  if (!canPlay(g, card)) return { error: `Kartu itu tidak cocok dengan ${label(g.top)} (warna ${CNAME[g.color]}).` }
  let chosen = null
  if (card.c === 'w') {
    chosen = COLOR_ALIAS[String(colorArg || '').toLowerCase()]
    if (!chosen) return { error: 'Kartu Wild butuh warna. Contoh: .unoplay ' + idx + ' merah (merah/kuning/hijau/biru).' }
    if (card.v === 'F' && !wildFourAllowed(g, p.hand)) return { error: 'Wild +4 hanya boleh kalau kamu tidak punya kartu warna ' + CNAME[g.color] + '.' }
  }

  p.hand.splice(i, 1)
  p.skips = 0
  const played = chosen ? { c: 'w', v: card.v, wildColor: chosen } : card
  g.discard.push(played)
  g.top = played
  g.color = chosen || card.c

  let log = `${p.name} memainkan ${label(card)}${chosen ? ` → warna ${CEMO[chosen]} ${CNAME[chosen]}` : ''}`

  if (p.hand.length === 0) return { log, winner: p }

  if (p.hand.length === 1) log += `\n🔔 *UNO!* ${p.name} tinggal 1 kartu!`

  const v = card.v
  if (v === 'S') {
    const victim = g.players[idxFrom(g, 1)]
    log += `\n🚫 ${victim.name} dilewati.`
    advance(g, 2)
  } else if (v === 'R') {
    g.dir *= -1
    if (g.players.length === 2) { log += '\n🔄 Reverse (2 pemain = main lagi).'; advance(g, 2) } else { log += '\n🔄 Arah berbalik.'; advance(g, 1) }
  } else if (v === 'D' || v === 'F') {
    const n = v === 'D' ? 2 : 4
    const victim = g.players[idxFrom(g, 1)]
    victim.hand.push(...draw(g, n))
    log += `\n💥 ${victim.name} ambil ${n} kartu dan dilewati.`
    advance(g, 2)
  } else {
    advance(g, 1)
  }
  return { log }
}

const HELP = `🎴 *UNO*\n\n` +
  `*.uno* — buat lobby (di grup)\n*.unojoin* — gabung\n*.unostart* — mulai (host, min ${MIN_PLAYERS} pemain)\n` +
  `*.unoplay <nomor> [warna]* — mainkan kartu (Wild wajib pilih warna)\n*.unodraw* — ambil kartu\n*.unopass* — lewati giliran setelah ambil kartu\n` +
  `*.unohand* — kirim ulang kartumu ke chat pribadi\n*.unoinfo* — status permainan\n*.unoleave* — keluar\n*.unostop* — hentikan (host/admin/owner)\n\n` +
  `Kartu tanganmu dikirim lewat chat pribadi. Cocokkan warna atau angka/simbol kartu teratas. ` +
  `Wild +4 hanya jika tidak punya warna yang berlaku. Tidak bisa ditumpuk. ` +
  `Batas giliran ${TURN_MS / 1000} detik.`

async function isGroupAdmin(sock, m) {
  try {
    const meta = await sock.groupMetadata(m.chat)
    const n = (id) => String(id || '').split('@')[0].split(':')[0]
    return (meta.participants || []).some((p) => p.admin && [p.id, p.jid, p.lid].some((x) => x && n(x) === n(m.sender)))
  } catch { return false }
}

// ───────────────────────── handler ─────────────────────────
const handler = async (m, { shorekeeper, Reply, command, args, isCreator }) => {
  if (!m.isGroup) return Reply('🎴 UNO hanya bisa dimainkan di grup.')
  const sock = shorekeeper
  const cmd = String(command).toLowerCase()
  const rest = [...args]
  let sub = cmd === 'uno' ? String(rest.shift() || '').toLowerCase() : cmd.replace(/^uno/, '')
  const ALIAS = { buat: 'create', create: 'create', gabung: 'join', join: 'join', mulai: 'start', start: 'start', main: 'play', play: 'play', p: 'play',
    ambil: 'draw', draw: 'draw', d: 'draw', lewat: 'pass', pass: 'pass', hand: 'hand', kartu: 'hand', info: 'info', status: 'info',
    keluar: 'leave', leave: 'leave', stop: 'stop', berhenti: 'stop', help: 'help', menu: 'help', create_: 'create' }
  sub = cmd === 'uno' && !sub ? 'create' : (ALIAS[sub] || (cmd === 'uno' ? 'help' : sub))
  if (cmd === 'unocreate' || cmd === 'unobuat') sub = 'create'

  let g = games.get(m.chat)

  if (sub === 'help') return Reply(HELP)

  if (sub === 'create') {
    if (g) return Reply(g.state === 'lobby' ? `🎴 Sudah ada lobby UNO (${g.players.length} pemain). Ketik *.unojoin* untuk gabung.` : '🎴 Permainan UNO sedang berjalan di grup ini. Ketik *.unoinfo*.')
    g = newGame(m, sock)
    return announceLobby(g, `UNO dibuka oleh ${g.players[0].name}`, `🎴 *UNO dibuka!* oleh ${tag(g.players[0])}\n\nKetik *.unojoin* untuk gabung (${MIN_PLAYERS}-${MAX_PLAYERS} pemain).\nHost mulai dengan *.unostart*.\nBantuan: *.uno help*`, [g.players[0].id])
  }

  if (!g) return Reply('🎴 Belum ada permainan UNO. Buat dengan *.uno*.')

  if (sub === 'join') {
    if (g.state !== 'lobby') return Reply('Permainan sudah dimulai.')
    if (g.players.some((p) => p.id === m.sender)) return Reply('Kamu sudah ikut.')
    if (g.players.length >= MAX_PLAYERS) return Reply(`Pemain penuh (maks ${MAX_PLAYERS}).`)
    g.players.push({ id: m.sender, name: m.pushName || 'Pemain', hand: [], skips: 0 })
    return announceLobby(g, `${m.pushName || 'Pemain'} bergabung`, `✅ ${m.pushName || 'Pemain'} bergabung. Total ${g.players.length} pemain.`)
  }

  if (sub === 'start') {
    if (g.state !== 'lobby') return Reply('Permainan sudah dimulai.')
    if (m.sender !== g.host && !isCreator) return Reply('Hanya host yang bisa memulai.')
    if (g.players.length < MIN_PLAYERS) return Reply(`Minimal ${MIN_PLAYERS} pemain.`)
    startGame(g)
    await announce(g, `UNO dimulai! Tiap pemain dapat ${START_HAND} kartu (dikirim lewat chat pribadi).`)
    for (const p of g.players) await sendHand(g, p)
    armTimer(g)
    return
  }

  if (sub === 'info') {
    if (g.state === 'lobby') return announceLobby(g, 'Status lobby', `🎴 Lobby UNO — ${g.players.length} pemain:\n${g.players.map((p) => '• ' + p.name).join('\n')}`)
    return announce(g)
  }

  if (sub === 'stop') {
    if (m.sender !== g.host && !isCreator && !(await isGroupAdmin(sock, m))) return Reply('Hanya host/admin/owner yang bisa menghentikan.')
    clearTimeout(g.timer)
    g.state = 'done'
    games.delete(m.chat)
    return Reply('🛑 Permainan UNO dihentikan.')
  }

  const pi = g.players.findIndex((p) => p.id === m.sender)
  if (pi < 0) return Reply('Kamu tidak ikut permainan ini.')
  const me = g.players[pi]

  if (sub === 'leave') {
    if (g.state === 'lobby') {
      g.players.splice(pi, 1)
      if (!g.players.length) { clearTimeout(g.timer); games.delete(m.chat); return Reply('Lobby dibubarkan.') }
      if (g.host === m.sender) g.host = g.players[0].id
      return say(g, `🚪 ${me.name} keluar. Total ${g.players.length} pemain.`)
    }
    removePlayer(g, pi)
    if (g.players.length < MIN_PLAYERS) return finishAlone(g)
    await announce(g, `🚪 ${me.name} keluar dari permainan.`)
    armTimer(g)
    return sendHand(g, cur(g))
  }

  if (g.state !== 'playing') return Reply('Permainan belum dimulai.')

  if (sub === 'hand') return sendHand(g, me)

  if (cur(g).id !== me.id) return Reply(`Bukan giliranmu. Sekarang giliran ${cur(g).name}.`)

  if (sub === 'draw') {
    if (g.drawn) return Reply('Kamu sudah ambil kartu. Mainkan kartunya atau ketik *.unopass*.')
    const got = draw(g, 1)
    if (!got.length) { advance(g, 1); await announce(g, 'Deck habis, giliran dilewati.'); armTimer(g); return sendHand(g, cur(g)) }
    me.hand.push(...got)
    me.skips = 0
    g.drawn = true
    const playable = canPlay(g, got[0]) && (got[0].v !== 'F' || wildFourAllowed(g, me.hand.filter((x) => x !== got[0])))
    if (playable) await say(g, `🃏 ${me.name} mengambil 1 kartu.`, [me.id])
    if (!playable) { advance(g, 1); await announce(g, `🃏 ${me.name} mengambil 1 kartu, tidak bisa dimainkan.`); armTimer(g); return sendHand(g, cur(g)) }
    return sendHand(g, me) // boleh langsung dimainkan atau .unopass
  }

  if (sub === 'pass') {
    if (!g.drawn) return Reply('Ambil kartu dulu dengan *.unodraw*.')
    me.skips = 0
    advance(g, 1)
    await announce(g, `⏭️ ${me.name} melewati giliran.`, [me.id])
    armTimer(g)
    return sendHand(g, cur(g))
  }

  if (sub === 'play') {
    const idx = parseInt(rest[0], 10)
    if (!Number.isInteger(idx) || idx < 1) return Reply('Format: *.unoplay <nomor kartu> [warna]*. Lihat nomor di chat pribadi (*.unohand*).')
    if (g.drawn) {
      // setelah ambil kartu hanya kartu yang baru diambil (terakhir) boleh dimainkan
      if (idx !== me.hand.length) return Reply('Setelah ambil kartu, hanya kartu yang baru diambil (nomor terakhir) yang boleh dimainkan, atau *.unopass*.')
    }
    const res = playCard(g, me, idx, rest[1])
    if (res.error) return Reply('❌ ' + res.error)
    if (res.winner) {
      clearTimeout(g.timer)
      g.state = 'done'
      games.delete(m.chat)
      return announceWin(g, me, res.log)
    }
    await announce(g, res.log, [me.id])
    armTimer(g)
    return sendHand(g, cur(g))
  }

  return Reply(HELP)
}

handler.command = [
  'uno', 'unocreate', 'unobuat', 'unojoin', 'unostart', 'unoplay', 'unodraw', 'unopass',
  'unohand', 'unoinfo', 'unoleave', 'unostop'
]
handler.help = ['uno']
handler.tags = ['game']

// dipakai tes
handler._internals = { buildDeck, shuffle, canPlay, wildFourAllowed, draw, playCard, startGame, games, label }

module.exports = handler
