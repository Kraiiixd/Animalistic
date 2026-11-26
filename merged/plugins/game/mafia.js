/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * MAFIA (4-20 pemain) di grup: fase malam & siang. Peran: Mafia, Dokter, Detektif, Warga.
 * Peran & aksi malam lewat chat pribadi bot. Tampilan: kartu rich HTML (fallback teks).
 *
 * Perintah: .mafia (buat) · .mafiajoin · .mafiastart · .mafiarole (DM) · .mafiaaksi <nomor> (DM)
 *           .mafiavote <nomor> · .mafiastatus · .mafiaskip · .mafiastop · .mafiahelp
 * (penulisan dengan tanda hubung, mis. .mafia-join, juga dikenali)
 */

'use strict'

const GC = require('../../lib/gamecard.cjs')
const { esc } = GC

const NIGHT_MS = 90 * 1000
const DAY_MS = 150 * 1000
const MIN_PLAYERS = 4
const MAX_PLAYERS = 20

const games = new Map()   // chat -> game
const timers = new Map()  // chat -> timeout

const ROLE = {
  mafia: { icon: '🔪', name: 'Mafia', desc: 'Tiap malam pilih 1 korban bersama sesama mafia. Menang jika jumlah mafia ≥ jumlah warga hidup.', act: 'Pilih korban' },
  dokter: { icon: '💉', name: 'Dokter', desc: 'Tiap malam lindungi 1 pemain (boleh dirimu) dari serangan mafia.', act: 'Pilih yang dilindungi' },
  detektif: { icon: '🕵️', name: 'Detektif', desc: 'Tiap malam selidiki 1 pemain, kamu akan tahu dia mafia atau bukan.', act: 'Pilih yang diselidiki' },
  warga: { icon: '👤', name: 'Warga', desc: 'Tidak punya kemampuan malam. Cari mafia lewat diskusi & voting siang.' }
}

// ───────────────────────── util ─────────────────────────
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const pickRandom = (a) => a[Math.floor(Math.random() * a.length)]
const num = (v, d = NaN) => { const n = parseInt(String(v ?? '').replace(/[^0-9-]/g, ''), 10); return Number.isFinite(n) ? n : d }
const tag = (p) => `@${String(p.id).split('@')[0].split(':')[0]}`

const assignRoles = (n) => {
  const mafia = Math.max(1, Math.floor(n / 3))
  const roles = Array(mafia).fill('mafia')
  if (n >= 4) roles.push('dokter')
  if (n >= 5) roles.push('detektif')
  while (roles.length < n) roles.push('warga')
  return shuffle(roles)
}

const alive = (g) => g.players.filter((p) => p.alive)

function checkWin(g) {
  const a = alive(g)
  const mf = a.filter((p) => p.role === 'mafia').length
  if (!mf) return 'warga'
  if (mf >= a.length - mf) return 'mafia'
  return null
}

function resolveNight(g) {
  const votes = {}
  for (const t of Object.values(g.night.mafia)) votes[t] = (votes[t] || 0) + 1
  let victim = null
  const top = Math.max(0, ...Object.values(votes))
  if (top) victim = +pickRandom(Object.entries(votes).filter(([, c]) => c === top).map(([t]) => t))
  const saved = g.night.dokter != null && g.night.dokter === victim
  return { victim: victim != null && !saved ? victim : null, saved: victim != null && saved ? victim : null }
}

function tally(g) {
  const c = {}
  for (const t of Object.values(g.votes)) c[t] = (c[t] || 0) + 1
  const top = Math.max(0, ...Object.values(c))
  const lead = Object.entries(c).filter(([, n]) => n === top).map(([t]) => +t)
  return { c, top, lead }
}

const nightDone = (g) => alive(g).every((p) => {
  const i = g.players.indexOf(p)
  if (p.role === 'mafia') return g.night.mafia[i] != null
  if (p.role === 'dokter') return g.night.dokter != null
  if (p.role === 'detektif') return g.night.detektif != null
  return true
})

