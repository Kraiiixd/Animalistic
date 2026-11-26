/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const axios = require('axios');
const { createCanvas } = (() => { try { return require('@napi-rs/canvas'); } catch (_) { return require('canvas'); } })();

async function renderPrimbonCard(title, subtitle, badge, details) {
    try {
        const width = 1200;
        const height = 630;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // 1. Dark Mystical Background Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#08060f');
        bgGrad.addColorStop(0.5, '#0e0a1a');
        bgGrad.addColorStop(1, '#050308');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. Stars / Mystical Particles
        for (let i = 0; i < 220; i++) {
            const px = Math.random() * width;
            const py = Math.random() * height;
            const size = Math.random() * 2 + 0.5;
            const alpha = Math.random() * 0.4 + 0.1;
            ctx.fillStyle = `rgba(218, 165, 32, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Golden/Cyan Mystical Aura Glow
        const glow = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 500);
        glow.addColorStop(0, 'rgba(255, 215, 0, 0.12)');
        glow.addColorStop(0.5, 'rgba(0, 210, 255, 0.08)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        // 4. Glassmorphism Card Container
        const cardX = 60;
        const cardY = 60;
        const cardW = width - 120;
        const cardH = height - 120;
        const radius = 28;

        ctx.fillStyle = 'rgba(18, 14, 28, 0.88)';
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, radius);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, radius);
        ctx.stroke();

        // 5. Corner Ornaments (Golden Vintage Cyber Corners)
        const cSize = 28;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        [[cardX + 8, cardY + 8, 1, 1], [cardX + cardW - 8, cardY + 8, -1, 1], [cardX + 8, cardY + cardH - 8, 1, -1], [cardX + cardW - 8, cardY + cardH - 8, -1, -1]]
            .forEach(([cx, cy, dx, dy]) => {
                ctx.beginPath();
                ctx.moveTo(cx + dx * cSize, cy);
                ctx.lineTo(cx, cy);
                ctx.lineTo(cx, cy + dy * cSize);
                ctx.stroke();
            });

        // 6. Header Tag
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText('✦  PRIMBON JAWA & METAFISIKA NUSANTARA  ✦', width / 2, 120);

        // 7. Title with Glow
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = 15;
        ctx.fillText(title, width / 2, 180);
        ctx.shadowBlur = 0;

        // 8. Subtitle / Target Name
        ctx.font = 'bold 26px Arial';
        ctx.fillStyle = '#00d2ff';
        ctx.fillText(subtitle, width / 2, 230);

        // 9. Badge Box
        let startTextY = 300;
        if (badge) {
            const badgeW = Math.min(cardW - 200, Math.max(300, ctx.measureText(badge).width + 60));
            const badgeH = 44;
            const badgeX = (width - badgeW) / 2;
            const badgeY = 260;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 22);
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.fillText(badge, width / 2, badgeY + 28);
            startTextY = 350;
        }

        // 10. Multi-line Details Text
        if (details) {
            ctx.font = '19px Arial';
            ctx.fillStyle = '#d0d0dc';
            ctx.textAlign = 'center';

            const maxLineW = cardW - 140;
            const words = details.replace(/\s+/g, ' ').trim().split(' ');
            let line = '';
            let currentY = startTextY;
            let lineCount = 0;

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxLineW && n > 0) {
                    ctx.fillText(line.trim(), width / 2, currentY);
                    line = words[n] + ' ';
                    currentY += 32;
                    lineCount++;
                    if (lineCount >= 6) {
                        ctx.fillText(line.trim() + '...', width / 2, currentY);
                        break;
                    }
                } else {
                    line = testLine;
                }
            }
            if (lineCount < 6 && line.trim()) {
                ctx.fillText(line.trim(), width / 2, currentY);
            }
        }

        return canvas.toBuffer('image/png');
    } catch (err) {
        console.error('[Primbon Card Render Error]', err.message);
        return null;
    }
}

function getApiConfig() {
    return {
        baseUrl: global.apiClutch,
        apiKey: global.Apikeyclutch
    };
}

// 1. Arti Nama
async function artiNama(nama) {
    const { baseUrl, apiKey } = getApiConfig();
    try {
        const res = await axios.get(`${baseUrl}/primbon/artinama?apikey=${apiKey}&nama=${encodeURIComponent(nama)}`, { timeout: 20000 });
        const result = res.data?.result || {};
        const arti = result.arti || 'Arti nama tidak ditemukan.';

        const card = await renderPrimbonCard("ARTI & MAKNA NAMA", nama, "✦ Watak & Karakter ✦", arti);
        const text = `\`⌜ Primbon Arti Nama ⌟\`\n> ◦ *Nama :* ${nama}\n> ◦ *Arti & Makna :*\n${arti}`;

        return { text, card };
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || "Gagal mengambil arti nama");
    }
}

