/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const {
    addReseller,
    removeReseller,
    getReseller,
    listResellers,
    daysLeft,
    addSaldo
} = require('../../library/database/reseller.js');

const fallbackPrefix = typeof global.prefix === 'string' ? global.prefix : '.';

function normalizePhone(n) {
    n = String(n || '').replace(/\D/g, '');
    if (n.startsWith('0')) n = '62' + n.slice(1);
    if (!n.startsWith('62')) n = '62' + n;
    return n;
}

let handler = async (m, { shorekeeper, command, text, isCreator, Reply }) => {
    const cmd = String(command || '').toLowerCase();

    if (cmd === 'addreseller') {
        if (!isCreator) return Reply('❌ Fitur ini hanya untuk owner!');
        if (!text || !text.includes('|')) {
            return Reply(
                `📝 *TAMBAH RESELLER*\n\n` +
                `Format: ${fallbackPrefix}addreseller nomor|hari|saldo\n` +
                `Contoh: ${fallbackPrefix}addreseller 628123456789|30|0\n\n` +
                `Ket: hari = 0 artinya lifetime (tidak expired).`
            );
        }

        let [nomorRaw, hariRaw, saldoRaw] = text.split('|').map(v => (v || '').trim());
        const phone = normalizePhone(nomorRaw);
        const days = parseInt(hariRaw) || 0;
        const saldo = parseInt(saldoRaw) || 0;

        if (!phone || phone.length < 10) return Reply('❌ Nomor tidak valid.');

        const jid = `${phone}@s.whatsapp.net`;
        const result = addReseller(jid, { days, saldo, addedBy: m.sender });
        if (!result.ok) return Reply(`❌ ${result.msg}`);

        const masa = days > 0 ? `${days} hari` : 'Lifetime';
        return Reply(
            `✅ *RESELLER DITAMBAHKAN*\n\n` +
            `📱 Nomor: ${phone}\n` +
            `⏰ Masa Aktif: ${masa}\n` +
            `💰 Saldo Awal: ${saldo}`
        );
    }

    if (cmd === 'delreseller') {
        if (!isCreator) return Reply('❌ Fitur ini hanya untuk owner!');
        if (!text) return Reply(`Format: ${fallbackPrefix}delreseller 628xxxx`);

        const phone = normalizePhone(text.trim());
        const jid = `${phone}@s.whatsapp.net`;
        const result = removeReseller(jid);
        if (!result.ok) return Reply(`❌ ${result.msg}`);

        return Reply(`✅ Reseller ${phone} berhasil dihapus.`);
    }

    if (cmd === 'addsaldoreseller') {
        if (!isCreator) return Reply('❌ Fitur ini hanya untuk owner!');
        if (!text || !text.includes('|')) {
            return Reply(`Format: ${fallbackPrefix}addsaldoreseller nomor|jumlah`);
        }
        let [nomorRaw, jumlahRaw] = text.split('|').map(v => (v || '').trim());
        const phone = normalizePhone(nomorRaw);
        const jid = `${phone}@s.whatsapp.net`;
        const jumlah = parseInt(jumlahRaw) || 0;

        const result = addSaldo(jid, jumlah);
        if (!result.ok) return Reply(`❌ ${result.msg}`);

        return Reply(`✅ Saldo reseller ${phone} berhasil ditambah.\n💰 Saldo sekarang: ${result.saldo}`);
    }

    if (cmd === 'listreseller') {
        if (!isCreator) return Reply('❌ Fitur ini hanya untuk owner!');
        const list = listResellers();
        if (!list.length) return Reply('📋 Belum ada reseller terdaftar.');

        let teks = `╭─⬣「 DAFTAR RESELLER 」⬣\n│\n`;
        let i = 0;
        for (const r of list) {
            const sisa = daysLeft(r.jid);
            const status = sisa === Infinity ? 'Lifetime' : (sisa > 0 ? `${sisa} hari lagi` : 'Expired');
            teks += `├─ ${++i}. ${r.jid.split('@')[0]}\n`;
            teks += `│  ├─ ⏰ Status: ${status}\n`;
            teks += `│  ├─ 💰 Saldo: ${r.quota?.saldo ?? 0}\n`;
            teks += `│  └─ 🖥️ Panel Dibuat: ${r.totalCreated || 0}\n`;
        }
        teks += `│\n╰─⬣`;
        return Reply(teks);
    }

    if (cmd === 'cekreseller') {
        const target = text ? `${normalizePhone(text.trim())}@s.whatsapp.net` : m.sender;
        const data = getReseller(target);
        if (!data) return Reply('❌ Nomor tersebut belum terdaftar sebagai reseller.');

        const sisa = daysLeft(target);
        const status = sisa === Infinity ? 'Lifetime' : (sisa > 0 ? `${sisa} hari lagi` : 'Expired');

        return Reply(
            `╭─⬣「 STATUS RESELLER 」⬣\n│\n` +
            `├─ 📱 Nomor: ${target.split('@')[0]}\n` +
            `├─ ⏰ Status: ${status}\n` +
            `├─ 💰 Saldo: ${data.quota?.saldo ?? 0}\n` +
            `└─ 🖥️ Total Panel Dibuat: ${data.totalCreated || 0}\n` +
            `╰─⬣`
        );
    }
};

handler.command = ['addreseller', 'delreseller', 'addsaldoreseller', 'listreseller', 'cekreseller'];
module.exports = handler;
