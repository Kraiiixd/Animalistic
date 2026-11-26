/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

/*
 * Alight Motion Premium (.am, .alight)
 */

const axios = require('axios');

let handler = async (m, { shorekeeper, text, command, isCreator, isPremium, Reply, checkResellerAccess, checkLimit, addLimit, prefix }) => {
    const isResellerUser = (typeof checkResellerAccess === 'function' && checkResellerAccess(m.sender)) ||
                           (typeof global.isResellerAM === 'function' && global.isResellerAM(m.sender));

    if (!isCreator && !isResellerUser && !isPremium) {
        return Reply(
`\`⌜ ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ ⌟\`
> ◦ ᴀᴋsᴇs : *Khusus Reseller / Premium*
> ◦ ᴘᴇsᴀɴ : *Fitur ini khusus untuk Reseller, Premium & Owner!*
> ◦ ɪɴғᴏ : *Silakan hubungi Owner untuk mendaftar sebagai Reseller.*`
        );
    }

    if (typeof checkLimit === 'function' && checkLimit(m.sender, isPremium, isCreator)) {
        return Reply(global.mess?.limit || '❌ Limit harian kamu habis!');
    }

    const args = text ? text.trim().split(/\s+/) : [];
    const subCmd = args[0]?.toLowerCase();

    if (!subCmd) {
        return Reply(
`📱 *ALIGHT MOTION PREMIUM*
> ◦ ᴄʀᴇᴀᴛᴏʀ : *Kureza*
> ◦ ᴀᴋsᴇs : *Reseller / Premium / Owner*

*Cara Penggunaan:*
▸ *${prefix + command} send <email>*
   → Kirim link magic login ke email
   
▸ *${prefix + command} verif <link>*
▸ *${prefix + command} verif <email> <link>*
   → Verifikasi & aktifkan VIP Pro (1 Tahun)

▸ *${prefix + command} bulk <jumlah>*
   → Generate akun massal (.txt dokumen)

*Contoh:*
${prefix + command} send user@gmail.com
${prefix + command} verif https://alightcreative.com/auth/...`
        );
    }

    const apiKey = global.apikeydiezy || global.apikeyalip || "alipaiapikeybaru";
    const baseUrl = (global.apidiezy || "https://api-diezy.clutch.ai.id").replace(/\/$/, "");

    if (subCmd === 'send') {
        const email = (args[1] || '').trim().toLowerCase();
        if (!email || !email.includes('@') || !email.includes('.')) {
            return Reply(`❌ Masukkan email yang valid!\nContoh: *${prefix + command} send user@gmail.com*`);
        }

        global.ampremSessions = global.ampremSessions || {};
        global.ampremSessions[m.sender] = email;
        global.ampremEmail = email;

        Reply(global.mess?.wait || '⏳ Sedang mengirim magic link...');
        await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        try {
            const apiUrl = `${baseUrl}/apkprem/alightmotion/send-link?apikey=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(email)}`;
            const res = await axios.get(apiUrl, { timeout: 45000, validateStatus: () => true });

            if (res.data && res.data.status === true) {
                await shorekeeper.sendMessage(m.chat, { react: { text: '📧', key: m.key } });
                if (typeof addLimit === 'function') addLimit(m.sender, isPremium, isCreator);

                return Reply(
`\`⌜ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ⌟\`
> ◦ sᴛᴀᴛᴜs : *Magic Link Terkirim 📧*
> ◦ ᴇᴍᴀɪʟ : *${email}*

\`⌜ ʟᴀɴɢᴋᴀʜ sᴇʟᴀɴᴊᴜᴛɴʏᴀ ⌟\`
> ◦ 1. Buka email (cek Inbox / Spam)
> ◦ 2. Copy tautan dari Alight Creative
> ◦ 3. Ketik: *${prefix + command} verif <link>*`
                );
            } else {
                await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return Reply(`❌ Gagal: ${res.data?.message || 'Gagal mengirim email'}`);
            }
        } catch (e) {
            await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return Reply(`❌ Error: ${e.response?.data?.message || e.message}`);
        }
    }

    if (subCmd === 'verif' || subCmd === 'verify') {
        let emailTarget = '';
        let linkTarget = '';

        if (args.length >= 3 && args[1].includes('@')) {
            emailTarget = args[1].toLowerCase();
            linkTarget = args.slice(2).join(' ').trim();
        } else {
            linkTarget = args.slice(1).join(' ').trim();
            emailTarget = global.ampremSessions?.[m.sender] || global.ampremEmail || '';
        }

        function unwrapAlightLink(urlStr) {
            if (!urlStr) return '';
            let link = String(urlStr).trim();
            try {
                if (link.includes('firebaseapp.com') && link.includes('link=')) {
                    const u = new URL(link);
                    const inner = u.searchParams.get('link');
                    if (inner) link = inner;
                }
            } catch (e) {}
            return link;
        }

        linkTarget = unwrapAlightLink(linkTarget);

        if (!linkTarget || !/^https?:\/\//i.test(linkTarget)) {
            return Reply(`❌ Masukkan link verifikasi yang valid!\nContoh: *${prefix + command} verif https://alightcreative.com/auth/...*`);
        }

        if (!emailTarget) {
            return Reply(`❌ Email tidak ditemukan! Silakan kirim dulu: *${prefix + command} send <email>*\nAtau gunakan: *${prefix + command} verif <email> <link>*`);
        }

        Reply(global.mess?.wait || '⏳ Sedang memverifikasi link...');
        await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        try {
            const apiUrl = `${baseUrl}/apkprem/alightmotion/verify?apikey=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(emailTarget)}&magicLink=${encodeURIComponent(linkTarget)}`;
            const res = await axios.get(apiUrl, { timeout: 90000, validateStatus: () => true });
            const data = res.data;

            if (data && (data.status === true || data.data?.status === 'ACTIVE')) {
                await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                if (typeof addLimit === 'function') addLimit(m.sender, isPremium, isCreator);

                if (global.ampremSessions) delete global.ampremSessions[m.sender];

                return Reply(
`\`⌜ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ᴘʀᴇᴍɪᴜᴍ ⌟\`
> ◦ ᴄʀᴇᴀᴛᴏʀ : *Kureza*
> ◦ sᴛᴀᴛᴜs : *✅ Berhasil Diaktifkan*
> ◦ ᴇᴍᴀɪʟ : *${emailTarget}*
> ◦ ᴍᴇᴍʙᴇʀsʜɪᴘ : *Alight Motion VIP Pro (1 Tahun)*

🎉 Akun Alight Motion Anda telah aktif Pro 1 Tahun tanpa watermark!`
                );
            } else {
                await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return Reply(`❌ Verifikasi gagal: ${data?.message || 'Link tidak valid atau kadaluwarsa'}`);
            }
        } catch (e) {
            await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return Reply(`❌ Error: ${e.response?.data?.message || e.message}`);
        }
    }

    if (subCmd === 'bulk') {
        const count = Math.max(1, Math.min(parseInt(args[1] || '5', 10), 25));
        Reply(global.mess?.wait || '⏳ Sedang memproses bulk akun Alight Motion...');
        await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        try {
            const apiUrl = `${baseUrl}/apkprem/alightmotion/bulk?apikey=${encodeURIComponent(apiKey)}&count=${count}`;
            const res = await axios.get(apiUrl, { timeout: 180000 });
            const data = res.data;

            if (!data || data.status !== true || !Array.isArray(data.results)) {
                await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return Reply(`❌ Gagal: ${data?.error || 'Gagal generate bulk'}`);
            }

            const successList = data.results.filter(r => r.status);
            if (!successList.length) {
                await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return Reply('❌ Semua pembuatan akun gagal, silakan coba lagi.');
            }

            let fileText = `==================================================\n` +
                           `           ALIGHT MOTION PRO (BULK)\n` +
                           `               Creator: Kureza\n` +
                           `==================================================\n` +
                           `Total Akun  : ${successList.length} Akun\n` +
                           `Waktu Buat  : ${new Date().toLocaleString('id-ID')}\n` +
                           `Plan        : Alight Motion VIP Pro (1 Tahun)\n` +
                           `==================================================\n\n`;

            successList.forEach((acc, i) => {
                fileText += `[AKUN ${i + 1}]\n` +
                            `Email       : ${acc.email}\n` +
                            `Inbox Login : ${acc.inbox}\n` +
                            `Masa Aktif  : 1 Tahun\n` +
                            `--------------------------------------------------\n\n`;
            });

            const caption = `\`⌜ ʙᴜʟᴋ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ⌟\`\n` +
                            `> ◦ ᴄʀᴇᴀᴛᴏʀ : *Kureza*\n` +
                            `> ◦ sᴛᴀᴛᴜs : *✅ Berhasil (${successList.length}/${count})*\n` +
                            `> ◦ ᴘʟᴀɴ : *Alight Motion Pro 1 Tahun*\n\n` +
                            `📄 File .txt berisi seluruh akun telah dilampirkan di atas!`;

            await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            if (typeof addLimit === 'function') addLimit(m.sender, isPremium, isCreator);

            return await shorekeeper.sendMessage(m.chat, {
                document: Buffer.from(fileText, 'utf-8'),
                fileName: `AlightMotion_Bulk_${successList.length}_Akun.txt`,
                mimetype: 'text/plain',
                caption: caption
            }, { quoted: m });
        } catch (e) {
            await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return Reply(`❌ Error: ${e.response?.data?.message || e.message}`);
        }
    }

    return Reply(`❌ Sub-command tidak dikenal. Gunakan:\n• *${prefix + command} send <email>*\n• *${prefix + command} verif <link>*\n• *${prefix + command} bulk <jumlah>*`);
};

handler.command = ["am", "alight"];
handler.help = ["am send <email>", "am verif <link>", "am bulk <jumlah>"];
handler.tags = ["premium"];
handler.limit = true;

module.exports = handler;
