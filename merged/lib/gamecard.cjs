/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Pembungkus kartu rich HTML untuk game: frame (header + watermark KUREZA MD + footer),
 * sendCard, esc, logHtml. Kelas CSS siap pakai: .box .pl .p .p.me .nm .tg .pill .dot .felt .info
 * .hint (+code) .muted .log .row .win. Tambahan CSS game sendiri lewat opts.css.
 *
 * Pakai:
 *   const GC = require('../../lib/gamecard.cjs')
 *   const ok = await GC.sendCard(sock, jid, GC.frame('sub judul', bodyHtml, { title: 'OTHELLO', icon: '⚫', css: '...' }), 'Othello')
 *   if (!ok) await sock.sendMessage(jid, { text: '...cadangan teks...' })
 */
'use strict'
const UC = require('./unocard.cjs')
module.exports = { sendCard: UC.sendCard, frame: UC.frame, esc: UC.esc, logHtml: UC.logHtml }
