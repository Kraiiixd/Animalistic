/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'reseller.json');
const DAY_MS = 24 * 60 * 60 * 1000;

function ensureDB() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '[]', 'utf8');
}

function loadResellerDB() {
    ensureDB();
    try {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        const data = raw ? JSON.parse(raw) : [];
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

function saveResellerDB(data) {
    ensureDB();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function normalizeJid(jid) {
    jid = String(jid || '').trim();
    if (!jid) return '';
    if (jid.includes('@')) return jid;
    const num = jid.replace(/\D/g, '');
    if (!num) return '';
    return `${num}@s.whatsapp.net`;
}

function addReseller(jid, opts = {}) {
    jid = normalizeJid(jid);
    if (!jid) return { ok: false, msg: 'JID / nomor tidak valid.' };

    const db = loadResellerDB();
    const idx = db.findIndex(r => r.jid === jid);
    const days = Number(opts.days) > 0 ? Number(opts.days) : 0;

    let expired = 0; 
    if (days > 0) {
        const now = Date.now();
        const base = idx >= 0 && db[idx].expired > now ? db[idx].expired : now;
        expired = base + days * DAY_MS;
    }

    const entry = {
        jid,
        name: opts.name || (idx >= 0 ? db[idx].name : jid.split('@')[0]),
        addedAt: idx >= 0 ? db[idx].addedAt : Date.now(),
        addedBy: opts.addedBy || (idx >= 0 ? db[idx].addedBy : null),
        expired,
        quota: {
            saldo: idx >= 0 ? (db[idx].quota?.saldo || 0) : Number(opts.saldo || 0)
        },
        totalCreated: idx >= 0 ? (db[idx].totalCreated || 0) : 0,
        active: true
    };

    if (idx >= 0) db[idx] = { ...db[idx], ...entry };
    else db.push(entry);

    saveResellerDB(db);
    return { ok: true, entry };
}

function removeReseller(jid) {
    jid = normalizeJid(jid);
    const db = loadResellerDB();
    const idx = db.findIndex(r => r.jid === jid);
    if (idx === -1) return { ok: false, msg: 'Reseller tidak ditemukan.' };
    const [removed] = db.splice(idx, 1);
    saveResellerDB(db);
    return { ok: true, entry: removed };
}

function getReseller(jid) {
    jid = normalizeJid(jid);
    const db = loadResellerDB();
    return db.find(r => r.jid === jid) || null;
}

function isReseller(jid) {
    const entry = getReseller(jid);
    if (!entry || entry.active === false) return false;
    if (entry.expired && entry.expired > 0 && entry.expired < Date.now()) return false;
    return true;
}

function listResellers() {
    return loadResellerDB();
}

function daysLeft(jid) {
    const entry = getReseller(jid);
    if (!entry) return 0;
    if (!entry.expired || entry.expired === 0) return Infinity; // lifetime
    return Math.ceil((entry.expired - Date.now()) / DAY_MS);
}

function addSaldo(jid, amount) {
    jid = normalizeJid(jid);
    const db = loadResellerDB();
    const idx = db.findIndex(r => r.jid === jid);
    if (idx === -1) return { ok: false, msg: 'Reseller tidak ditemukan.' };
    db[idx].quota = db[idx].quota || { saldo: 0 };
    db[idx].quota.saldo = (db[idx].quota.saldo || 0) + Number(amount || 0);
    saveResellerDB(db);
    return { ok: true, saldo: db[idx].quota.saldo };
}

function reduceSaldo(jid, amount) {
    jid = normalizeJid(jid);
    const db = loadResellerDB();
    const idx = db.findIndex(r => r.jid === jid);
    if (idx === -1) return { ok: false, msg: 'Reseller tidak ditemukan.' };
    const saldo = (db[idx].quota && db[idx].quota.saldo) || 0;
    const amt = Number(amount || 0);
    if (saldo < amt) return { ok: false, msg: 'Saldo reseller tidak mencukupi.' };
    db[idx].quota.saldo = saldo - amt;
    saveResellerDB(db);
    return { ok: true, saldo: db[idx].quota.saldo };
}

function incrementCreated(jid) {
    jid = normalizeJid(jid);
    const db = loadResellerDB();
    const idx = db.findIndex(r => r.jid === jid);
    if (idx === -1) return;
    db[idx].totalCreated = (db[idx].totalCreated || 0) + 1;
    saveResellerDB(db);
}

global.isReseller = isReseller;

module.exports = {
    DB_PATH,
    loadResellerDB,
    saveResellerDB,
    addReseller,
    removeReseller,
    getReseller,
    isReseller,
    listResellers,
    daysLeft,
    addSaldo,
    reduceSaldo,
    incrementCreated,
    normalizeJid
};