const listText = (g, onlyAlive = true) => g.players
  .map((p, i) => ({ p, n: i + 1 })).filter((x) => !onlyAlive || x.p.alive)
  .map((x) => `${x.n}. ${tag(x.p)}${x.p.alive ? '' : ' ☠️'}`).join('\n')

// ───────────────────────── tampilan ─────────────────────────
const CSS = String.raw`
.mf-moon{text-align:center;font-size:46px;line-height:1;margin:2px 0 8px;position:relative;z-index:2;}
.mf-phase{text-align:center;position:relative;z-index:2;margin-bottom:6px;}
.mf-phase b{font-size:15px;letter-spacing:1px;}
.p .no{flex:none;width:22px;height:22px;border-radius:7px;background:#2b303b;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;}
.p.dead{opacity:.45;}
.p.dead .nm{text-decoration:line-through;}
.p .rl{flex:none;font-size:11px;font-weight:800;color:var(--soft);}
.p .vt{flex:none;font-size:11px;font-weight:900;color:#1a1200;background:var(--acc);border-radius:20px;padding:2px 8px;}
.ev{position:relative;z-index:2;margin:6px 0 10px;padding:12px;border-radius:12px;background:#201a2a;border:1px solid #3b2f4f;font-size:13px;font-weight:700;line-height:1.4;text-align:center;}
.ev.good{background:#10281a;border-color:#1f6b3b;}
.ev.bad{background:#2a1414;border-color:#6b1f1f;}
`
const FR = (sub, body, icon = '🔪') => GC.frame(sub, body, { title: 'MAFIA', icon, css: CSS })

function rows(g, { votes, reveal } = {}) {
  const t = votes ? tally(g).c : {}
  return `<div class="pl">${g.players.map((p, i) => {
    const vt = t[i] ? `<span class="vt">${t[i]} suara</span>` : ''
    const rl = reveal ? `<span class="rl">${ROLE[p.role].icon} ${ROLE[p.role].name}</span>` : ''
    return `<div class="p${p.alive ? '' : ' dead'}"><div class="no">${i + 1}</div><div class="nm">${esc(p.name)}${p.alive ? '' : ' ☠️'}</div>${rl}${vt}</div>`
  }).join('')}</div>`
}

const lobbyCard = (g, note) => FR('Lobby terbuka', `${note ? `<div class="ev">${esc(note)}</div>` : ''}
 <div class="mf-phase"><b>👥 ${g.players.length} / ${MAX_PLAYERS} pemain</b> <span class="muted">· min. ${MIN_PLAYERS}</span></div>
 ${rows(g)}
 <div class="hint"><code>.mafiajoin</code> gabung · <code>.mafiastart</code> mulai (host)</div>`)

const nightCard = (g) => FR(`Malam ke-${g.day}`, `<div class="mf-moon">🌙</div>
 <div class="mf-phase"><b>Kota tertidur</b><div class="muted" style="margin-top:3px">Mafia, dokter & detektif: aksi lewat chat pribadi bot · ${Math.round(NIGHT_MS / 1000)} detik</div></div>
 ${rows(g)}
 <div class="hint"><code>.mafiaaksi &lt;nomor&gt;</code> <span class="muted">(chat pribadi)</span></div>`, '🌙')

const morningCard = (g, text, kind) => FR(`Pagi hari ke-${g.day}`, `<div class="mf-moon">☀️</div>
 <div class="ev ${kind || ''}">${esc(text)}</div>
 ${rows(g)}`, '☀️')

const dayCard = (g) => FR(`Siang hari ke-${g.day} · Voting`, `<div class="mf-phase"><b>🗣️ Diskusi & voting</b><div class="muted" style="margin-top:3px">${Math.round(DAY_MS / 1000)} detik</div></div>
 ${rows(g, { votes: true })}
 <div class="hint"><code>.mafiavote &lt;nomor&gt;</code></div>`, '🗳️')

const voteResultCard = (g, text) => FR(`Hasil voting hari ke-${g.day}`, `<div class="ev">${esc(text).replace(/\n/g, '<br>')}</div>${rows(g, { votes: true })}`, '⚖️')

