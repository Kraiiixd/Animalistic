/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require('fs');
const path = require('path');

const afkFilePath = path.join(__dirname, '../library/database/afk.json');

function loadAfkData() {
    try {
        if (!fs.existsSync(afkFilePath)) {
            fs.writeFileSync(afkFilePath, JSON.stringify({}));
            return {};
        }
        return JSON.parse(fs.readFileSync(afkFilePath, 'utf8'));
    } catch (e) {
        return {};
    }
}

function saveAfkData(data) {
    try {
        fs.writeFileSync(afkFilePath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('[AFK Save Error]', e.message);
    }
}

function setAfk(userJid, reason = 'Tanpa Alasan') {
    const afkData = loadAfkData();
    afkData[userJid] = {
        reason: reason.trim() || 'Tanpa Alasan',
        time: Date.now()
    };
    saveAfkData(afkData);
    return afkData[userJid];
}

function getAfk(userJid) {
    const afkData = loadAfkData();
    return afkData[userJid] || null;
}

function removeAfk(userJid) {
    const afkData = loadAfkData();
    if (afkData[userJid]) {
        const previousData = { ...afkData[userJid] };
        delete afkData[userJid];
        saveAfkData(afkData);
        return previousData;
    }
    return null;
}

function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days} Hari`);
    if (hours > 0) parts.push(`${hours} Jam`);
    if (minutes > 0) parts.push(`${minutes} Menit`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} Detik`);

    return parts.join(' ');
}

module.exports = {
    setAfk,
    getAfk,
    removeAfk,
    formatDuration
};
