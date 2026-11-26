/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Sistem Ekonomi — Menu
 * .ekonomi / .eco — daftar command ekonomi yang tersedia
 */
'use strict'

let handler = async (m, { Reply, prefix }) => {
    const p = prefix || '.'
    const text =
        `\`⌜ 💰 Sistem Ekonomi ⌟\`\n\n` +
        `> ◦ ${p}saldo — cek saldo cash & bank\n` +
        `> ◦ ${p}daily — klaim bonus harian\n` +
        `> ◦ ${p}weekly — klaim bonus mingguan\n` +
        `> ◦ ${p}monthly — klaim bonus bulanan\n` +
        `> ◦ ${p}kerja — kerja buat dapat cash\n` +
        `> ◦ ${p}tabung <jumlah> — simpan cash ke bank\n` +
        `> ◦ ${p}tarik <jumlah> — ambil saldo dari bank\n` +
        `> ◦ ${p}transfer <@tag/nomor> <jumlah> — kirim cash ke user lain\n` +
        `> ◦ ${p}toko — lihat daftar barang di toko\n` +
        `> ◦ ${p}beli <id> [jumlah] — beli barang\n` +
        `> ◦ ${p}jual <id> [jumlah] — jual barang (60% harga beli)\n` +
        `> ◦ ${p}inventory — cek isi tas/inventory\n` +
        `> ◦ ${p}kaya — leaderboard orang terkaya\n` +
        `> ◦ ${p}riwayat — riwayat transaksi 10 terakhir`
    return Reply(text)
}

handler.command = ['ekonomi', 'eco', 'menuekonomi']
handler.help = ['ekonomi']
handler.tags = ['economy']

module.exports = handler