const endCard = (g, winner) => FR('Permainan selesai', `<div class="win"><div class="tr">${winner === 'mafia' ? '🔪' : '🎉'}</div><div class="wn">${winner === 'mafia' ? 'MAFIA menguasai kota!' : 'WARGA menumpas mafia!'}</div></div>
 ${rows(g, { reveal: true })}
 <div class="hint">Main lagi? ketik <code>.mafia</code></div>`, '🏁')

const roleCard = (g, p) => {
  const r = ROLE[p.role]
  const mates = p.role === 'mafia' ? g.players.filter((x) => x.role === 'mafia' && x !== p).map((x) => x.name) : []
  return FR('Peran rahasiamu', `<div class="mf-moon">${r.icon}</div>
 <div class="mf-phase"><b>${esc(r.name)}</b></div>
 <div class="ev">${esc(r.desc)}${mates.length ? `<br><br>Teman mafia: ${esc(mates.join(', '))}` : ''}</div>
 <div class="hint muted">Jangan tunjukkan kartu ini ke siapa pun 🤫</div>`, r.icon)
}

// kirim kartu; bila gagal kirim teks cadangan
async function emit(env, jid, html, title, fallback, mentions = []) {
  if (await GC.sendCard(env.sock, jid, html, title)) return true
  try { await env.sock.sendMessage(jid, { text: fallback, mentions }); return true } catch (e) { console.error('[MAFIA] gagal kirim:', e.message); return false }
}
const groupSay = (env, g, html, title, fallback) => emit(env, env.chat, html, title, fallback, g.players.map((p) => p.id))
const plain = (env, text, mentions = []) => env.sock.sendMessage(env.chat, { text, mentions }).catch(() => {})

// ───────────────────────── mesin (dipanggil juga oleh timer) ─────────────────────────
const clearTimer = (chat) => { const t = timers.get(chat); if (t) clearTimeout(t); timers.delete(chat) }
const arm = (env, ms, fn) => {
  clearTimer(env.chat)
  const t = setTimeout(() => fn().catch((e) => console.error('[MAFIA] timer error:', e)), ms)
  if (t.unref) t.unref()
  timers.set(env.chat, t)
}

async function endGame(env, g, winner) {
  clearTimer(env.chat)
  games.delete(env.chat)
  const roles = g.players.map((p) => `${ROLE[p.role].icon} ${tag(p)} — ${ROLE[p.role].name}${p.alive ? '' : ' ☠️'}`).join('\n')
  return groupSay(env, g, endCard(g, winner), 'Mafia · Selesai',
    `🏁 *Mafia selesai!* ${winner === 'mafia' ? '🔪 MAFIA menguasai kota!' : '🎉 WARGA berhasil menumpas mafia!'}\n\n${roles}`)
}

async function startNight(env, g) {
  g.phase = 'night'; g.night = { mafia: {}, dokter: null, detektif: null }; g.votes = {}
  await groupSay(env, g, nightCard(g), 'Mafia · Malam',
    `🌙 *Malam ke-${g.day}* — kota tertidur.\nPemain hidup:\n${listText(g)}\n\nMafia, dokter & detektif: kirim aksi lewat chat pribadi bot → *.mafiaaksi <nomor>* (${Math.round(NIGHT_MS / 1000)} detik).`)
  for (const p of alive(g)) {
    if (!['mafia', 'dokter', 'detektif'].includes(p.role)) continue
    await env.sock.sendMessage(p.id, { text: `🌙 Malam ke-${g.day} — ${ROLE[p.role].act}:\n${listText(g)}\n\nBalas dengan: *.mafiaaksi <nomor>*`, mentions: g.players.map((x) => x.id) }).catch(() => {})
  }
  arm(env, NIGHT_MS, () => nightEnd(env))
}

