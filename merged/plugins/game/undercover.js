/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * UNDERCOVER (3-12 pemain) di grup, kartu rich HTML. Semua pemain dapat kata lewat chat pribadi.
 * Warga dapat kata A, undercover dapat kata B (mirip). Bergiliran memberi 1 petunjuk, lalu voting.
 * Warga menang jika semua undercover tersingkir; undercover menang jika tersisa <= 2 pemain.
 *
 * Perintah: .undercover  .undercoverjoin  .undercoverstart  .undercoverhint <kata>
 *           .undercovervote <nomor>  .undercoverword  .undercoverstatus  .undercoverstop  .undercoverhelp
 */

'use strict'

const GC = require('../../lib/gamecard.cjs')

const MIN_PLAYERS = 3
const MAX_PLAYERS = 12
const IDLE_MS = 30 * 60 * 1000

const WORDS = [
  ['Kopi', 'Teh'], ['Bakso', 'Mie Ayam'], ['Motor', 'Sepeda'], ['Sepatu', 'Sandal'], ['Pantai', 'Kolam Renang'],
  ['Dokter', 'Perawat'], ['Guru', 'Dosen'], ['Nasi Goreng', 'Mie Goreng'], ['WhatsApp', 'Telegram'], ['Mobil', 'Bus'],
  ['Kucing', 'Harimau'], ['Pisang', 'Mangga'], ['Hujan', 'Embun'], ['Sungai', 'Danau'], ['Gitar', 'Ukulele'],
  ['Pesawat', 'Helikopter'], ['Sekolah', 'Kampus'], ['Susu', 'Yogurt'], ['Es Krim', 'Es Batu'], ['Kursi', 'Sofa'],
  ['Handphone', 'Tablet'], ['Rendang', 'Semur'], ['Batik', 'Songket'], ['Gunung', 'Bukit'], ['Roti', 'Kue'],
  ['Polisi', 'Satpam'], ['Pizza', 'Burger'], ['Sabun', 'Shampoo'], ['Kamera', 'Cermin'], ['Bioskop', 'Teater'],
  ['Ayam', 'Bebek'], ['Jam Tangan', 'Gelang'], ['Laptop', 'Komputer'], ['Payung', 'Jas Hujan'], ['Apel', 'Jeruk']
]

const roleCount = (n) => (n >= 7 ? 2 : 1)

const games = new Map() // chat -> game

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
const tag = (p) => `@${String(p.id).split('@')[0].split(':')[0]}`
const alive = (g) => g.players.filter((p) => p.alive)

// ───────────────────────── tampilan ─────────────────────────
const CSS = String.raw`
.no{flex:none;width:22px;height:22px;border-radius:50%;background:var(--card2);border:1px solid var(--line);font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;color:var(--soft);}
.p.dead{opacity:.45;}
.p.dead .nm{text-decoration:line-through;}
.hn{flex:none;max-width:48%;font-size:12px;font-weight:900;color:#fbbf24;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vt{flex:none;font-size:12px;font-weight:900;color:var(--acc);}
.word{position:relative;z-index:2;text-align:center;margin:8px 0;padding:22px 10px;border-radius:14px;background:radial-gradient(ellipse at center,#312e81 0%,#1e1b4b 75%);border:1px solid #4338ca;}
.word .lb{font-size:11px;color:#c7d2fe;letter-spacing:1.5px;font-weight:800;}
.word .wd{font-size:30px;font-weight:900;margin-top:6px;color:#fff;}
.ph{position:relative;z-index:2;display:flex;gap:6px;margin-bottom:8px;}
.ph .pill{background:var(--card);}
.ph .pill.on{background:var(--acc);color:#1a1200;border-color:var(--acc);}
.role{font-size:10px;font-weight:900;border-radius:20px;padding:2px 7px;margin-left:6px;}
.role.u{background:#ef4444;color:#fff;}.role.w{background:#22c55e;color:#04130a;}
`
const OPT = { title: 'UNDERCOVER', icon: '🕵️', css: CSS }

const phaseBar = (g) => `<div class="ph"><span class="pill${g.phase === 'hint' ? ' on' : ''}">💬 Petunjuk</span><span class="pill${g.phase === 'vote' ? ' on' : ''}">🗳️ Voting</span><span class="pill">Ronde ${g.round}</span></div>`