// 2. Tafsir Mimpi
async function artiMimpi(mimpi) {
    const { baseUrl, apiKey } = getApiConfig();
    try {
        const res = await axios.get(`${baseUrl}/primbon/artimimpi?apikey=${apiKey}&mimpi=${encodeURIComponent(mimpi)}`, { timeout: 20000 });
        const result = res.data?.result || {};
        const tafsir = result.tafsir || `Tidak ditemukan tafsir untuk mimpi "${mimpi}".`;

        const cardSummary = tafsir.replace(/\n/g, ' ').replace(/-/g, '').slice(0, 300).trim();
        const card = await renderPrimbonCard("TAFSIR ARTI MIMPI", mimpi, "✦ Makna & Firasat Mimpi ✦", cardSummary);
        const text = `\`⌜ Primbon Tafsir Mimpi ⌟\`\n> ◦ *Kata Kunci :* ${mimpi}\n> ◦ *Hasil Tafsir :*\n${tafsir}`;

        return { text, card };
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || "Gagal mengambil tafsir mimpi");
    }
}

// 3. Simbol Mimpi & Kode Alam
async function simbolMimpi(query) {
    const { baseUrl, apiKey } = getApiConfig();
    try {
        const res = await axios.get(`${baseUrl}/primbon/simbolmimpi?apikey=${apiKey}&query=${encodeURIComponent(query)}`, { timeout: 20000 });
        const result = res.data?.result || {};
        const items = result.items || [];

        if (items.length === 0) {
            return {
                text: `❌ Tidak ditemukan simbol mimpi atau kode alam untuk "${query}".`
            };
        }

        let listText = `\`⌜ Primbon Simbol Mimpi & Kode Alam ⌟\`\n> ◦ *Query :* ${query}\n> ◦ *Sumber :* Primbon.ID\n\n`;

        items.slice(0, 5).forEach((item, idx) => {
            listText += `*${idx + 1}. ${item.mimpi.toUpperCase()}*\n`;
            listText += `> ◦ *Kategori :* ${item.kode_alam || '-'}\n`;
            listText += `> ◦ *Kode 2D :* ${item.kode2d || '-'}\n`;
            listText += `> ◦ *Kode 3D :* ${item.kode3d || '-'}\n`;
            listText += `> ◦ *Kode 4D :* ${item.kode4d || '-'}\n`;
            listText += `> ◦ *Pelarian :* ${item.pelarian || '-'}\n\n`;
        });

        const topItem = items[0];
        const cardSummary = `${topItem.mimpi.toUpperCase()} | 2D: ${topItem.kode2d || '-'} | 3D: ${topItem.kode3d || '-'} | 4D: ${topItem.kode4d || '-'} | Pelarian: ${topItem.pelarian || '-'}`;
        const card = await renderPrimbonCard("SIMBOL MIMPI & KODE ALAM", query, `✦ Kode 2D: ${topItem.kode2d} | 3D: ${topItem.kode3d} ✦`, cardSummary);

        return { text: listText.trim(), card };
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || "Gagal mengambil data simbol mimpi");
    }
}

// 4. Kecocokan Nama Pasangan
async function kecocokanNama(nama1, nama2) {
    const { baseUrl, apiKey } = getApiConfig();
    try {
        const res = await axios.get(`${baseUrl}/primbon/jodohnama?apikey=${apiKey}&nama1=${encodeURIComponent(nama1)}&nama2=${encodeURIComponent(nama2)}`, { timeout: 20000 });
        const result = res.data?.result || {};
        const analisis = result.analisis || 'Kecocokan nama tidak ditemukan.';

        const card = await renderPrimbonCard("KECOCOKAN JODOH NAMA", `${nama1} ❤️ ${nama2}`, "✦ Ramalan Numerologi Pasangan ✦", analisis);
        const text = `\`⌜ Primbon Kecocokan Nama ⌟\`\n> ◦ *Pasangan :* ${nama1} ❤️ ${nama2}\n\n*Hasil Analisis Kecocokan :*\n${analisis}`;

        return { text, card };
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || "Gagal mengambil kecocokan nama");
    }
}