async function nightEnd(env) {
  const g = games.get(env.chat)
  if (!g || g.phase !== 'night') return
  clearTimer(env.chat)
  const r = resolveNight(g)
  let text, kind = ''
  if (r.victim != null) {
    const v = g.players[r.victim]; v.alive = false
    text = `💀 ${v.name} ditemukan tewas diserang mafia. Dia seorang ${ROLE[v.role].name}.`; kind = 'bad'
  } else if (r.saved != null) { text = '✨ Seseorang diserang mafia tapi diselamatkan dokter! Tidak ada korban.'; kind = 'good' }
  else text = 'Malam yang tenang, tidak ada korban.'
  await groupSay(env, g, morningCard(g, text, kind), 'Mafia · Pagi', `☀️ *Pagi hari ke-${g.day}*\n${text}`)
  const w = checkWin(g)
  if (w) return endGame(env, g, w)
  g.phase = 'day'; g.votes = {}
  await groupSay(env, g, dayCard(g), 'Mafia · Voting',
    `🗣️ Diskusikan siapa mafianya, lalu voting di grup: *.mafiavote <nomor>* (${Math.round(DAY_MS / 1000)} detik)\n\n${listText(g)}`)
  arm(env, DAY_MS, () => dayEnd(env))
}

async function dayEnd(env) {
  const g = games.get(env.chat)
  if (!g || g.phase !== 'day') return
  clearTimer(env.chat)
  const { c, lead } = tally(g)
  let text = Object.keys(c).length
    ? Object.entries(c).map(([t, n]) => `${g.players[t].name}: ${n} suara`).join('\n')
    : 'Tidak ada yang memilih.'
  text += '\n\n'
  const voted = Object.keys(c).length
  if (lead.length === 1 && voted) {
    const v = g.players[lead[0]]; v.alive = false
    text += `🪢 ${v.name} digantung warga! Dia seorang ${ROLE[v.role].name}.`
  } else text += 'Suara seri / tidak ada — tidak ada yang digantung.'
  await groupSay(env, g, voteResultCard(g, text), 'Mafia · Hasil voting', `⚖️ *Hasil voting*\n${text}`)
  const w = checkWin(g)
  if (w) return endGame(env, g, w)
  g.day++
  return startNight(env, g)
}

// ───────────────────────── handler ─────────────────────────
async function isGroupAdmin(sock, m) {
  try {
    const meta = await sock.groupMetadata(m.chat)
    const n = (id) => String(id || '').split('@')[0].split(':')[0]
    return (meta.participants || []).some((p) => p.admin && [p.id, p.jid, p.lid].some((x) => x && n(x) === n(m.sender)))
  } catch { return false }
}

const HELP = `🔪 *MAFIA*\n\n` +
  `*.mafia* — buat permainan (${MIN_PLAYERS}-${MAX_PLAYERS} pemain)\n*.mafiajoin* — bergabung\n*.mafiastart* — mulai & bagi peran (host)\n` +
  `*.mafiarole* — (chat pribadi) ingat perananmu\n*.mafiaaksi <nomor>* — (chat pribadi) aksi malam\n*.mafiavote <nomor>* — voting siang di grup\n` +
  `*.mafiastatus* — daftar pemain\n*.mafiaskip* — lompati fase (host/admin)\n*.mafiastop* — hentikan\n\n` +
  `Peran: 🔪 Mafia (1/3 pemain), 💉 Dokter (≥4), 🕵️ Detektif (≥5), 👤 Warga. Pastikan semua sudah chat bot dulu supaya peran bisa dikirim lewat DM.`

const ALIAS = { buat: 'create', create: 'create', join: 'join', gabung: 'join', start: 'start', mulai: 'start', aksi: 'aksi', role: 'role', peran: 'role',
  vote: 'vote', status: 'status', skip: 'skip', stop: 'stop', help: 'help', menu: 'help' }

