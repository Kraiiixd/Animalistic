/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

/*
 * Sistem Kontrol Akses Fitur Dinamis:
 * - owner    : Khusus Owner bot
 * - premium  : Khusus user Premium (dan Owner)
 * - free     : Bebas untuk semua pengguna
 * - request  : Mengunci fitur & mewajibkan izin/request ke Owner
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../library/database/feature_access.json');

function ensureDirSync(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function loadData() {
    try {
        ensureDirSync(path.dirname(DB_PATH));
        if (fs.existsSync(DB_PATH)) {
            const raw = fs.readFileSync(DB_PATH, 'utf8');
            const data = JSON.parse(raw);
            if (!data.features) data.features = {};
            if (!data.grantedUsers) data.grantedUsers = {};
            if (!data.pendingRequests) data.pendingRequests = {};
            return data;
        }
    } catch (e) {
        console.error('[FeatureAccess] Error loading DB:', e.message);
    }

    // Default: Jadibot dibuat khusus owner
    const defaultData = {
        features: {
            jadibot: 'owner',
            bataljadibot: 'owner',
            stopjadibot: 'owner',
            listjadibot: 'owner'
        },
        grantedUsers: {},
        pendingRequests: {}
    };
    saveData(defaultData);
    return defaultData;
}

function saveData(data) {
    try {
        ensureDirSync(path.dirname(DB_PATH));
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('[FeatureAccess] Error saving DB:', e.message);
        return false;
    }
}

// Normalisasi level
function normalizeLevel(level) {
    if (!level) return null;
    const l = String(level).trim().toLowerCase().replace(/[^a-z0-9+ ]/g, ' ');
    // Prioritaskan cek premium / vip jika ada kata prem/vip (termasuk "premium + owner", "pengguna premium + owner")
    if (l.includes('prem') || l.includes('vip')) return 'premium';
    if (l.includes('owner') || l.includes('own') || l.includes('creator') || l.includes('developer')) return 'owner';
    if (l.includes('free') || l.includes('gratis') || l.includes('public') || l.includes('all') || l.includes('semua') || l.includes('biasa')) return 'free';
    if (l.includes('req') || l.includes('minta') || l.includes('izin') || l.includes('lock') || l.includes('kunci')) return 'request';
    return null;
}

function getFeatureLevel(command) {
    if (!command) return null;
    const data = loadData();
    const cmd = String(command).trim().toLowerCase();
    return data.features[cmd] || null;
}

function setFeatureLevel(command, level) {
    const norm = normalizeLevel(level);
    if (!norm) return { ok: false, message: 'Level tidak valid. Pilihan: owner, premium, free, request' };
    const data = loadData();
    const cmd = String(command).trim().toLowerCase();
    data.features[cmd] = norm;
    saveData(data);
    return { ok: true, command: cmd, level: norm };
}

function removeFeatureLevel(command) {
    const data = loadData();
    const cmd = String(command).trim().toLowerCase();
    if (data.features[cmd]) {
        delete data.features[cmd];
        saveData(data);
        return true;
    }
    return false;
}

function getAllFeatures() {
    const data = loadData();
    return data.features || {};
}

function grantUserAccess(command, userJid) {
    const data = loadData();
    const cmd = String(command).trim().toLowerCase();
    const jid = String(userJid).trim();
    if (!data.grantedUsers[cmd]) data.grantedUsers[cmd] = [];
    if (!data.grantedUsers[cmd].includes(jid)) {
        data.grantedUsers[cmd].push(jid);
    }
    // Hapus dari pending request jika ada
    const reqKey = `${jid}:${cmd}`;
    if (data.pendingRequests && data.pendingRequests[reqKey]) {
        delete data.pendingRequests[reqKey];
    }
    saveData(data);
    return true;
}

function revokeUserAccess(command, userJid) {
    const data = loadData();
    const cmd = String(command).trim().toLowerCase();
    const jid = String(userJid).trim();
    if (data.grantedUsers[cmd]) {
        data.grantedUsers[cmd] = data.grantedUsers[cmd].filter(j => j !== jid);
        saveData(data);
        return true;
    }
    return false;
}

function hasUserGrantedAccess(command, userJid) {
    const data = loadData();
    const cmd = String(command).trim().toLowerCase();
    const jid = String(userJid).trim();
    const list = data.grantedUsers[cmd] || [];
    return list.some(j => j === jid || j.replace(/[^0-9]/g, '') === jid.replace(/[^0-9]/g, ''));
}

function savePendingRequest(command, userJid, pushName = 'User') {
    const data = loadData();
    const cmd = String(command).trim().toLowerCase();
    const jid = String(userJid).trim();
    const reqKey = `${jid}:${cmd}`;
    if (!data.pendingRequests) data.pendingRequests = {};
    data.pendingRequests[reqKey] = {
        jid,
        command: cmd,
        pushName,
        createdAt: Date.now()
    };
    saveData(data);
    return true;
}

function removePendingRequest(command, userJid) {
    const data = loadData();
    const cmd = String(command).trim().toLowerCase();
    const jid = String(userJid).trim();
    const reqKey = `${jid}:${cmd}`;
    if (data.pendingRequests && data.pendingRequests[reqKey]) {
        delete data.pendingRequests[reqKey];
        saveData(data);
        return true;
    }
    return false;
}

function getPendingRequests() {
    const data = loadData();
    return data.pendingRequests || {};
}

// Daftar command yang dikecualikan dari pemblokiran otomatis
const EXEMPT_COMMANDS = new Set([
    'setakses', 'setaccess', 'aksesfitur', 'setfitur', 'modefitur',
    'delakses', 'resetakses', 'hapusakses',
    'listakses', 'cekakses', 'listaccess', 'fiturakses',
    'accakses', 'grantakses', 'accfitur', 'terimaakses',
    'tolakakses', 'rejectakses',
    'cabutakses', 'revokeakses', 'cabutfitur',
    'reqakses', 'mintaakses', 'requestakses',
    'menu', 'help', 'allmenu', 'owner'
]);

function checkAccess(command, userJid, isCreator, isPremium) {
    if (!command) return { allowed: true };
    const cmd = String(command).trim().toLowerCase();

    // Owner selalu punya akses ke semua fitur
    if (isCreator) return { allowed: true };

    // Command sistem akses tidak dicegah di sini
    if (EXEMPT_COMMANDS.has(cmd)) return { allowed: true };

    const level = getFeatureLevel(cmd);
    if (!level) {
        // Belum diatur kustom, izinkan lewat (mengikuti aturan bawaan script)
        return { allowed: true };
    }

    if (level === 'free') {
        return { allowed: true };
    }

    if (level === 'owner') {
        return {
            allowed: false,
            level: 'owner',
            message: global.mess?.owner || `\`⌜ ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ ⌟\`\n> ◦ sᴛᴀᴛᴜs : *ᴋʜᴜsᴜs ᴏᴡɴᴇʀ*\n> ◦ ɪɴғᴏ : ғɪᴛᴜʀ *${cmd}* ʜᴀɴʏᴀ ᴛᴇʀsᴇᴅɪᴀ ᴜɴᴛᴜᴋ *Owner Bot*`
        };
    }

    if (level === 'premium') {
        if (isPremium) return { allowed: true };
        return {
            allowed: false,
            level: 'premium',
            message: global.mess?.prem || `\`⌜ ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ ⌟\`\n> ◦ sᴛᴀᴛᴜs : *ᴋʜᴜsᴜs ᴘʀᴇᴍɪᴜᴍ*\n> ◦ ɪɴғᴏ : ғɪᴛᴜʀ *${cmd}* ʜᴀɴʏᴀ ᴛᴇʀsᴇᴅɪᴀ ᴜɴᴛᴜᴋ *User Premium*\n> ◦ sᴏʟᴜsɪ : ᴋᴇᴛɪᴋ *.prem* ᴜɴᴛᴜᴋ ɪɴғᴏʀᴍᴀsɪ ᴜᴘɢʀᴀᴅᴇ`
        };
    }

    if (level === 'request') {
        if (hasUserGrantedAccess(cmd, userJid)) {
            return { allowed: true };
        }
        return {
            allowed: false,
            level: 'request',
            message: `\`⌜ ᴀᴋsᴇs ᴅɪʙᴀᴛᴀsɪ ⌟\`\n> ◦ sᴛᴀᴛᴜs : *ᴍᴇᴍᴇʀʟᴜᴋᴀɴ ɪᴢɪɴ ᴏᴡɴᴇʀ*\n> ◦ ғɪᴛᴜʀ : *${cmd}*\n> ◦ ɪɴғᴏ : ғɪᴛᴜʀ ɪɴɪ ᴅɪᴋᴜɴᴄɪ ᴅᴀɴ ʜᴀɴʏᴀ ʙɪsᴀ ᴅɪᴀᴋsᴇs sᴇᴛᴇʟᴀʜ ᴅɪsᴇᴛᴜᴊᴜɪ ᴏᴡɴᴇʀ.\n> ◦ ᴄᴀʀᴀ ᴍɪɴᴛᴀ ᴀᴋsᴇs : ᴋᴇᴛɪᴋ *.reqakses ${cmd}* ᴜɴᴛᴜᴋ ᴍᴇɴɢɪʀɪᴍ ᴘᴇʀᴍɪɴᴛᴀᴀɴ ᴋᴇ ᴏᴡɴᴇʀ.`
        };
    }

    return { allowed: true };
}

module.exports = {
    loadData,
    saveData,
    normalizeLevel,
    getFeatureLevel,
    setFeatureLevel,
    removeFeatureLevel,
    getAllFeatures,
    grantUserAccess,
    revokeUserAccess,
    hasUserGrantedAccess,
    savePendingRequest,
    removePendingRequest,
    getPendingRequests,
    checkAccess
};
