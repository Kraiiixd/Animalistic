/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

let createCanvas;
try {
    const c = require('@napi-rs/canvas');
    createCanvas = c.createCanvas;
} catch (_) {
    const c = require('canvas');
    createCanvas = c.createCanvas;
}

const WIDTH = 720;
const HEIGHT = 480;

const THEMES = [
    { bgFrom: '#1a1a1a', bgTo: '#0d0d0d', border: '#444444', title: '#f0f0f0', text: '#e6e6e6', label: '#a8a8a8', accent: '#2ecc71', pillBg: '#2a2a2a', pillText: '#f0f0f0' }
];

function pickRandomTheme() {
    return THEMES[0];
}

function maskEmail(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) return email || '-';
    const [local, domain] = email.split('@');
    const visible = local.slice(0, 2);
    const stars = '*'.repeat(Math.max(6, local.length - visible.length > 0 ? 6 : 4));
    return `${visible}${stars}@${domain}`;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text).split(' ');
    let line = '';
    let curY = y;
    for (let i = 0; i < words.length; i++) {
        const testLine = line ? `${line} ${words[i]}` : words[i];
        if (ctx.measureText(testLine).width > maxWidth && line) {
            ctx.fillText(line, x, curY);
            line = words[i];
            curY += lineHeight;
        } else {
            line = testLine;
        }
    }
    if (line) {
        ctx.fillText(line, x, curY);
        curY += lineHeight;
    }
    return curY;
}

function generateAmPremiumCard(ev) {
    const theme = pickRandomTheme();

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    bg.addColorStop(0, theme.bgFrom);
    bg.addColorStop(1, theme.bgTo);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const pad = 18;
    roundRect(ctx, pad, pad, WIDTH - pad * 2, HEIGHT - pad * 2, 22);
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const contentX = 40;
    let cursorY = 62;

    ctx.fillStyle = theme.title;
    ctx.font = 'bold 13px sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('✦  AKUN BERHASIL PREMIUM  ✦', contentX, cursorY);
    cursorY += 30;

    ctx.fillStyle = theme.text;
    ctx.font = 'bold 26px sans-serif';
    cursorY = drawWrappedText(ctx, ev.product || 'Alight Motion Premium 1 Tahun', contentX, cursorY, WIDTH - contentX * 2, 32);
    cursorY += 14;

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(contentX, cursorY);
    ctx.lineTo(WIDTH - contentX, cursorY);
    ctx.stroke();
    cursorY += 34;

    const rows = [
        { label: 'Pembeli', value: ev.buyer || '-' },
        { label: 'Waktu Order', value: ev.orderTime || '-' },
        { label: 'Email', value: maskEmail(ev.email) },
        { label: 'Harga', value: ev.price || 'Free' },
        { label: 'Metode', value: ev.method || 'database' },
        { label: 'Status', value: ev.status || 'Sukses / Selesai', accent: true }
    ];

    const labelX = contentX;
    const colonX = contentX + 150;
    const valueX = contentX + 168;
    const rowGap = 40;

    rows.forEach((row) => {
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = theme.label;
        ctx.fillText(row.label, labelX, cursorY);
        ctx.fillText(':', colonX, cursorY);

        ctx.font = row.accent ? 'bold 15px sans-serif' : '15px sans-serif';
        ctx.fillStyle = row.accent ? theme.accent : theme.text;
        ctx.fillText(String(row.value), valueX, cursorY);

        cursorY += rowGap;
    });

    const badgeText = 'AM PREMIUM';
    ctx.font = 'bold 12px sans-serif';
    const textWidth = ctx.measureText(badgeText).width;
    const pillW = textWidth + 28;
    const pillH = 26;
    const pillX = contentX;
    const pillY = HEIGHT - pad - 56;
    roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle = theme.pillBg;
    ctx.fill();
    ctx.fillStyle = theme.pillText;
    ctx.fillText(badgeText, pillX + 14, pillY + 17);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(global.botname || 'Yonz Official', contentX, HEIGHT - pad - 16);

    return canvas.toBuffer('image/png');
}

module.exports = { generateAmPremiumCard };