const handler = async (m, { shorekeeper, Reply, command, args, isCreator }) => {
  const sock = shorekeeper
  const cmd = String(command).toLowerCase().replace(/-/g, '')
  const raw = cmd === 'mafia' ? String(args[0] || '').toLowerCase() : cmd.replace(/^mafia/, '')
  const rest = cmd === 'mafia' ? args.slice(1) : [...args]
  let sub = cmd === 'mafia' && !raw ? 'create' : (ALIAS[raw] || 'help')
  const sender = m.sender

  // ── aksi / role: dari chat pribadi ──
  if (sub === 'aksi' || sub === 'role') {
    let chat = null, g = null
    for (const [c, gg] of games) if (gg.started && gg.players.some((p) => p.id === sender)) { chat = c; g = gg; break }
    if (!g) return Reply('Kamu tidak sedang ikut permainan Mafia yang berjalan.')
    const idx = g.players.findIndex((p) => p.id === sender)
    const me = g.players[idx]
    const env = { sock, chat }
    if (sub === 'role') {
      const ok = await emit(env, m.chat, roleCard(g, me), 'Mafia · Peranmu', `${ROLE[me.role].icon} Kamu *${ROLE[me.role].name}*.\n${ROLE[me.role].desc}${me.role === 'mafia' ? `\nTeman mafia: ${g.players.filter((p) => p.role === 'mafia' && p !== me).map(tag).join(', ') || '(tidak ada)'}` : ''}`, g.players.map((p) => p.id))
      return ok
    }
    if (m.isGroup) return Reply('Kirim aksi malam lewat chat *pribadi* bot supaya rahasia.')
    if (g.phase !== 'night') return Reply('Sekarang bukan malam hari.')
    if (!me.alive) return Reply('Kamu sudah tewas ☠️')
    if (!['mafia', 'dokter', 'detektif'].includes(me.role)) return Reply('Warga tidak punya aksi malam. Tidur saja 😴')
    const n = num(rest[0]) - 1
    if (!(n >= 0 && n < g.players.length) || !g.players[n].alive) return Reply(`Nomor tidak valid. Pilih:\n${listText(g)}`)
    if (me.role === 'mafia' && g.players[n].role === 'mafia') return Reply('Tidak boleh membunuh sesama mafia.')
    if (me.role === 'mafia') g.night.mafia[idx] = n
    else if (me.role === 'dokter') g.night.dokter = n
    else {
      g.night.detektif = n
      await Reply(`🕵️ ${tag(g.players[n])} adalah ${g.players[n].role === 'mafia' ? '*MAFIA* 🔪' : '*bukan mafia* ✅'}`)
    }
    if (me.role !== 'detektif') await Reply(`✅ Pilihanmu tercatat: ${tag(g.players[n])}`)
    if (nightDone(g)) return nightEnd(env)
    return null
  }

  if (!m.isGroup) return Reply('🔪 Mafia hanya bisa dimainkan di grup (kecuali .mafiaaksi & .mafiarole).')
  const chat = m.chat
  const env = { sock, chat }
  let g = games.get(chat)
  const isHost = async () => g && (sender === g.host || isCreator || await isGroupAdmin(sock, m))

  if (sub === 'help') return Reply(HELP)

  if (sub === 'create') {
    if (g) return Reply('Sudah ada permainan Mafia. Ketik *.mafiajoin*.')
    g = { host: sender, chat, players: [{ id: sender, name: m.pushName || 'Pemain', role: null, alive: true }], started: false, phase: 'lobby', day: 1, night: null, votes: {} }
    games.set(chat, g)
    return emit(env, chat, lobbyCard(g, `Mafia dibuat oleh ${g.players[0].name}`),
      'Mafia · Lobby', `🔪 *Mafia* dibuat oleh ${tag(g.players[0])}\nKetik *.mafiajoin* (min ${MIN_PLAYERS}, maks ${MAX_PLAYERS}), lalu host ketik *.mafiastart*.`, [sender])
  }
  if (!g) return Reply('Belum ada permainan. Ketik *.mafia* untuk membuat.')
  const idx = g.players.findIndex((p) => p.id === sender)

  if (sub === 'join') {
    if (g.started) return Reply('Permainan sudah berjalan.')
    if (idx >= 0) return Reply('Kamu sudah bergabung.')
    if (g.players.length >= MAX_PLAYERS) return Reply(`Pemain penuh (${MAX_PLAYERS}).`)
    const name = m.pushName || 'Pemain'
    g.players.push({ id: sender, name, role: null, alive: true })
    return emit(env, chat, lobbyCard(g, `${name} bergabung`), 'Mafia · Lobby', `✅ ${tag(g.players[g.players.length - 1])} bergabung (${g.players.length} pemain)`, [sender])
  }

  if (sub === 'start') {
    if (g.started) return Reply('Sudah dimulai.')
    if (!(await isHost())) return Reply('Hanya host/admin yang bisa memulai.')
    if (g.players.length < MIN_PLAYERS) return Reply(`Minimal ${MIN_PLAYERS} pemain.`)
    const roles = assignRoles(g.players.length)
    g.players.forEach((p, i) => { p.role = roles[i]; p.alive = true })
    g.started = true; g.day = 1
    const failed = []
    for (const p of g.players) {
      const mates = p.role === 'mafia' ? `\nTeman mafia: ${g.players.filter((x) => x.role === 'mafia' && x !== p).map(tag).join(', ') || '(tidak ada)'}` : ''
      const ok = await emit({ sock, chat }, p.id, roleCard(g, p), 'Mafia · Peranmu',
        `${ROLE[p.role].icon} *Mafia* — kamu adalah *${ROLE[p.role].name}*.\n${ROLE[p.role].desc}${mates}`, g.players.map((x) => x.id))
      if (!ok) failed.push(p)
    }
    await plain(env, `🔪 *Mafia dimulai!* ${g.players.length} pemain • ${g.players.filter((p) => p.role === 'mafia').length} mafia.\nPeran sudah dikirim lewat chat pribadi.${failed.length ? `\n⚠️ Gagal DM: ${failed.map(tag).join(', ')} — chat bot lalu ketik *.mafiarole* di chat pribadi.` : ''}`, g.players.map((p) => p.id))
    return startNight(env, g)
  }

  if (sub === 'status') {
    if (!g.started) return emit(env, chat, lobbyCard(g), 'Mafia · Lobby', `Pemain (${g.players.length}):\n${listText(g, false)}`, g.players.map((p) => p.id))
    const html = g.phase === 'night' ? nightCard(g) : dayCard(g)
    return emit(env, chat, html, 'Mafia · Status', `Fase: ${g.phase === 'night' ? '🌙 Malam' : '☀️ Siang'} ke-${g.day}\n${listText(g, false)}`, g.players.map((p) => p.id))
  }

  if (sub === 'vote') {
    if (!g.started || g.phase !== 'day') return Reply('Voting hanya saat siang hari.')
    if (idx < 0 || !g.players[idx].alive) return Reply('Kamu tidak bisa voting.')
    const n = num(rest[0]) - 1
    if (!(n >= 0 && n < g.players.length) || !g.players[n].alive) return Reply(`Nomor tidak valid:\n${listText(g)}`)
    if (n === idx) return Reply('Tidak bisa memilih dirimu sendiri.')
    g.votes[idx] = n
    const count = Object.keys(g.votes).length
    await plain(env, `🗳️ ${tag(g.players[idx])} memilih ${tag(g.players[n])} (${count}/${alive(g).length} suara masuk)`, [sender, g.players[n].id])
    const { top } = tally(g)
    if (count >= alive(g).length || top > alive(g).length / 2) return dayEnd(env)
    return null
  }

  if (sub === 'skip') {
    if (!(await isHost())) return Reply('Hanya host/admin.')
    if (!g.started) return Reply('Belum dimulai.')
    return g.phase === 'night' ? nightEnd(env) : dayEnd(env)
  }

  if (sub === 'stop') {
    if (!(await isHost())) return Reply('Hanya host/admin yang bisa menghentikan.')
    clearTimer(chat); games.delete(chat)
    return Reply('🛑 Permainan Mafia dihentikan.')
  }

  return Reply(HELP)
}

handler.command = [
  'mafia', 'mafiajoin', 'mafiastart', 'mafiarole', 'mafiaaksi', 'mafiavote', 'mafiastatus', 'mafiaskip', 'mafiastop', 'mafiahelp',
  'mafia-join', 'mafia-start', 'mafia-role', 'mafia-aksi', 'mafia-vote', 'mafia-status', 'mafia-skip', 'mafia-stop', 'mafia-help'
]
handler.help = ['mafia']
handler.tags = ['game']

handler._internals = { assignRoles, checkWin, resolveNight, tally, games, timers, nightEnd, dayEnd, ROLE }

module.exports = handler
