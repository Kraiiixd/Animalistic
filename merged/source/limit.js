/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require('fs');
const path = require('path');

const dbDir = path.join(process.cwd(), 'library/database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const limitUsagePath = path.join(dbDir, 'limit_usage.json');
const limitConfigPath = path.join(dbDir, 'limit_config.json');
const limitBonusPath = path.join(dbDir, 'limit_bonus.json');
const claimDBPath = path.join(dbDir, 'claim.json');

function safeReadJSON(filePath, fallback) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
            return fallback;
        }
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
        return fallback;
    }
}

function getWIBTime() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 7 * 60 * 60000);
}

function getLimitConfig() {
    return safeReadJSON(limitConfigPath, { defaultLimit: 25, users: {} });
}

function getUserMaxLimit(jid) {
    const cleanJid = (jid || '').split(':')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const config = getLimitConfig();
    const today = getWIBTime().toISOString().split('T')[0];
    let maxLimit = config.defaultLimit || 25;

    if (config.users && config.users[cleanJid]) {
        maxLimit = config.users[cleanJid];
    }

    const claimDB = safeReadJSON(claimDBPath, {});
    if (claimDB[cleanJid] === today) {
        maxLimit += 5;
    }

    const bonusDB = safeReadJSON(limitBonusPath, {});
    if (bonusDB[cleanJid] && bonusDB[cleanJid].date === today) {
        maxLimit += (bonusDB[cleanJid].bonus || 0);
    }

    return maxLimit;
}

function checkLimit(jid, arg2, arg3) {
    let isCreator = false;
    if (typeof arg3 !== 'undefined') {
        isCreator = Boolean(arg2 || arg3);
    } else {
        isCreator = Boolean(arg2);
    }
    if (isCreator) return false;

    const cleanJid = (jid || '').split(':')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const maxLimit = getUserMaxLimit(cleanJid);
    const usageDB = safeReadJSON(limitUsagePath, []);
    const today = getWIBTime().toISOString().split('T')[0];
    const user = usageDB.find(v => v.jid === cleanJid);

    if (!user) return false;
    if (user.date !== today) return false;

    return user.count >= maxLimit;
}

function addLimit(jid, arg2, arg3, amount = 1) {
    let isCreator = false;
    let actualAmount = 1;
    if (typeof arg3 === 'boolean') {
        isCreator = Boolean(arg2 || arg3);
        actualAmount = typeof amount === 'number' ? amount : 1;
    } else {
        isCreator = Boolean(arg2);
        actualAmount = typeof arg3 === 'number' ? arg3 : 1;
    }
    if (isCreator) return;

    const cleanJid = (jid || '').split(':')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const usageDB = safeReadJSON(limitUsagePath, []);
    const today = getWIBTime().toISOString().split('T')[0];
    let user = usageDB.find(v => v.jid === cleanJid);

    if (!user) {
        usageDB.push({ jid: cleanJid, date: today, count: actualAmount });
    } else {
        if (user.date !== today) {
            user.date = today;
            user.count = actualAmount;
        } else {
            user.count += actualAmount;
        }
    }

    fs.writeFileSync(limitUsagePath, JSON.stringify(usageDB, null, 2));
}

function claimLimit(jid) {
    const cleanJid = (jid || '').split(':')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const claimDB = safeReadJSON(claimDBPath, {});
    const today = getWIBTime().toISOString().split('T')[0];

    if (claimDB[cleanJid] === today) {
        return { success: false, message: "Kamu sudah mengklaim bonus limit hari ini!\n> Kuota claim akan di-reset kembali pada jam 00:00 WIB." };
    }

    claimDB[cleanJid] = today;
    fs.writeFileSync(claimDBPath, JSON.stringify(claimDB, null, 2));
    return { success: true, message: "Berhasil mengklaim +5 bonus limit harian!" };
}

function addBonusLimit(jid, amount) {
    const cleanJid = (jid || '').split(':')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const bonusDB = safeReadJSON(limitBonusPath, {});
    const today = getWIBTime().toISOString().split('T')[0];

    if (!bonusDB[cleanJid] || bonusDB[cleanJid].date !== today) {
        bonusDB[cleanJid] = { bonus: 0, date: today };
    }

    bonusDB[cleanJid].bonus += amount;
    fs.writeFileSync(limitBonusPath, JSON.stringify(bonusDB, null, 2));
}

function setUserCustomLimit(jid, amount) {
    const cleanJid = (jid || '').split(':')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const config = getLimitConfig();
    if (!config.users) config.users = {};

    if (amount > 0) {
        config.users[cleanJid] = amount;
    } else {
        delete config.users[cleanJid];
    }

    fs.writeFileSync(limitConfigPath, JSON.stringify(config, null, 2));
}

function setDefaultDailyLimit(amount) {
    const config = getLimitConfig();
    const newLimit = Math.max(1, parseInt(amount) || 25);
    config.defaultLimit = newLimit;
    fs.writeFileSync(limitConfigPath, JSON.stringify(config, null, 2));
    return newLimit;
}

function resetAllLimitUsage() {
    fs.writeFileSync(limitUsagePath, JSON.stringify([], null, 2));
}

function getUserLimitInfo(jid, isCreator) {
    const cleanJid = (jid || '').split(':')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (isCreator) {
        return {
            isOwner: true,
            statusText: 'Owner',
            limitInfo: '∞ Unlimited',
            progressBar: '██████████'
        };
    }

    const maxLimit = getUserMaxLimit(cleanJid);
    const usageDB = safeReadJSON(limitUsagePath, []);
    const today = getWIBTime().toISOString().split('T')[0];
    const userUsage = usageDB.find(u => u.jid === cleanJid && u.date === today)?.count || 0;
    const remaining = Math.max(0, maxLimit - userUsage);

    const claimDB = safeReadJSON(claimDBPath, {});
    const claimStatus = claimDB[cleanJid] === today ? "Sudah" : "Belum";

    const percent = Math.min(100, Math.round((userUsage / maxLimit) * 100));
    const barLength = 10;
    const filled = Math.min(barLength, Math.round((percent / 100) * barLength));
    const empty = barLength - filled;
    const progressBar = '█'.repeat(filled) + '░'.repeat(empty);

    return {
        isOwner: false,
        statusText: 'User',
        maxLimit,
        userUsage,
        remaining,
        claimStatus,
        percent,
        progressBar,
        limitInfo: `${userUsage}/${maxLimit} • Sisa: ${remaining}`
    };
}

module.exports = {
    getWIBTime,
    safeReadJSON,
    getLimitConfig,
    getUserMaxLimit,
    checkLimit,
    addLimit,
    claimLimit,
    addBonusLimit,
    setUserCustomLimit,
    setDefaultDailyLimit,
    resetAllLimitUsage,
    getUserLimitInfo,
    limitUsagePath,
    limitConfigPath,
    limitBonusPath,
    claimDBPath
};