function playersRows(g, { hints = false, votes = false, reveal = false } = {}) {
  const tally = {}
  if (votes) for (const t of Object.values(g.votes)) tally[t] = (tally[t] || 0) + 1
  return `<div class="pl">${g.players.map((p, i) => {
    const turn = g.phase === 'hint' && g.state === 'playing' && p.alive && i === g.turn
    const h = hints ? g.hints.find((x) => x.id === p.id) : null
    const role = reveal ? `<span class="role ${p.under ? 'u' : 'w'}">${p.under ? 'UNDERCOVER' : 'WARGA'}</span>` : ''
    const right = h ? `<div class="hn">${GC.esc(h.text)}</div>` : reveal ? `<div class="hn">${GC.esc(p.word)}</div>` : votes && tally[i] ? `<div class="vt">${tally[i]} suara</div>` : ''
    return `<div class="p${turn ? ' me' : ''}${p.alive ? '' : ' dead'}"><div class="no">${i + 1}</div><div class="nm">${GC.esc(p.name)}${turn ? '<span class="tg">GILIRAN</span>' : ''}${role}${!p.alive && !reveal ? ' ☠️' : ''}</div>${right}</div>`
  }).join('')}</div>`
}

function lobbyHtml(g, note) {
  const body = `${GC.logHtml(note)}
 <div class="felt"><div class="info"><div class="pill">👥 ${g.players.length} / ${MAX_PLAYERS} pemain</div><div class="pill">Min. ${MIN_PLAYERS} pemain</div><div class="pill">🕵️ ${roleCount(Math.max(g.players.length, MIN_PLAYERS))} undercover</div></div></div>
 <div class="pl">${g.players.map((p, i) => `<div class="p${p.id === g.host ? ' me' : ''}"><div class="no">${i + 1}</div><div class="nm">${GC.esc(p.name)}${p.id === g.host ? '<span class="tg">HOST</span>' : ''}</div></div>`).join('')}</div>
 <div class="hint"><code>.undercoverjoin</code> gabung · <code>.undercoverstart</code> mulai (host)</div>`
  return GC.frame('Lobby terbuka', body, OPT)
}

function roundHtml(g, log) {
  const body = `${phaseBar(g)}${GC.logHtml(log)}${playersRows(g, { hints: true })}
 <div class="hint">${g.phase === 'hint' ? `Giliran <b>${GC.esc(g.players[g.turn].name)}</b> · <code>.undercoverhint &lt;kata&gt;</code>` : 'Pilih yang paling mencurigakan · <code>.undercovervote &lt;nomor&gt;</code>'}</div>`
  return GC.frame(`${alive(g).length} pemain hidup`, body, OPT)
}

function voteHtml(g, log) {
  const voted = Object.keys(g.votes).length
  const body = `${phaseBar(g)}${GC.logHtml(log)}${playersRows(g, { hints: true })}
 <div class="hint">Voting: ${voted}/${alive(g).length} · <code>.undercovervote &lt;nomor&gt;</code></div>`
  return GC.frame('Saatnya voting', body, OPT)
}

function resultHtml(g, log) {
  const body = `${GC.logHtml(log)}${playersRows(g, { votes: true })}`
  return GC.frame(`Hasil voting ronde ${g.round}`, body, OPT)
}

function endHtml(g, winner) {
  const body = `<div class="win"><div class="tr">${winner === 'under' ? '🕵️' : '🎉'}</div><div class="wn">${winner === 'under' ? 'UNDERCOVER MENANG' : 'WARGA MENANG'}</div></div>
 <div class="ph" style="justify-content:center"><span class="pill">Warga: <b>${GC.esc(g.words[0])}</b></span><span class="pill">Undercover: <b>${GC.esc(g.words[1])}</b></span></div>
 ${playersRows(g, { reveal: true })}
 <div class="hint">Main lagi? ketik <code>.undercover</code></div>`
  return GC.frame('Permainan selesai', body, OPT)
}

function wordHtml(p) {
  const body = `<div class="word"><div class="lb">KATA RAHASIAMU</div><div class="wd">${GC.esc(p.word)}</div></div>
 <div class="hint">Jangan beritahu siapa pun!<br><span class="muted">Beri petunjuk di grup saat gilirannya: </span><code>.undercoverhint &lt;kata&gt;</code></div>`
  return GC.frame(`Untuk ${p.name}`, body, OPT)
}

const listText = (g) => g.players.map((p, i) => `${i + 1}. ${p.name}${p.alive ? '' : ' ☠️'}`).join('\n')