// 5. Weton Jawa
async function wetonJawa(tgl, bln, thn) {
    const { baseUrl, apiKey } = getApiConfig();
    try {
        const res = await axios.get(`${baseUrl}/primbon/weton?apikey=${apiKey}&tgl=${tgl}&bln=${bln}&thn=${thn}`, { timeout: 20000 });
        const result = res.data?.result || {};

        const card = await renderPrimbonCard("RAMALAN WETON JAWA", result.tanggal || `${tgl}/${bln}/${thn}`, `✦ Neptu : ${result.neptu || '-'} ✦`, result.watakLahir || result.watakHari);
        const text = `\`⌜ Primbon Weton Jawa ⌟\`
> ◦ *Weton Tanggal :* ${result.tanggal || `${tgl}/${bln}/${thn}`}
> ◦ *Neptu :* ${result.neptu || '-'}
> ◦ *Watak Hari :* ${result.watakHari || '-'}

*Watak & Karakter Kelahiran :*
${result.watakLahir || '-'}`;

        return { text, card };
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || "Gagal mengambil data weton");
    }
}

// 6. Ramalan Jodoh (Kitab Betaljemur Adammakna)
async function ramalanJodoh(nama1, tgl1, bln1, thn1, nama2, tgl2, bln2, thn2) {
    const { baseUrl, apiKey } = getApiConfig();
    try {
        const res = await axios.get(`${baseUrl}/primbon/ramalanjodoh?apikey=${apiKey}&nama1=${encodeURIComponent(nama1)}&tgl1=${tgl1}&bln1=${bln1}&thn1=${thn1}&nama2=${encodeURIComponent(nama2)}&tgl2=${tgl2}&bln2=${bln2}&thn2=${thn2}`, { timeout: 25000 });
        const result = res.data?.result || {};
        const ramalan = result.ramalan || '-';

        const card = await renderPrimbonCard("RAMALAN JODOH PRIMBON", `${nama1} ❤️ ${nama2}`, "✦ Kitab Betaljemur Adammakna ✦", ramalan);
        const text = `\`⌜ Primbon Ramalan Jodoh ⌟\`
> ◦ *Pria :* ${nama1} (${tgl1}/${bln1}/${thn1})
> ◦ *Wanita :* ${nama2} (${tgl2}/${bln2}/${thn2})

*Hasil Ramalan Primbon :*
> ${ramalan}`;

        return { text, card };
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || "Gagal mengambil data ramalan jodoh");
    }
}

// 7. Petung Hari Baik
async function hariBaik(tgl, bln, thn) {
    const { baseUrl, apiKey } = getApiConfig();
    try {
        const res = await axios.get(`${baseUrl}/primbon/haribaik?apikey=${apiKey}&tgl=${tgl}&bln=${bln}&thn=${thn}`, { timeout: 20000 });
        const result = res.data?.result || {};

        const card = await renderPrimbonCard("PETUNG HARI BAIK", `${tgl}/${bln}/${thn}`, "✦ Metode Kamarokam ✦", result.watakHari || '-');
        const text = `\`⌜ Primbon Petung Hari Baik ⌟\`\n> ◦ *Tanggal :* ${tgl}/${bln}/${thn}\n> ◦ *Watak Hari :*\n> ${result.watakHari || '-'}`;

        return { text, card };
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || "Gagal mengambil petung hari baik");
    }
}

// 8. Rejeki Weton (Pal Srigati)
async function rejekiWeton(tgl, bln, thn) {
    const { baseUrl, apiKey } = getApiConfig();
    try {
        const res = await axios.get(`${baseUrl}/primbon/rejekiweton?apikey=${apiKey}&tgl=${tgl}&bln=${bln}&thn=${thn}`, { timeout: 20000 });
        const result = res.data?.result || {};

        const card = await renderPrimbonCard("REJEKI & HOKI WETON", result.hariLahir || `${tgl}/${bln}/${thn}`, "✦ Primbon Pal Srigati ✦", result.ramalan || '-');
        const text = `\`⌜ Primbon Rejeki & Hoki ⌟\`\n> ◦ *Hari Lahir :* ${result.hariLahir || `${tgl}/${bln}/${thn}`}\n\n*Ramalan Rejeki (Pal Srigati) :*\n${result.ramalan || '-'}`;

        return { text, card };
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || "Gagal mengambil ramalan rejeki");
    }
}

