/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * .tema           — daftar tema kartu rich + tema yang aktif
 * .tema <nama>    — ganti tema (langsung berlaku, tanpa restart) — contoh: .tema brutal / .tema aurora
 * Khusus owner. Pilihan tersimpan di lib/database/uitheme.json
 */
'use strict'
const theme = require('../../lib/rich/theme.cjs')

let handler = async (m, { text, Reply, isCreator, prefix }) => {
  if (!isCreator) return Reply(global.mess?.owner || 'Fitur ini khusus owner.')
  const p = prefix || '.'
  const arg = String(text || '').trim()
  const cur = theme.richId()

  if (!arg) {
    const list = Object.entries(theme.RICH)
      .map(([id, t]) => `${id === cur ? '▶' : '•'} *${id}* — ${t.name}${id === cur ? ' _(aktif)_' : ''}`)
      .join('\n')
    return Reply(`🎨 *TEMA KARTU RICH*\n\n${list}\n\nGanti: *${p}tema <nama>*\nContoh: *${p}tema brutal*`)
  }

  const id = theme.setRich(arg)
  if (!id) return Reply(`Tema *${arg}* tidak ditemukan.\nKetik *${p}tema* untuk melihat daftar.`)
  return Reply(`✅ Tema diganti ke *${theme.RICH[id].name}* (${id}).\nKirim *${p}menu* untuk melihat hasilnya.`)
}

handler.command = ['tema', 'theme']
handler.help = ['tema']
handler.tags = ['owner']

module.exports = handler