// ───────────────────────── kirim ─────────────────────────
async function say(g, text, extra = []) {
  const mentions = [...new Set([...g.players.map((p) => p.id), ...extra])]
  try { await g.sock.sendMessage(g.chat, { text, mentions }) } catch (e) { console.error('[UNDERCOVER] gagal kirim:', e.message) }
}

// kirim kartu ke grup, cadangan teks bila gagal
async function card(g, html, title, fallback, extra = []) {
  const ok = await GC.sendCard(g.sock, g.chat, html, title)
  if (!ok) await say(g, fallback, extra)
  return ok
}

function touch(g) {
  clearTimeout(g.idle)
  g.idle = setTimeout(() => {
    if (games.get(g.chat) === g) {
      games.delete(g.chat)
      g.sock.sendMessage(g.chat, { text: '⌛ Undercover dihentikan karena lama tidak ada aktivitas.' }).catch(() => {})
    }
  }, IDLE_MS)
  if (g.idle.unref) g.idle.unref()
}

function finish(g) { clearTimeout(g.idle); g.state = 'done'; games.delete(g.chat) }

const HELP = `🕵️ *UNDERCOVER*\n\n*.undercover* — buat permainan (${MIN_PLAYERS}-${MAX_PLAYERS} pemain)\n*.undercoverjoin* — bergabung\n*.undercoverstart* — mulai (host)\n*.undercoverhint <kata>* — beri petunjuk saat gilirannya (maks 3 kata)\n*.undercovervote <nomor>* — voting\n*.undercoverword* — kirim ulang katamu lewat chat pribadi\n*.undercoverstatus* — status & petunjuk\n*.undercoverstop* — hentikan (host/admin/owner)\n\nSemua dapat kata lewat chat pribadi. Mayoritas dapat kata yang sama, tapi ada 1-2 *undercover* dengan kata yang MIRIP. Beri petunjuk tanpa menyebut katamu langsung, lalu vote siapa yang paling mencurigakan. Jangan sampai ketahuan kalau kamu undercover!`

async function isGroupAdmin(sock, m) {
  try {
    const meta = await sock.groupMetadata(m.chat)
    const n = (id) => String(id || '').split('@')[0].split(':')[0]
    return (meta.participants || []).some((p) => p.admin && [p.id, p.jid, p.lid].some((x) => x && n(x) === n(m.sender)))
  } catch { return false }
}

// ───────────────────────── alur ─────────────────────────
const nextSpeaker = (g) => {
  for (let i = g.turn; i < g.players.length; i++) if (g.players[i].alive) { g.turn = i; return i }
  return -1
}

async function startRound(g, note) {
  g.phase = 'hint'; g.turn = 0; g.hints = []; g.votes = {}
  const i = nextSpeaker(g)
  const p = g.players[i]
  await card(g, roundHtml(g, note || `Ronde ${g.round} dimulai`), 'Undercover · Ronde',
    `${note ? note + '\n\n' : ''}🔁 *Ronde ${g.round}* — pemain hidup:\n${listText(g)}\n\nGiliran memberi petunjuk: ${tag(p)} → *.undercoverhint <kata>*`, [p.id])
  await say(g, `👉 Giliran petunjuk ${tag(p)}`, [p.id])
}

async function endGame(g, winner) {
  finish(g)
  const [a, b] = g.words
  await card(g, endHtml(g, winner), 'Undercover · Selesai',
    `🏁 *Undercover selesai!* ${winner === 'under' ? '🕵️ UNDERCOVER menang!' : '🎉 WARGA menang!'}\nKata warga: *${a}* • kata undercover: *${b}*\n\n${g.players.map((p) => `${p.under ? '🕵️' : '👤'} ${p.name} (${p.word})${p.alive ? '' : ' ☠️'}`).join('\n')}`)
}

