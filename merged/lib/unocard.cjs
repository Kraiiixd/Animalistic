/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Kartu rich HTML untuk UNO (meja, kartu tangan, lobby, pemenang).
 * Kartu statis: semua data tertanam di HTML, tanpa fetch (sandbox WA memblokir jaringan).
 */
'use strict'

const DEFAULT_BOT_JID = '867051314767696@bot'
const KAPABILITAS = [34, 58, 29, 1, 67, 60, 55, 8]
const hex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')
const rid = () => `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

function buildPayload(html, title) {
  return {
    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2, botMetadata: { capabilityMetadata: { capabilities: KAPABILITAS } } },
    botForwardedMessage: { message: { richResponseMessage: {
      messageType: 1,
      submessages: [{ messageType: 2, messageText: title }],
      unifiedResponse: { data: Buffer.from(JSON.stringify({
        response_id: rid(),
        sections: [{ view_model: { primitive: { __typename: 'GenAIaeacdsnwHtmlPrimitive', payload: html, trusted_sources: [] }, __typename: 'GenAISingleLayoutViewModel' } }]
      })).toString('base64') },
      contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: DEFAULT_BOT_JID }, forwardOrigin: 4 }
    } } }
  }
}

// kirim kartu ke jid (grup atau pribadi). true = sukses, false = gagal (pemanggil kirim teks cadangan)
async function sendCard(sock, jid, html, title) {
  try {
    await sock.relayMessage(jid, buildPayload(html, title), {})
    return true
  } catch (e) {
    console.error(`[UNOCARD:${title}] gagal kirim:`, e.message)
    return false
  }
}

// ───────────────────────── tampilan ─────────────────────────
const HEXC = { r: '#ef4444', y: '#eab308', g: '#22c55e', b: '#3b82f6', w: '#1f2230' }
const CNAME = { r: 'Merah', y: 'Kuning', g: 'Hijau', b: 'Biru' }
const SYM = { S: '⊘', R: '⇄', D: '+2', W: '★', F: '+4' }
const VNAME = { S: 'Skip', R: 'Reverse', D: '+2', W: 'Wild', F: 'Wild +4' }
const sym = (card) => SYM[card.v] || card.v

const CSS = String.raw`
:root{--bg:#0f1115;--card:#181b22;--card2:#20242d;--ink:#fff;--soft:#a3aab8;--line:#2b303b;--acc:#f59e0b;--sys:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{background:transparent;color:var(--ink);font-family:var(--sys);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
.stage{min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:14px 10px;}
.app{width:100%;max-width:380px;border-radius:16px;overflow:hidden;position:relative;background:linear-gradient(180deg,#2a1d2e 0%,#1a1722 32%,var(--bg) 72%);box-shadow:0 18px 40px rgba(0,0,0,.55);padding:14px 12px 12px;}
.top{display:flex;align-items:center;gap:9px;margin-bottom:12px;position:relative;z-index:2;}
.logo{width:32px;height:32px;border-radius:9px;background:#ef4444;flex:none;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 0 0 2px #fff inset;}
.meta{min-width:0;flex:1;}
.title{font-size:15px;font-weight:900;letter-spacing:.5px;}
.sub{font-size:10.5px;color:var(--soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}
.brand{flex:none;font-size:9.5px;font-weight:900;letter-spacing:1.6px;color:#1a1200;background:linear-gradient(90deg,#fbbf24,#f59e0b);border-radius:20px;padding:4px 9px;}
.sec{position:relative;z-index:2;}
.box{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 12px;}
.muted{color:var(--soft);font-size:11px;}
.log{margin:10px 0;display:flex;flex-direction:column;gap:3px;font-size:12px;line-height:1.35;}
.log div{color:#e5e7eb;}
.log div:first-child{font-weight:800;color:#fff;}
/* kartu UNO */
.uc{position:relative;width:100%;aspect-ratio:2/3;border-radius:10px;border:2.5px solid #fff;background:var(--c);display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,.45);}
.uc::before{content:"";position:absolute;width:128%;height:70%;left:-14%;top:15%;background:#fff;border-radius:50%;transform:rotate(-28deg);}
.uc.wild::before{background:conic-gradient(#ef4444 0 25%,#eab308 0 50%,#22c55e 0 75%,#3b82f6 0);}
.uc .v{position:relative;z-index:1;font-weight:900;font-size:var(--fs,26px);color:var(--c);line-height:1;}
.uc.wild .v{color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.7);}
.uc .k{position:absolute;z-index:1;font-size:9px;font-weight:900;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.5);}
.uc .k.a{left:5px;top:3px;}.uc .k.z{right:5px;bottom:3px;transform:rotate(180deg);}
.back{background:#111;}
.back::before{background:#ef4444;}
.back .v{color:#fbbf24;font-size:9px;font-style:italic;transform:rotate(-28deg);}
/* meja */
.felt{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;gap:16px;padding:14px 8px;border-radius:14px;background:radial-gradient(ellipse at center,#14532d 0%,#0c3a20 70%);border:1px solid #1f6b3b;}
.felt .big{width:92px;--fs:42px;}
.felt .big .k{font-size:12px;}
.info{display:flex;flex-direction:column;gap:7px;}
.pill{background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:5px 11px;font-size:11.5px;font-weight:800;white-space:nowrap;}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:-1px;border:1.5px solid #fff;}
/* pemain */
.pl{display:flex;flex-direction:column;gap:6px;margin-top:10px;position:relative;z-index:2;}
.p{display:flex;align-items:center;gap:9px;background:var(--card);border:1px solid var(--line);border-radius:11px;padding:8px 10px;}
.p.me{border-color:var(--acc);background:linear-gradient(90deg,rgba(245,158,11,.18),var(--card));}
.p .nm{flex:1;min-width:0;font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.p .tg{font-size:9px;font-weight:900;letter-spacing:1px;color:#1a1200;background:var(--acc);border-radius:20px;padding:2px 7px;margin-left:6px;vertical-align:1px;}
.p .tg.uno{background:#ef4444;color:#fff;}
.stack{display:flex;align-items:center;}
.stack i{display:block;width:9px;height:16px;border-radius:3px;background:#ef4444;border:1.5px solid #fff;margin-left:-5px;}
.stack i:first-child{margin-left:0;}
.cnt{flex:none;min-width:24px;text-align:right;font-size:14px;font-weight:900;color:var(--acc);}
/* tangan */
.hand{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:12px;position:relative;z-index:2;}
.slot{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;}
.slot .n{font-size:11px;font-weight:900;color:var(--soft);}
.slot.ok .uc{box-shadow:0 0 0 2.5px #22c55e,0 0 14px rgba(34,197,94,.7);transform:translateY(-3px);}
.slot.ok .n{color:#22c55e;}
.slot.no .uc{opacity:.4;filter:saturate(.6);}
.hint{margin-top:12px;position:relative;z-index:2;text-align:center;font-size:12px;font-weight:800;}
.hint code{background:var(--card2);border:1px solid var(--line);border-radius:6px;padding:2px 6px;font-size:11.5px;color:#fbbf24;}
.mini{width:54px;flex:none;--fs:22px;}
.row{display:flex;align-items:center;gap:12px;position:relative;z-index:2;}
.win{text-align:center;padding:16px 8px 8px;position:relative;z-index:2;}
.win .tr{font-size:54px;line-height:1;}
.win .wn{font-size:20px;font-weight:900;margin-top:8px;color:#fbbf24;}
/* watermark Kureza */
.wm{position:absolute;inset:-45%;display:flex;flex-wrap:wrap;gap:30px 26px;align-content:center;justify-content:center;transform:rotate(-24deg);pointer-events:none;opacity:.07;z-index:6;}
.wm span{font-size:14px;font-weight:900;letter-spacing:3px;white-space:nowrap;color:#fff;}
.foot{position:relative;z-index:7;margin-top:12px;padding-top:9px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10px;color:var(--soft);}
.foot b{color:#fbbf24;letter-spacing:1.2px;}
`

const WM = Array.from({ length: 70 }, () => '<span>KUREZA MD</span>').join('')

// opts: { title='UNO', icon='🎴', css='' } — dipakai juga oleh game kartu rich lain (lib/gamecard.cjs)
const frame = (sub, body, opts = {}) => `<style>${CSS}${opts.css || ''}</style>
<div class="stage"><div class="app">
 <div class="wm">${WM}</div>
 <div class="top"><div class="logo">${opts.icon || '🎴'}</div><div class="meta"><div class="title">${esc(opts.title || 'UNO')}</div><div class="sub">${esc(sub)}</div></div><div class="brand">KUREZA MD</div></div>
 ${body}
 <div class="foot"><span>© <b>KUREZA MD</b> · Hitoshi MD</span><span>Created by Kureza</span></div>
</div></div>`

// satu kartu. opts: { n, ok, dim, color (warna efektif untuk Wild yang sudah dimainkan) }
function cardEl(card, opts = {}) {
  const wild = card.c === 'w'
  const eff = wild ? (opts.color || card.wildColor || null) : card.c
  const bg = wild && !eff ? HEXC.w : HEXC[eff || card.c]
  const s = esc(sym(card))
  const fs = s.length >= 2 ? 'calc(var(--fs,26px) * .78)' : 'var(--fs,26px)'
  const inner = `<div class="uc${wild && !opts.color && !card.wildColor ? ' wild' : ''}" style="--c:${bg};--fs:${fs}"><span class="k a">${s}</span><span class="v">${s}</span><span class="k z">${s}</span></div>`
  return inner
}

const backs = (n) => {
  const shown = Math.min(n, 10)
  return `<div class="stack">${'<i></i>'.repeat(shown)}</div>`
}

function playersHtml(g) {
  return `<div class="pl">${g.players.map((p, i) => {
    const turn = g.state === 'playing' && i === g.turn
    const tags = (turn ? '<span class="tg">GILIRAN</span>' : '') + (g.state === 'playing' && p.hand.length === 1 ? '<span class="tg uno">UNO!</span>' : '')
    return `<div class="p${turn ? ' me' : ''}"><div class="nm">${esc(p.name)}${tags}</div>${g.state === 'playing' ? backs(p.hand.length) + `<div class="cnt">${p.hand.length}</div>` : ''}</div>`
  }).join('')}</div>`
}

const logHtml = (log) => log ? `<div class="log sec">${String(log).split('\n').filter(Boolean).map((l) => `<div>${esc(l)}</div>`).join('')}</div>` : ''

// kartu meja untuk grup
function tableHtml(g, log) {
  const top = g.top
  const body = `${logHtml(log)}
 <div class="felt">
  <div class="big">${cardEl(top, { color: g.color })}</div>
  <div class="info">
   <div class="pill"><span class="dot" style="background:${HEXC[g.color]}"></span>${esc(CNAME[g.color])}</div>
   <div class="pill">${g.dir === 1 ? '➡️ Searah jarum' : '⬅️ Berlawanan'}</div>
   <div class="pill">🂠 Deck ${g.deck.length}</div>
  </div>
 </div>
 ${playersHtml(g)}
 <div class="hint">Kartu tangan dikirim ke chat pribadi · <code>.unoplay &lt;nomor&gt; [warna]</code></div>`
  const p = g.players[g.turn]
  return frame(`Giliran ${p ? p.name : '-'} · ${g.players.length} pemain`, body)
}

// kartu tangan untuk satu pemain (DM)
function handHtml(g, p, { playable, mine }) {
  const slots = p.hand.map((card, i) => {
    const ok = !!(mine && playable(card))
    return `<div class="slot ${mine ? (ok ? 'ok' : 'no') : ''}">${cardEl(card)}<div class="n">${ok ? '✓ ' : ''}#${i + 1}</div></div>`
  }).join('')
  const topRow = `<div class="row sec"><div class="mini">${cardEl(g.top, { color: g.color })}</div><div class="info"><div class="pill"><span class="dot" style="background:${HEXC[g.color]}"></span>Warna ${esc(CNAME[g.color])}</div><div class="pill">${mine ? '✅ Giliranmu!' : '⏳ Tunggu giliran'}</div></div></div>`
  const hint = mine
    ? `<div class="hint">Mainkan: <code>.unoplay &lt;nomor&gt; [warna]</code><br><span class="muted">atau ambil kartu: </span><code>.unodraw</code></div>`
    : `<div class="hint muted">Giliran berikutnya akan muncul di sini.</div>`
  return frame(`Kartu ${esc(p.name)} · ${p.hand.length} kartu`, `${topRow}<div class="hand">${slots}</div>${hint}`)
}

// lobby sebelum mulai
function lobbyHtml(g, min, max, note) {
  const list = `<div class="pl">${g.players.map((p, i) => `<div class="p${i === 0 ? ' me' : ''}"><div class="nm">${esc(p.name)}${g.host === p.id ? '<span class="tg">HOST</span>' : ''}</div></div>`).join('')}</div>`
  const body = `${logHtml(note)}
 <div class="felt"><div class="big" style="width:74px">${cardEl({ c: 'w', v: 'W' })}</div><div class="info"><div class="pill">👥 ${g.players.length} / ${max} pemain</div><div class="pill">Min. ${min} pemain</div></div></div>
 ${list}
 <div class="hint"><code>.unojoin</code> gabung · <code>.unostart</code> mulai (host)</div>`
  return frame('Lobby terbuka', body)
}

// pemenang
function winHtml(g, winner, log) {
  const body = `<div class="win"><div class="tr">🏆</div><div class="wn">${esc(winner.name)}</div><div class="muted" style="margin-top:4px">MENANG! Selamat 🎉</div></div>
 ${logHtml(log)}
 <div class="hint">Main lagi? ketik <code>.uno</code></div>`
  return frame('Permainan selesai', body)
}

module.exports = { sendCard, tableHtml, handHtml, lobbyHtml, winHtml, esc, buildPayload, frame, logHtml }
