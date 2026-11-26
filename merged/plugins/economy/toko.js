/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Sistem Ekonomi — Toko
 * .toko / .shop — lihat daftar barang
 * .beli <id> [jumlah] — beli barang
 * .jual <id> [jumlah] — jual barang (60% harga beli)
 * .inventory / .inv / .tas — cek isi tas
 */
'use strict'
const eko = require('../../library/ekonomi')

let handler = async (m, { command, args, prefix, Reply }) => {
    const cmd = String(command).toLowerCase()

    if (cmd === 'toko' || cmd === 'shop') {
        const rows = eko.SHOP.map(s => `> ◦ *${s.id}* — ${s.nama}\n     Rp${eko.fmt(s.harga)} — ${s.desc}`).join('\n')
        return Reply(
            `\`⌜ 🛒 Toko ⌟\`\n\n${rows}\n\n` +
            `Beli: ${prefix}beli <id> [jumlah]\n` +
            `Jual: ${prefix}jual <id> [jumlah]`
        )
    }

    if (cmd === 'inventory' || cmd === 'inv' || cmd === 'tas') {
        const u = eko.getUser(m.sender)
        if (!u.inventory || !u.inventory.length) {
            return Reply(`\`⌜ 🎒 Inventory ⌟\`\n> ◦ Tas kamu masih kosong.\n> ◦ Belanja dulu di *${prefix}toko*.`)
        }
        const rows = u.inventory.map(i => `> ◦ ${i.nama} x${i.qty}`).join('\n')
        return Reply(`\`⌜ 🎒 Inventory ⌟\`\n\n${rows}`)
    }

    // beli / jual
    const itemId = String(args[0] || '').toLowerCase()
    const qty = parseInt(args[1], 10) || 1
    if (!itemId) {
        return Reply(`Format: ${prefix}${cmd} <id> [jumlah]\nLihat daftar id di *${prefix}toko*.`)
    }

    const item = eko.getShopItem(itemId)
    if (!item) {
        return Reply(`Item *${itemId}* tidak ada di toko. Lihat *${prefix}toko* buat daftar id yang valid.`)
    }

    const result = cmd === 'beli' || cmd === 'buy'
        ? eko.buyItem(m.sender, itemId, qty)
        : eko.sellItem(m.sender, itemId, qty)

    if (!result.success) {
        return Reply(`\`⌜ ❌ Gagal ⌟\`\n> ◦ Info : *${result.message}*`)
    }

    const u = eko.getUser(m.sender)
    return Reply(
        `\`⌜ 🛍️ ${cmd === 'beli' || cmd === 'buy' ? 'Beli' : 'Jual'} ⌟\`\n` +
        `> ◦ Status : *Berhasil*\n` +
        `> ◦ Info   : ${result.message}\n` +
        `> ◦ Saldo  : *Rp${eko.fmt(u.money)}*`
    )
}

handler.command = ['toko', 'shop', 'beli', 'buy', 'jual', 'sell', 'inventory', 'inv', 'tas']
handler.help = ['toko', 'beli <id> [jumlah]', 'jual <id> [jumlah]', 'inventory']
handler.tags = ['economy']

module.exports = handler