async function resolveVote(g) {
  const c = {}
  for (const t of Object.values(g.votes)) c[t] = (c[t] || 0) + 1
  const top = Math.max(0, ...Object.values(c))
  const lead = Object.entries(c).filter(([, n]) => n === top).map(([t]) => +t)
  const tally = Object.entries(c).map(([t, n]) => `${g.players[t].name}: ${n}`).join('\n')
  if (lead.length !== 1) {
    await card(g, resultHtml(g, 'Hasil voting: SERI! Tidak ada yang tersingkir.'), 'Undercover · Hasil', `⚖️ *Hasil voting*\n${tally}\n\nSeri! Tidak ada yang tersingkir.`)
    g.round++
    return startRound(g)
  }
  const out = g.players[lead[0]]
  out.alive = false
  const msg = `${out.name} tersingkir — dia ${out.under ? 'UNDERCOVER 🕵️' : 'warga 👤'} (kata: ${out.word}).`
  await card(g, resultHtml(g, msg), 'Undercover · Hasil', `⚖️ *Hasil voting*\n${tally}\n\n${msg}`)
  if (!g.players.some((p) => p.alive && p.under)) return endGame(g, 'civil')
  if (alive(g).length <= 2) return endGame(g, 'under')
  g.round++
  return startRound(g)
}

async function dmWord(g, p) {
  try {
    if (await GC.sendCard(g.sock, p.id, wordHtml(p), 'Undercover · Katamu')) return true
    await g.sock.sendMessage(p.id, { text: `🕵️ *Undercover* — katamu: *${p.word}*\nJangan beritahu siapa pun! Beri petunjuk di grup saat gilirannya.` })
    return true
  } catch { return false }
}

