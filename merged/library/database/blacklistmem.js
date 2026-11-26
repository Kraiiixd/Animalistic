/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'blacklistmem.json');

function ensureDB() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ blacklist: [], details: {} }, null, 2), 'utf8');
    }
}

function loadBlacklistDB() {
    ensureDB();
    try {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        const data = raw ? JSON.parse(raw) : { blacklist: [], details: {} };
        if (!Array.isArray(data.blacklist)) data.blacklist = [];
        if (!data.details || typeof data.details !== 'object' || Array.isArray(data.details)) data.details = {};
        return data;
    } catch (e) {
        return { blacklist: [], details: {} };
    }
}

function saveBlacklistDB(data) {
    ensureDB();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function normalizeJid(raw) {
    raw = String(raw || '').trim();
    if (!raw) return '';

    if (raw.includes('@')) {
        return raw.replace(/:\d+@/, '@');
    }

    let num = raw.replace(/\D/g, '');
    if (!num) return '';
    if (num.startsWith('0')) num = '62' + num.slice(1);
    return `${num}@s.whatsapp.net`;
}

function addBlacklist(jidRaw, opts = {}) {
    const jid = normalizeJid(jidRaw);
    if (!jid) return { ok: false, msg: 'Nomor / JID tidak valid.' };

    const db = loadBlacklistDB();
    const reason = opts.reason || opts.alasan || 'Melanggar aturan owner';
    const dateStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB';
    const timestamp = Date.now();

    const isNew = !db.blacklist.includes(jid);
    if (isNew) {
        db.blacklist.push(jid);
    }

    db.details[jid] = {
        reason: reason,
        addedAt: dateStr,
        timestamp: timestamp,
        source: opts.source || 'manual',
        lastMessage: opts.lastMessage || opts.pesan || '',
        name: opts.name || opts.nama || ''
    };

    saveBlacklistDB(db);
    return { ok: true, jid, isNew, detail: db.details[jid] };
}

function removeBlacklist(jidRaw) {
    const jid = normalizeJid(jidRaw);
    if (!jid) return { ok: false, msg: 'Nomor / JID tidak valid.' };

    const db = loadBlacklistDB();
    if (!db.blacklist.includes(jid)) {
        return { ok: false, msg: 'Nomor tersebut tidak ada di blacklist.', jid };
    }

    db.blacklist = db.blacklist.filter(j => j !== jid);
    if (db.details && db.details[jid]) {
        delete db.details[jid];
    }
    saveBlacklistDB(db);
    return { ok: true, jid };
}

function isBlacklisted(jidRaw) {
    const jid = normalizeJid(jidRaw);
    if (!jid) return false;
    const db = loadBlacklistDB();
    return db.blacklist.includes(jid);
}

function getBlacklistDetail(jidRaw) {
    const jid = normalizeJid(jidRaw);
    if (!jid) return null;
    const db = loadBlacklistDB();
    return db.details ? db.details[jid] || null : null;
}

function listBlacklist() {
    const db = loadBlacklistDB();
    return db.blacklist;
}

function listBlacklistWithDetails() {
    const db = loadBlacklistDB();
    return db.blacklist.map(jid => ({
        jid,
        ...(db.details ? db.details[jid] || {} : {})
    }));
}

module.exports = {
    normalizeJid,
    addBlacklist,
    removeBlacklist,
    isBlacklisted,
    getBlacklistDetail,
    listBlacklist,
    listBlacklistWithDetails
};