// 9. Ramalan Zodiak
async function ramalanZodiak(zodiakName) {
    const { baseUrl, apiKey } = getApiConfig();
    try {
        const res = await axios.get(`${baseUrl}/primbon/zodiak?apikey=${apiKey}&zodiak=${encodeURIComponent(zodiakName)}`, { timeout: 20000 });
        const result = res.data?.result || {};
        const zodiak = result.zodiak || zodiakName.toUpperCase();
        const ramalan = result.ramalan || 'Ramalan zodiak tidak ditemukan.';

        const cardSummary = ramalan.slice(0, 350).replace(/\n/g, ' ').trim();
        const card = await renderPrimbonCard("RAMALAN ZODIAK BULAN INI", zodiak, "✦ Astrologi Barat ✦", cardSummary);
        const text = `\`⌜ Ramalan Zodiak Bulan Ini ⌟\`\n> ◦ *Zodiak :* ${zodiak}\n\n${ramalan}`;

        return { text, card };
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || "Gagal mengambil ramalan zodiak");
    }
}

// 10. Astrologi Shio
async function ramalanShio(year) {
    const { baseUrl, apiKey } = getApiConfig();
    try {
        const res = await axios.get(`${baseUrl}/primbon/shio?apikey=${apiKey}&tahun=${year}`, { timeout: 20000 });
        const result = res.data?.result || {};

        const card = await renderPrimbonCard("ASTROLOGI SHIO TIONGHOA", `Shio ${result.shio} (${result.unsur})`, `✦ Tahun Kelahiran : ${result.tahun} ✦`, result.karakter || '-');
        const text = `\`⌜ Astrologi Shio Tionghoa ⌟\`
> ◦ *Tahun Lahir :* ${result.tahun}
> ◦ *Shio :* ${result.shio}
> ◦ *Elemen Unsur :* ${result.unsur}

*Karakter & Sifat Shio :*
${result.karakter || '-'}`;

        return { text, card };
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || "Gagal mengambil ramalan shio");
    }
}

// 11. Mystic Life Number
async function angkaTakdir(d, m, y) {
    const { baseUrl, apiKey } = getApiConfig();
    try {
        const res = await axios.get(`${baseUrl}/primbon/angkatakdir?apikey=${apiKey}&tgl=${d}&bln=${m}&thn=${y}`, { timeout: 20000 });
        const result = res.data?.result || {};

        const card = await renderPrimbonCard("MYSTIC LIFE NUMBER", `Angka Takdir : ${result.angkaTakdir}`, `✦ Lahir : ${result.tanggalLahir} ✦`, result.makna || '-');
        const text = `\`⌜ Mystic Life Number (Angka Takdir) ⌟\`
> ◦ *Tanggal Lahir :* ${result.tanggalLahir}
> ◦ *Angka Takdir :* *${result.angkaTakdir}*

*Makna Angka Takdir :*
${result.makna || '-'}`;

        return { text, card };
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || "Gagal mengambil angka takdir");
    }
}

// 12. Tarot Reading
async function tarotReading() {
    const { baseUrl, apiKey } = getApiConfig();
    try {
        const res = await axios.get(`${baseUrl}/primbon/tarot?apikey=${apiKey}`, { timeout: 20000 });
        const result = res.data?.result || {};

        const card = await renderPrimbonCard("RAMALAN KARTU TAROT", result.name || 'Tarot Card', "✦ Major Arcana Reading ✦", result.meaning || '-');
        const text = `\`⌜ Ramalan Kartu Tarot ⌟\`
> ◦ *Kartu Terpilih :* *${result.name || 'Tarot Card'}*

*Makna & Petunjuk Kartu :*
${result.meaning || '-'}`;

        return { text, card };
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || "Gagal membaca kartu tarot");
    }
}

module.exports = {
    renderPrimbonCard,
    artiNama,
    artiMimpi,
    simbolMimpi,
    kecocokanNama,
    wetonJawa,
    ramalanJodoh,
    hariBaik,
    rejekiWeton,
    ramalanZodiak,
    ramalanShio,
    angkaTakdir,
    tarotReading
};