// ───────────────────────── handler ─────────────────────────
const handler = async (m, { shorekeeper, Reply, command, args, isCreator }) => {
  const sock = shorekeeper
  const cmd = String(command).toLowerCase()
  const sub = cmd === 'undercover' ? 'create' : cmd.replace(/^undercover/, '')
  const name = m.pushName || 'Pemain'

  // katamu: boleh dari chat pribadi
  if (sub === 'word') {
    const entry = [...games.values()].find((gg) => gg.state === 'playing' && gg.players.some((p) => p.id === m.sender))
    if (!entry) return Reply('Kamu tidak sedang ikut permainan Undercover.')
    const me = entry.players.find((p) => p.id === m.sender)
    if (!m.isGroup) {
      if (await GC.sendCard(sock, m.chat, wordHtml(me), 'Undercover · Katamu')) return
    }
    return Reply(`🕵️ Katamu: *${me.word}*`)
  }

  if (!m.isGroup) return Reply('🕵️ Undercover hanya bisa dimainkan di grup (kecuali *.undercoverword* di chat pribadi).')
  if (sub === 'help' || sub === 'menu') return Reply(HELP)

  let g = games.get(m.chat)

  if (sub === 'create') {
    if (g) return Reply(g.state === 'lobby' ? `🕵️ Sudah ada lobby (${g.players.length} pemain). Ketik *.undercoverjoin*.` : '🕵️ Permainan sedang berjalan. Ketik *.undercoverstatus*.')
    g = { chat: m.chat, sock, host: m.sender, state: 'lobby', phase: 'lobby', players: [{ id: m.sender, name, alive: true, word: '', under: false }], round: 1, turn: 0, hints: [], votes: {}, words: [], idle: null }
    games.set(m.chat, g)
    touch(g)
    return card(g, lobbyHtml(g, `${name} membuat Undercover`), 'Undercover · Lobby',
      `🕵️ *Undercover* dibuat oleh ${tag(g.players[0])}\nKetik *.undercoverjoin* (min ${MIN_PLAYERS}, maks ${MAX_PLAYERS}), lalu host *.undercoverstart*.`, [m.sender])
  }

  if (!g) return Reply('🕵️ Belum ada permainan. Buat dengan *.undercover*.')
  touch(g)
  const idx = g.players.findIndex((p) => p.id === m.sender)

  if (sub === 'join') {
    if (g.state !== 'lobby') return Reply('Permainan sudah berjalan.')
    if (idx >= 0) return Reply('Kamu sudah bergabung.')
    if (g.players.length >= MAX_PLAYERS) return Reply('Pemain penuh.')
    g.players.push({ id: m.sender, name, alive: true, word: '', under: false })
    return card(g, lobbyHtml(g, `${name} bergabung`), 'Undercover · Lobby', `✅ ${name} bergabung (${g.players.length} pemain)`)
  }

  if (sub === 'stop') {
    if (m.sender !== g.host && !isCreator && !(await isGroupAdmin(sock, m))) return Reply('Hanya host/admin/owner yang bisa menghentikan.')
    finish(g)
    return Reply('🛑 Undercover dihentikan.')
  }

  if (sub === 'status') {
    if (g.state === 'lobby') return card(g, lobbyHtml(g, 'Status lobby'), 'Undercover · Lobby', `Pemain (${g.players.length}):\n${listText(g)}`)
    return card(g, g.phase === 'vote' ? voteHtml(g) : roundHtml(g), 'Undercover · Status',
      `Ronde ${g.round} • fase ${g.phase === 'hint' ? 'petunjuk' : 'voting'}\n${listText(g)}\n\nPetunjuk:\n${g.hints.map((h) => `• ${g.players.find((p) => p.id === h.id).name}: ${h.text}`).join('\n') || '(belum ada)'}`)
  }

  if (sub === 'start') {
    if (g.state !== 'lobby') return Reply('Sudah dimulai.')
    if (m.sender !== g.host && !isCreator) return Reply('Hanya host yang bisa memulai.')
    if (g.players.length < MIN_PLAYERS) return Reply(`Minimal ${MIN_PLAYERS} pemain.`)
    const [civ, und] = shuffle([...WORDS[Math.floor(Math.random() * WORDS.length)]])
    g.words = [civ, und]
    const unders = new Set(shuffle(g.players.map((_, i) => i)).slice(0, roleCount(g.players.length)))
    g.players.forEach((p, i) => { p.under = unders.has(i); p.word = p.under ? und : civ; p.alive = true })
    g.state = 'playing'
    const failed = []
    for (const p of g.players) if (!(await dmWord(g, p))) failed.push(p)
    await say(g, `🕵️ *Undercover dimulai!* ${g.players.length} pemain, ${unders.size} undercover.\nKata sudah dikirim lewat chat pribadi.${failed.length ? `\n⚠️ Gagal DM: ${failed.map(tag).join(', ')} — chat bot lalu ketik *.undercoverword* di chat pribadi.` : ''}`, failed.map((p) => p.id))
    return startRound(g)
  }

  if (g.state !== 'playing') return Reply('Permainan belum dimulai.')

  if (sub === 'hint') {
    if (g.phase !== 'hint') return Reply('Sekarang bukan fase petunjuk.')
    const i = nextSpeaker(g)
    if (idx !== i) return Reply(`Sekarang giliran ${g.players[i].name}.`)
    const text = args.join(' ').trim()
    if (!text || args.length > 3) return Reply('Beri petunjuk 1-3 kata.')
    if (text.toLowerCase() === g.players[idx].word.toLowerCase()) return Reply('Jangan sebut katamu langsung!')
    g.hints.push({ id: m.sender, text })
    g.turn = i + 1
    const nx = nextSpeaker(g)
    if (nx === -1) {
      g.phase = 'vote'
      return card(g, voteHtml(g, `Semua petunjuk ronde ${g.round} sudah masuk.`), 'Undercover · Voting',
        `💬 Petunjuk ronde ${g.round}:\n${g.hints.map((h) => `• ${g.players.find((p) => p.id === h.id).name}: *${h.text}*`).join('\n')}\n\n🗳️ Saatnya voting! *.undercovervote <nomor>*\n${listText(g)}`)
    }
    const p = g.players[nx]
    return card(g, roundHtml(g, `${name}: ${text}`), 'Undercover · Petunjuk',
      `✅ ${name}: *${text}*\nGiliran ${tag(p)} → *.undercoverhint <kata>*`, [p.id]).then(() => say(g, `👉 Giliran petunjuk ${tag(p)}`, [p.id]))
  }

  if (sub === 'vote') {
    if (g.phase !== 'vote') return Reply('Sekarang bukan fase voting.')
    if (idx < 0 || !g.players[idx].alive) return Reply('Kamu tidak bisa voting.')
    const n = parseInt(args[0], 10) - 1
    if (!(n >= 0 && n < g.players.length) || !g.players[n].alive) return Reply(`Nomor tidak valid:\n${listText(g)}`)
    if (n === idx) return Reply('Tidak bisa memilih dirimu sendiri.')
    g.votes[idx] = n
    const count = Object.keys(g.votes).length
    if (count >= alive(g).length) return resolveVote(g)
    return say(g, `🗳️ ${name} sudah memilih (${count}/${alive(g).length})`)
  }

  return Reply(HELP)
}

handler.command = ['undercover', 'undercoverjoin', 'undercoverstart', 'undercoverhint', 'undercovervote', 'undercoverword', 'undercoverstatus', 'undercoverstop', 'undercoverhelp']
handler.help = ['undercover']
handler.tags = ['game']

// dipakai tes
handler._internals = { games, WORDS, roleCount }

module.exports = handler
