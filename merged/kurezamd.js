/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

/**

 SC BOT : HITOSHI MD V1
 VERSION : 1.3

**/

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

require('./settings');
try {
    delete require.cache[require.resolve('./source/menu-shore')];
    require('./source/menu-shore');
} catch (e) {
    require('./source/menu-shore');
}
const fs = require('fs');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');
const chalk = require('chalk');
const moment = require("moment-timezone");
const axios = require("axios");
const { gamesConfig, startGame, handleGameAnswer } = require('./source/game');
const { getBratBuffer, getBratVidBuffer, renderBratCanvas, renderBratHD, renderBratGura, renderBratAnime } = require('./source/brat');
const {
    checkLimit,
    addLimit,
    claimLimit,
    addBonusLimit,
    setUserCustomLimit,
    setDefaultDailyLimit,
    getLimitConfig,
    resetAllLimitUsage,
    getUserLimitInfo
} = require('./source/limit');
const primbon = require('./source/primbon');
const { upscaleImage, removeBackground } = require('./source/scrape-iLoveIMG');
const { downloadCapcut } = require('./source/capcut');
const { downloadFacebook } = require('./source/facebook');
const { downloadSpotify } = require('./source/spotify');
const { setAfk } = require('./source/afk');
const { toVideo, toAudio, toPTT } = require('./library/converter');
const { addPremiumUser, delPremiumUser, isPremiumUser, getPremiumList, formatRemainingTime } = require('./source/premium');

// baileys-mbuilder (sama seperti Hitoshi MD V1 new update v12) — carousel, toolkit, button, button v2, rich message (AIRich)
// ESM package di-load lewat require() native Node (type:"module" di package.json-nya), butuh Node 20.19+/22+.
const { Toolkit, Button, ButtonV2, Carousel, AIRich } = require('./library/baileys-mbuilder/index');
const more = String.fromCharCode(8206);
const readmore = more.repeat(4800)
const { LoadDataBase } = require('./myfunct/message');
const loadOwners = () => {
    try {
        const ownerFile = "./library/database/owner.json";
        if (!fs.existsSync(ownerFile)) fs.writeFileSync(ownerFile, '[]');
        return JSON.parse(fs.readFileSync(ownerFile));
    } catch {
        return [];
    }
};



const resolveTargetNumber = (raw, m) => {
    if (!raw) return '';
    let clean = String(raw).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    if (!clean) return '';
    if (global.lidMap && global.lidMap[clean]) {
        return global.lidMap[clean];
    }
    if (m?.metadata?.participants) {
        for (const p of m.metadata.participants) {
            const fields = [p.id, p.jid, p.lid, p.phoneNumber].filter(Boolean).map(x => String(x).split('@')[0].split(':')[0].replace(/[^0-9]/g, ''));
            if (fields.includes(clean)) {
                for (const f of [p.jid, p.id, p.phoneNumber, p.lid].filter(Boolean)) {
                    const str = String(f);
                    if (str.includes('@s.whatsapp.net')) {
                        const phone = str.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                        if (phone) {
                            if (global.lidMap) global.lidMap[clean] = phone;
                            return phone;
                        }
                    }
                }
                for (const f of [p.jid, p.id, p.phoneNumber, p.lid].filter(Boolean)) {
                    const str = String(f);
                    if (!str.includes('@lid')) {
                        const phone = str.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                        if (phone && phone !== clean) {
                            if (global.lidMap) global.lidMap[clean] = phone;
                            return phone;
                        }
                    }
                }
            }
        }
    }
    return clean;
};



const pathList = './library/database/lists.json';
if (!fs.existsSync(pathList)) {
  fs.writeFileSync(pathList, JSON.stringify({}));
}
function loadLists() {
  try {
    return JSON.parse(fs.readFileSync(pathList));
  } catch (e) {
    fs.writeFileSync(pathList, JSON.stringify({}));
    return {};
  }
}

function saveLists(data) {
  fs.writeFileSync(pathList, JSON.stringify(data, null, 2));
}

const listSettingsPath = './library/database/list_settings.json';

function loadListSettings() {
    try {
        if (fs.existsSync(listSettingsPath)) {
            return JSON.parse(fs.readFileSync(listSettingsPath, 'utf8'));
        }
        return {};
    } catch (e) {
        return {};
    }
}

function saveListSettings(data) {
    fs.writeFileSync(listSettingsPath, JSON.stringify(data, null, 2));
}

const pathDone = './library/database/done.json';
if (!fs.existsSync(pathDone)) {
  fs.writeFileSync(pathDone, JSON.stringify({}));
}
const pathProses = './library/database/proses.json';
if (!fs.existsSync(pathProses)) {
  fs.writeFileSync(pathProses, JSON.stringify({}));
}

function loadDoneMessages() {
  try {
    return JSON.parse(fs.readFileSync(pathDone));
  } catch (e) {
    fs.writeFileSync(pathDone, JSON.stringify({}));
    return {};
  }
}

function saveDoneMessages(data) {
  fs.writeFileSync(pathDone, JSON.stringify(data, null, 2));
}

function loadProsesMessages() {
  try {
    return JSON.parse(fs.readFileSync(pathProses));
  } catch (e) {
    fs.writeFileSync(pathProses, JSON.stringify({}));
    return {};
  }
}

function saveProsesMessages(data) {
  fs.writeFileSync(pathProses, JSON.stringify(data, null, 2));
}

const defaultProsesTemplate = `ㅤㅤㅤㅤㅤㅤ𝗌𝖾𝗋𝖾𝗇𝗂𝗍𝗒  𝗈𝒇  𝖺𝗎𝗍𝗎𝗆𝗇
.                    ⢀⣴⣾ ㅤ𖹭.   ”   𖹭.
    ⢶⣶⡶⡴⢦⣼⣟⣻⣿ㅤㅤㅤ秋天
      ⠙⣿⡳⣋⡿⣦⡲⣺ㅤ *@group──𝗌𝗁𝗈𝗉*
         ⠸⣼⣸⠟ㅤ ֹ  ⃘🍁.ㅤㅤㅤㅤ𝟢𝟦/𝟥!

ㅤ𝘤𝘰𝘻𝘺 ╮  ..  𝘥𝘢𝘺𝗌:  -𝖿𝖺𝗅𝗅  ，琥珀色 
ㅤ🧺*.ㅤ𝗒𝗈𝗎  𝗉𝗎𝗋𝖼𝗁𝖺𝗌𝖾  𝖽𝖺𝗍𝖺ㅤ¿?*

ㅤㅤㅤ  𖹠.ㅤ 𝖼𝗎𝗌𝗍ㅤ⦂ㅤ@user
ㅤㅤㅤ  𖹠.ㅤ 𝗂𝗍𝖾𝗆ㅤ⦂ㅤ@item

ㅤㅤㅤ  𝗁𝖺𝗌  𝖻𝖾𝖾𝗇  ° .  *𝗉𝗋𝗈𝖼𝖾𝗌𝗌*
ㅤ꒰  舒适:  ꒱  𝖽𝗈𝗇'𝗍  𝗌𝗉𝖺𝗆  𝗈𝗐𝗇 !`;

const defaultDoneTemplate = `ㅤㅤㅤㅤㅤㅤ𝗌𝖾𝗋𝖾𝗇𝗂𝗍𝗒  𝗈𝒇  𝖺𝗎𝗍𝗎𝗆𝗇
.                    ⢀⣴⣾ ㅤ𖹭.   ”   𖹭.
    ⢶⣶⡶⡴⢦⣼⣟⣻⣿ㅤㅤㅤ秋天
      ⠙⣿⡳⣋⡿⣦⡲⣺ㅤ *@group──𝗌𝗁𝗈𝗉*
         ⠸⣼⣸⠟ㅤ ֹ  ⃘🍁.ㅤㅤㅤㅤ𝟢𝟦/𝟥!

ㅤ𝘤𝘰𝘻𝘺 ╮  ..  𝘥𝘢𝘺𝗌:  -𝖿𝖺𝗅𝗅  ，琥珀色 
ㅤ🧺*.ㅤ𝗒𝗈𝗎  𝗉𝗎𝗋𝖼𝗁𝖺𝗌𝖾  𝖽𝖺𝗍𝖺ㅤ¿?*

ㅤㅤㅤ  𖹠.ㅤ 𝖼𝗎𝗌𝗍ㅤ⦂ㅤ@user
ㅤㅤㅤ  𖹠.ㅤ 𝗂𝗍𝖾𝗆ㅤ⦂ㅤ@item

ㅤㅤㅤ  𝗁𝖺𝗌  𝖻𝖾𝖾𝗇  ° .  *𝗌𝗎𝖼𝖼𝖾𝗌𝗌*
ㅤ꒰  舒适:  ꒱  𝗍𝗁𝗑  𝖿𝗈𝗋  𝗈𝗋𝖽𝖾𝗋𝗂𝗇𝗀  !`;

function generateResponseWithMentions(template, item = "", quotedMessage = null, metadata = null) {
    const now = new Date();
    const wibTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const tanggal = `${dayNames[wibTime.getDay()]}, ${wibTime.getDate()} ${monthNames[wibTime.getMonth()]} ${wibTime.getFullYear()}`;
    const jam = `${String(wibTime.getHours()).padStart(2, '0')}:${String(wibTime.getMinutes()).padStart(2, '0')}:${String(wibTime.getSeconds()).padStart(2, '0')}`;

    let mentions = [];
    let userText = "User";
    let userJid = null;

    if (quotedMessage) {
        userJid = quotedMessage.sender;
        if (userJid && userJid.endsWith('@lid') && metadata && metadata.participants) {
            const participant = metadata.participants.find(p => p.lid === userJid || p.id === userJid);
            if (participant) {
                userJid = participant.jid;
            } else {
                userJid = userJid.replace('@lid', '@s.whatsapp.net');
            }
        }
        if (userJid) {
            mentions = [userJid];
            userText = `@${userJid.split('@')[0]}`;
        }
    }

    let status = (template.includes("SELESAI") || template.includes("BERHASIL") || template.includes("✅") || template.includes("𝗌𝗎𝖼𝖼𝖾𝗌𝗌") || /success/i.test(template)) ? "Selesai" : "Proses";
    const groupName = metadata?.subject || metadata?.name || "Group";

    let response = template
        .replace(/(@tanggal|\{tanggal\})/gi, tanggal)
        .replace(/(@jam|\{jam\})/gi, jam)
        .replace(/(@status|\{status\})/gi, status)
        .replace(/(@item|\{item\})/gi, item || "Produk")
        .replace(/(@user|\{user\})/gi, userText)
        .replace(/(@group(name)?|\{group(name)?\})/gi, groupName);

    return {
        text: response,
        mentions: mentions
    };
}

const SMALL_CAPS_MAP = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ',
    k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ',
    u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
};

function toSmallCaps(str) {
    return String(str).toLowerCase().split('').map(ch => SMALL_CAPS_MAP[ch] || ch).join('');
}

const defaultListTemplate = `ㅤ        𝗐α𝗋𝗆ㅤ  𝖼𝗂𝗇𝗇α𝗆𝗈𝗇ㅤ  𝗅α𝗍𝗍𝖾𝗌   
ㅤ          ¡𝖼𝗁α𝗌𝗂𝗇𝗀    🍁 ⁺ִ    α𝗎𝗍𝗎𝗆𝗇       
ㅤ                ⢠⣄     ㅤ    • ──────── •
                 ⣸⠋⡜⣇     𝟣𝟫𝟫𝟧'𝗌     ⊂⊃  ˖ ֹ    ☘︎       
           ⣗⡒⠿⢰⡇⠼⢒⢺⠇   𝗆α𝗉𝗅𝖾   𝖻𝗋𝖾𝖾𝗓𝖾       
           ⢙⡮⣳⣾⣷⣝⢡  𝖼𝖺𝗍𝖺𝗅𝗈𝗀𝗎𝖾¿   𝗉𝗋𝗈𝖽𝗎𝖼𝗍   
           ⠈⠙⠒⢺⡗⠒⠚⠉ 𑄝.   𝒅𝒊𝒆𝒛𝒚   𝒄𝒍𝒖𝒕𝒄𝒉        
                    ⠈⠁
ㅤ        ╭ 𖹠 ֵ   𝖽α𝗍𝖾  ⦂  @date
ㅤ        │🍁.  𝗁α𝗅𝗅𝗈!  @user
ㅤ        ╰ 𖹠 ֵ   𝗍𝗂𝗆𝖾  ⦂  @time

ㅤ               :𝗌𝖾α𝗌𝗈𝗇𝗌，  𝖼𝗁𝖾𝖼𝗄    𝗉𝗋𝗈𝖽𝗎𝖼𝗍!
ㅤ          𝗌    ⎋  ׅ ݊    𝗍𝗒𝗉𝖾    𝗌𝖾𝗌𝗎𝖺𝗂   𝗄𝖾𝗒𝗐𝗈𝗋𝖽
ㅤ  ㅤ  ╭╰𑩑࡙╯ ──────────────︥─࡙ •
@x
ㅤ  ㅤ  ╰   🍁.   ¡𝟨𝟩     ▸   𝗀𝗈𝗅𝖽𝖾𝗇 ݁    𝗇𝗈𝗍𝖾.
ㅤ  ㅤ    ⓘ.   𝗍𝖺𝗇𝗒𝖺 𝗌𝗍𝗈𝖼𝗄 𝗍𝖾𝗋𝗅𝖾𝖻𝗂𝗁 𝖽𝖺𝗁𝗎𝗅𝗎`;

function getListWithTemplate(chatId, userName, groupName, listItems) {
    const settings = loadListSettings();
    const chatSettings = settings[chatId];
    const sortedItems = [...listItems].sort((a, b) => {
        return a.name.localeCompare(b.name, 'id', { sensitivity: 'base' });
    });

    const now = moment().tz('Asia/Jakarta');
    const hour = now.hour();
    let waktuHari = '';

    if (hour >= 0 && hour < 5) waktuHari = 'Dini Hari';
    else if (hour >= 5 && hour < 10) waktuHari = 'Pagi';
    else if (hour >= 10 && hour < 15) waktuHari = 'Siang';
    else if (hour >= 15 && hour < 18) waktuHari = 'Sore';
    else if (hour >= 18 && hour < 24) waktuHari = 'Malam';

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const tanggalLengkap = `${dayNames[now.day()]}, ${now.date()} ${monthNames[now.month()]} ${now.year()}`;

    let template = (chatSettings && chatSettings.template) ? chatSettings.template : defaultListTemplate;

    const defaultPrefix = "ㅤ  ㅤ  ╎ ╵ᚖ⃘ᚖ  ݁   ᛬ ";
    const prefixSymbol = chatSettings?.prefix || defaultPrefix;
    const formattedItems = sortedItems.map((item) => `${prefixSymbol} ${item.name.trim()}`).join('\n');

    template = template
        .replace(/(@name|@user|\{name\}|\{user\})/gi, userName || 'User')
        .replace(/(@group|\{group\}|\{groupname\}|@groupname)/gi, groupName || 'Grup')
        .replace(/(@time|\{time\})/gi, now.format('HH:mm:ss'))
        .replace(/(@date|\{date\})/gi, now.format('DD/MM/YYYY'))
        .replace(/(@fulldate|\{fulldate\})/gi, tanggalLengkap)
        .replace(/(@daytime|\{daytime\})/gi, waktuHari)
        .replace(/(@x|\{x\})/gi, formattedItems)
        .replace(/@prefix\s+[^\n]+/gi, '');

    return template.trim();
}
const hariini = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY')
const wib = moment.tz('Asia/Jakarta').format('HH : mm : ss')
const wit = moment.tz('Asia/Jayapura').format('HH : mm : ss')
const wita = moment.tz('Asia/Makassar').format('HH : mm : ss')

const time2 = moment().tz('Asia/Jakarta').format('HH:mm:ss')
        if(time2 < "23:59:00"){
        var ucapanWaktu = 'ɢᴏᴏᴅ ɴɪɢʜᴛ'
        }
        if(time2 < "19:00:00"){
        var ucapanWaktu = 'ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ'
        }
        if(time2 < "18:00:00"){
        var ucapanWaktu = 'ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ'
        }
        if(time2 < "15:00:00"){
        var ucapanWaktu = 'ɢᴏᴏᴅ ᴅᴀʏʟɪɢʜᴛ'
        }
        if(time2 < "10:00:00"){
        var ucapanWaktu = 'ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ'
        }
        if(time2 < "05:00:00"){
        var ucapanWaktu = 'ɢᴏᴏᴅ ᴅᴀᴡɴ'
        }
        if(time2 < "03:00:00"){
        var ucapanWaktu = 'ɢᴏᴏᴅ ᴍɪᴅɴɪɢʜᴛ'
        }

async function downloadAndSaveMedia(m, type = 'image') {
    try {
        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
        const mediaBuffer = await downloadContentFromMessage(m.message[`${type}Message`], type);
        let buffer = Buffer.from([]);
        for await (const chunk of mediaBuffer) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        const mediaDir = './library/media/list/';
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
        }
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        let ext = '.jpg';
        if (type === 'video') ext = '.mp4';
        else if (type === 'audio') ext = '.mp3';
        else if (type === 'sticker') ext = '.webp';
        else if (type === 'document') ext = '.bin';

        const filename = `${timestamp}_${random}${ext}`;
        const filepath = path.join(mediaDir, filename);
        fs.writeFileSync(filepath, buffer);
        return filepath;
    } catch (error) {
        throw error;
    }
}

const FormData = require('form-data');
const { getReplyStyle, setReplyStyle } = require('./lib/replystyle');
const makeReplyDZ = require('./lib/reply');

const menuStylePath = './library/database/menu_style.json';
if (!fs.existsSync(menuStylePath)) {
    fs.writeFileSync(menuStylePath, JSON.stringify({ globalVersion: 'v1' }, null, 2));
}

function loadMenuStyle() {
    try {
        return JSON.parse(fs.readFileSync(menuStylePath));
    } catch (e) {
        return { globalVersion: 'v1' };
    }
}

function saveMenuStyle(data) {
    fs.writeFileSync(menuStylePath, JSON.stringify(data, null, 2));
}

function getMenuStyle() {
    const data = loadMenuStyle();
    if (data.globalVersion === 'v9') return 'v3';
    return data.globalVersion || 'v1';
}

function setMenuStyle(version) {
    const data = loadMenuStyle();
    data.globalVersion = version === 'v9' ? 'v3' : version;
    saveMenuStyle(data);
}

let cachedMenuReplyThumbBuf = null;
let cachedMenuReplyThumbSrc = null;

async function loadMenuReplyThumbBuffer(size = 300) {
    const src = (global.image && global.image.reply) ? global.image.reply : ((global.image && global.image.menu) ? global.image.menu : './source/media/foto/imgdokumen.jpg');
    if (cachedMenuReplyThumbSrc === src && cachedMenuReplyThumbBuf && cachedMenuReplyThumbBuf.length > 0) {
        return cachedMenuReplyThumbBuf;
    }
    let raw = null;
    try {
        if (Buffer.isBuffer(src)) {
            raw = src;
        } else if (typeof src === 'string' && /^https?:\/\//i.test(src)) {
            const res = await axios.get(src, { responseType: 'arraybuffer', timeout: 15000 });
            raw = Buffer.from(res.data);
        } else if (typeof src === 'string' && fs.existsSync(src)) {
            raw = fs.readFileSync(src);
        }
    } catch (e) {}
    if (!raw || !raw.length) {
        try {
            if (fs.existsSync('./source/media/foto/imgdokumen.jpg')) {
                raw = fs.readFileSync('./source/media/foto/imgdokumen.jpg');
            }
        } catch (e) {}
    }
    if (!raw || !raw.length) return Buffer.alloc(0);

    let finalBuf = raw;
    try {
        finalBuf = await require('sharp')(raw)
            .resize(size, size, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80 })
            .toBuffer();
    } catch (e) {
        try {
            const jimp = require('jimp');
            const img = await jimp.read(raw);
            img.cover(size, size).quality(80);
            finalBuf = await img.getBufferAsync(jimp.MIME_JPEG);
        } catch (e2) {
            finalBuf = raw;
        }
    }

    if (finalBuf && finalBuf.length > 0) {
        cachedMenuReplyThumbSrc = src;
        cachedMenuReplyThumbBuf = finalBuf;
    }
    return finalBuf;
}

let cachedMenuMainThumbBuf = null;
let cachedMenuMainThumbSrc = null;

async function loadMenuMainThumbBuffer(size = 300) {
    const src = (global.image && global.image.menu) ? global.image.menu : ((global.image && global.image.reply) ? global.image.reply : './source/media/foto/imgdokumen.jpg');
    if (cachedMenuMainThumbSrc === src && cachedMenuMainThumbBuf && cachedMenuMainThumbBuf.length > 0) {
        return cachedMenuMainThumbBuf;
    }
    let raw = null;
    try {
        if (Buffer.isBuffer(src)) {
            raw = src;
        } else if (typeof src === 'string' && /^https?:\/\//i.test(src)) {
            const res = await axios.get(src, { responseType: 'arraybuffer', timeout: 15000 });
            raw = Buffer.from(res.data);
        } else if (typeof src === 'string' && fs.existsSync(src)) {
            raw = fs.readFileSync(src);
        }
    } catch (e) {}
    if (!raw || !raw.length) {
        try {
            if (fs.existsSync('./source/media/foto/imgdokumen.jpg')) {
                raw = fs.readFileSync('./source/media/foto/imgdokumen.jpg');
            }
        } catch (e) {}
    }
    if (!raw || !raw.length) return Buffer.alloc(0);

    let finalBuf = raw;
    try {
        finalBuf = await require('sharp')(raw)
            .resize(size, size, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80 })
            .toBuffer();
    } catch (e) {
        try {
            const jimp = require('jimp');
            const img = await jimp.read(raw);
            img.cover(size, size).quality(80);
            finalBuf = await img.getBufferAsync(jimp.MIME_JPEG);
        } catch (e2) {
            finalBuf = raw;
        }
    }

    if (finalBuf && finalBuf.length > 0) {
        cachedMenuMainThumbSrc = src;
        cachedMenuMainThumbBuf = finalBuf;
    }
    return finalBuf;
}

async function buildMenuJpmVerifiedQuote(senderJid) {
    const thumbBuf = await loadMenuReplyThumbBuffer(300);
    const ownerName = global.namaOwner || 'Kureza MD';
    const contactText = `info contact : ${ownerName}`;
    const ownerNumber = (global.owner || '6289531204240').replace(/[^0-9]/g, '');

    const quotedLocation = {
        key: {
            participant: '0@s.whatsapp.net',
            remoteJid: 'status@broadcast'
        },
        message: {
            locationMessage: {
                name: contactText,
                jpegThumbnail: (thumbBuf && thumbBuf.length) ? thumbBuf : Buffer.alloc(0)
            }
        }
    };

    const contextInfo = {
        isForwarded: false,
        businessMessageForwardInfo: {
            businessOwnerJid: ownerNumber + '@s.whatsapp.net'
        },
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast',
        quotedMessage: {
            locationMessage: {
                name: contactText,
                jpegThumbnail: (thumbBuf && thumbBuf.length) ? thumbBuf : Buffer.alloc(0)
            }
        },
        ...(senderJid ? { mentionedJid: [senderJid] } : {})
    };

    return {
        quotedLocation,
        contextInfo,
        thumbBuf
    };
}

const MENU_STYLE_OPTIONS = [
    { id: 'v1', title: 'V1 Interactive Message', desc: 'Menu interactive message dasar' },
    { id: 'v2', title: 'V2 Video Menu', desc: 'Menu animasi video (menuv2.mp4)' },
    { id: 'v3', title: 'V3 Orbit Flow Menu', desc: 'Menu kartu lokasi dengan tombol flow interaktif' }
];

const REPLY_STYLE_OPTIONS = [
    { id: 'v1', title: 'V1 Link Preview Card', desc: 'Balasan tampil sebagai link preview kosong dengan kutipan kontak bot' },
    { id: 'v2', title: 'V2 Native Flow', desc: 'Balasan interaktif tanpa gambar dengan kutipan undangan grup' },
    { id: 'v3', title: 'V3 Quoted Order Card', desc: 'Balasan interaktif dengan kutipan card produk bergambar' },
    { id: 'v4', title: 'V4 Order Card Besar', desc: 'Balasan berupa card produk besar bergambar dengan badge kecil' },
    { id: 'v5', title: 'V5 Link Card + Order', desc: 'Gabungan V1 dan V3: link preview kosong dengan kutipan card produk bergambar' }
];

async function sendStylePickerA2UI(shorekeeper, m, { current, options, title, commandPrefix }) {
    const titleUpper = String(title || '').toUpperCase();

    try {
        const btn2 = new (require('./library/baileys-mbuilder/index').ButtonV2)(shorekeeper);
        btn2.setThumbnail(global.image?.menu || "https://u.pone.rs/gsckkedx.jpg")
            .setBody(`\`⌜ sᴇᴛ ${titleUpper} ⌟\`
> ◦ ➢ ʙᴏᴛ : ${global.botname2 || global.botname || 'Hitoshi MD V1'}
> ◦ ➢ sᴀᴀᴛ ɪɴɪ : ${current}
> ◦ ➢ ᴘɪʟɪʜ ᴠᴇʀsɪ ${titleUpper} ᴅɪ ʙᴀᴡᴀʜ`)
            .setFooter(`Bot: ${global.botname || 'Hitoshi MD V1'} | ${new Date().getFullYear()}`)
            .addRawButton({
                buttonText: { displayText: `╼ ׅ ֹ𔖰᷼𔖮 ᴘɪʟɪʜ ${titleUpper}` },
                buttonId: `${commandPrefix.replace(/^\./, '')}_pilihan`,
                type: 1,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: `Pilih ${title}`,
                        sections: [{
                            title: `Saat ini: ${current}`,
                            rows: options.map((o) => ({
                                title: o.title,
                                description: o.desc,
                                id: `${commandPrefix} ${o.id}`
                            }))
                        }]
                    })
                }
            });

        await btn2.send(m.chat);
    } catch (e) {
        const listText = options.map(o => `• ${commandPrefix} ${o.id} — ${o.title}${o.desc ? ` (${o.desc})` : ''}`).join('\n');
        await shorekeeper.sendMessage(m.chat, {
            text: `\`⌜ sᴇᴛ ${titleUpper} ⌟\`\n> ◦ ➢ ʙᴏᴛ : ${global.botname2 || global.botname || 'Hitoshi MD V1'}\n> ◦ ➢ sᴀᴀᴛ ɪɴɪ : ${current}\n> ◦ ➢ ᴛᴏᴍʙᴏʟ ɢᴀɢᴀʟ ᴅɪᴍᴜᴀᴛ, ᴋᴇᴛɪᴋ ᴍᴀɴᴜᴀʟ ᴅɪ ʙᴀᴡᴀʜ:\n\n${listText}`
        }, { quoted: m }).catch(() => {});
    }
}

async function uploadToCDN(buffer, mimeType) {
    try {
        const response = await axios.post('https://cdn.yasha.web.id/api/upload', {
            buffer: buffer.toString('base64'),
            mimeType: mimeType
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 25000
        });
        if (response.data?.url) {
            return `https://cdn.yasha.web.id${response.data.url}`;
        }
    } catch (e) {
        console.error('[Upload Yasha CDN Error]', e.response?.data?.message || e.message);
        try {
            const fallback = await axios.post('https://cdn-alip.clutch.web.id/api/upload', {
                buffer: buffer.toString('base64'),
                mimeType: mimeType
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 15000
            });
            if (fallback.data?.url) {
                return `https://cdn-alip.clutch.web.id${fallback.data.url}`;
            }
        } catch (_) {}
    }
    return null;
}

async function uploadQu(buffer, mimeType, generateFilename) {
    try {
        if (!buffer) throw new Error('No buffer provided');
        const form = new FormData();
        const filename = generateFilename(mimeType);

        form.append('files[]', buffer, { filename });
        form.append('expiry', '-1');

        const { files } = await axios.post("https://qu.ax/upload.php", form, {
            headers: {
                ...form.getHeaders(),
                "referrer": "https://qu.ax/"
            }
        }).then(a => a.data);

        return files[0] || null;
    } catch (e) {
        console.error('Qu Upload Error:', e.message);
        return null;
    }
}

async function uploadTop4Top(buffer, mimeType, generateFilename) {
    try {
        if (!buffer) throw new Error('No buffer provided');
        const origin = 'https://top4top.io';
        const data = new FormData();
        const filename = generateFilename(mimeType);
        const ext = filename.split('.').pop();

        data.append('file_1_', buffer, { filename });
        data.append('submitr', '[ رفع الملفات ]');

        const r = await fetch(origin + '/index.php', {
            method: 'POST',
            body: data
        });

        if (!r.ok) throw Error(`${r.status} ${r.statusText}`);

        const html = await r.text();
        const matches = html.matchAll(/<input readonly="readonly" class="all_boxes" onclick="this.select\(\);" type="text" value="(.+?)" \/>/g);
        const arr = Array.from(matches);

        if (!arr.length) throw Error('Failed to upload file');

        const downloadUrl = arr.map(v => v[1]).find(v => v.endsWith(ext));
        const deleteUrl = arr.map(v => v[1]).find(v => v.endsWith('html'));
        const qrcodeUrl = origin + '/' + html.match(/<div class="qr_img"><img src="(.+?)"/)?.[1];

        return { downloadUrl, deleteUrl, qrcodeUrl };
    } catch (e) {
        console.error('Top4Top Upload Error:', e.message);
        return null;
    }
}

async function uploadCatbox(buffer, mimeType, generateFilename) {
    try {
        if (!buffer) throw new Error('No buffer provided');
        const filename = generateFilename(mimeType);
        const data = new FormData();

        data.append('reqtype', 'fileupload');
        data.append('userhash', '');
        data.append('fileToUpload', buffer, { filename });

        const result = await axios.post('https://catbox.moe/user/api.php', data, {
            headers: {
                ...data.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0'
            }
        });

        return result.data;
    } catch (err) {
        console.error('Catbox Upload Error:', err.message);
        return null;
    }
}

async function uploadUguu(buffer, mimeType, generateFilename) {
    try {
        if (!buffer) throw new Error('No buffer provided');
        const filename = generateFilename(mimeType);
        const formData = new FormData();
        formData.append("files[]", buffer, { filename });

        const response = await fetch("https://uguu.se/upload.php", {
            method: "POST",
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: formData
        });

        if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
        const json = await response.json();
        if (!json?.files?.[0]?.url) throw new Error('Invalid response format');

        return json.files[0].url;
    } catch (e) {
        console.error('Uguu Upload Error:', e.message);
        return null;
    }
}

const invoiceIconDbPath = './library/database/invoiceicon.json';
function loadInvoiceIconDb() {
    try {
        if (fs.existsSync(invoiceIconDbPath)) {
            return JSON.parse(fs.readFileSync(invoiceIconDbPath, 'utf8'));
        }
    } catch (e) {}
    return {};
}

function saveInvoiceIconDb(data) {
    try {
        const dir = path.dirname(invoiceIconDbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(invoiceIconDbPath, JSON.stringify(data, null, 2));
    } catch (e) {}
}

(function initInvoiceIconGlobal() {
    try {
        const db = loadInvoiceIconDb();
        if (db && db.default) {
            global.invoiceLogo = global.invoiceLogo || {};
            global.invoiceLogo.default = db.default;
        }
    } catch (e) {}
})();

const badwordsPath = './library/database/badwords.json';
if (!fs.existsSync(badwordsPath)) {
    fs.writeFileSync(badwordsPath, JSON.stringify({
        words: [
            "kontol", "memek", "mmk", "meki",
            "peler", "pler", "ngentot", "ngntot", "ngewe", "jembut",
            "pepek", "titit"
        ]
    }, null, 2));
}

function loadBadwords() {
    try {
        return JSON.parse(fs.readFileSync(badwordsPath));
    } catch (e) {
        return { words: [] };
    }
}

function saveBadwords(data) {
    fs.writeFileSync(badwordsPath, JSON.stringify(data, null, 2));
}

const sewaPath = './library/database/sewagrup.json';
if (!fs.existsSync(sewaPath)) {
    fs.writeFileSync(sewaPath, JSON.stringify([]));
}

const sewaNotifiedPath = './library/database/sewa_notified.json';
function getSewaNotified() {
    try {
        if (fs.existsSync(sewaNotifiedPath)) {
            return JSON.parse(fs.readFileSync(sewaNotifiedPath, 'utf8'));
        }
    } catch (e) {}
    return {};
}

function saveSewaNotified(data) {
    try {
        fs.writeFileSync(sewaNotifiedPath, JSON.stringify(data, null, 2));
    } catch (e) {}
}

async function handleGetFileDest(shorekeeper, m, Reply, prefix, argsText) {
    const parts = (argsText || '').trim().split(/\s+/).filter(Boolean);
    const encoded = parts.shift();
    const destination = (parts.shift() || '').toLowerCase();
    const extra = parts.join(' ').trim();

    if (!encoded || !destination) {
        return Reply(`╔─╼═[ ɢᴇᴛғɪʟᴇ ᴅᴇsᴛɪɴᴀsɪ ]═─፨፦⋆\n│ ❈ ᴛᴇʟᴇɢʀᴀᴍ\n│ ❈ ᴏᴡɴᴇʀ\n│ ❈ ᴄʜᴀᴛ (sini)\n│ ❈ ɢʀᴜᴘ <id grup opsional>\n│ ❈ ᴅᴍ <nomor>\n╰┈┈┈┈┈┈┈┈┈⬡`);
    }

    let fileName;
    try {
        fileName = Buffer.from(encoded, 'base64url').toString('utf8');
    } catch {
        return Reply(`╔─╼═[ ɢᴇᴛғɪʟᴇ ]═─፨፦⋆\n│ ❈ ᴛᴏᴋᴇɴ ғɪʟᴇ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ\n╰┈┈┈┈┈┈┈┈┈⬡`);
    }

    const safeRoot = path.resolve(process.cwd());
    const filePath = path.resolve(safeRoot, fileName);
    if (!filePath.startsWith(safeRoot + path.sep) && filePath !== safeRoot) {
        return Reply(`╔─╼═[ ɢᴇᴛғɪʟᴇ ]═─፨፦⋆\n│ ❈ ᴘᴀᴛʜ ғɪʟᴇ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ\n╰┈┈┈┈┈┈┈┈┈⬡`);
    }
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return Reply(`╔─╼═[ ɢᴇᴛғɪʟᴇ ]═─፨፦⋆\n│ ❈ ғɪʟᴇ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ : ${fileName}\n╰┈┈┈┈┈┈┈┈┈⬡`);
    }

    const numberToJid = (value) => {
        const n = String(value || '').replace(/[^0-9]/g, '');
        return n ? `${n}@s.whatsapp.net` : '';
    };

    if (destination === 'telegram' || destination === 'tele' || destination === 'tg') {
        if (!global.telegramToken || !global.telegramChatId) {
            return Reply(`╔─╼═[ ɢᴇᴛғɪʟᴇ → ᴛᴇʟᴇɢʀᴀᴍ ]═─፨፦⋆\n│ ❈ ʙᴏᴛ ᴛᴇʟᴇɢʀᴀᴍ / ɪᴅ ᴛᴇʟᴇɢʀᴀᴍ ʙᴇʟᴜᴍ ᴅɪsᴇᴛᴛɪɴɢ\n│ ❈ sᴇᴛᴛɪɴɢ : Isi global.telegramToken & global.telegramChatId di settings.js\n╰┈┈┈┈┈┈┈┈┈⬡`);
        }
        try {
            const FormData = require('form-data');
            const form = new FormData();
            form.append('chat_id', global.telegramChatId);
            form.append('document', fs.createReadStream(filePath), path.basename(filePath));
            form.append('caption', `╔─╼═[ ɢᴇᴛғɪʟᴇ ]═─፨፦⋆\n│ ❈ ғɪʟᴇ : ${fileName}\n│ ❈ ʙᴏᴛ  : ${global.botname || 'Hitoshi MD V1'}\n│ ❈ ᴡᴀᴋᴛᴜ: ${new Date().toLocaleString('id-ID')}\n╰┈┈┈┈┈┈┈┈┈⬡`);
            await axios.post(`https://api.telegram.org/bot${global.telegramToken}/sendDocument`, form, {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 120000
            });
            await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
            return Reply(`╔─╼═[ ɢᴇᴛғɪʟᴇ → ᴛᴇʟᴇɢʀᴀᴍ ]═─፨፦⋆\n│ ❈ sᴛᴀᴛᴜs : Berhasil Terkirim\n│ ❈ ғɪʟᴇ   : ${fileName}\n╰┈┈┈┈┈┈┈┈┈⬡`);
        } catch (e) {
            await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
            return Reply(`╔─╼═[ ɢᴇᴛғɪʟᴇ → ᴛᴇʟᴇɢʀᴀᴍ ]═─፨፦⋆\n│ ❈ sᴛᴀᴛᴜs : Gagal\n│ ❈ ᴘᴇsᴀɴ  : ${e.message}\n╰┈┈┈┈┈┈┈┈┈⬡`);
        }
    }

    let targetJid = '';
    if (destination === 'owner' || destination === 'pribadi' || destination === 'dmme') {
        targetJid = numberToJid(global.owner);
    } else if (destination === 'chat' || destination === 'here' || destination === 'sini' || destination === 'disini') {
        targetJid = m.chat;
    } else if (destination === 'group' || destination === 'grup') {
        if (extra) {
            targetJid = extra.includes('@g.us') ? extra : `${extra}@g.us`;
        } else if (m.isGroup) {
            targetJid = m.chat;
        } else if (global.idgc) {
            targetJid = global.idgc;
        }
    } else if (destination === 'dm' || destination === 'nomor' || destination === 'private') {
        targetJid = numberToJid(extra);
    }

    if (!targetJid) {
        return Reply(`╔─╼═[ ɢᴇᴛғɪʟᴇ ᴛᴜᴊᴜᴀɴ ]═─፨፦⋆\n│ ❈ ᴛᴜᴊᴜᴀɴ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ\n│ ❈ ᴄᴏɴᴛᴏʜ : ${prefix}getfiledest ${encoded} owner\n│ ❈ ɢʀᴏᴜᴘ  : ${prefix}getfiledest ${encoded} group (atau jika di dalam grup ketik sini)\n│ ❈ ᴅᴍ     : ${prefix}getfiledest ${encoded} dm 62812xxxxxxx\n╰┈┈┈┈┈┈┈┈┈⬡`);
    }

    try {
        const stat = fs.statSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mimeMap = {
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.html': 'text/html',
            '.css': 'text/css',
            '.md': 'text/markdown',
            '.txt': 'text/plain',
            '.yml': 'text/yaml',
            '.yaml': 'text/yaml',
            '.zip': 'application/zip'
        };
        await shorekeeper.sendMessage(targetJid, {
            document: fs.readFileSync(filePath),
            mimetype: mimeMap[ext] || 'application/octet-stream',
            fileName: path.basename(filePath),
            caption: `╔─╼═[ ɢᴇᴛғɪʟᴇ ]═─፨፦⋆\n│ ❈ ғɪʟᴇ    : ${fileName}\n│ ❈ ᴜᴋᴜʀᴀɴ  : ${(stat.size / 1024).toFixed(2)} KB\n│ ❈ ᴛᴜᴊᴜᴀɴ  : ${targetJid}\n╰┈┈┈┈┈┈┈┈┈⬡`
        }, { quoted: m });
        await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
        if (m.chat !== targetJid) {
            return Reply(`╔─╼═[ ɢᴇᴛғɪʟᴇ ]═─፨፦⋆\n│ ❈ sᴛᴀᴛᴜs  : Berhasil Mengirim\n│ ❈ ғɪʟᴇ    : ${fileName}\n│ ❈ ᴛᴜᴊᴜᴀɴ  : ${targetJid}\n╰┈┈┈┈┈┈┈┈┈⬡`);
        }
    } catch (e) {
        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
        return Reply(`╔─╼═[ ɢᴇᴛғɪʟᴇ ]═─፨፦⋆\n│ ❈ sᴛᴀᴛᴜs : Gagal Mengirim\n│ ❈ ᴘᴇsᴀɴ  : ${e.message}\n╰┈┈┈┈┈┈┈┈┈⬡`);
    }
}

// ==================== ALIGHT MOTION & RESELLER HELPERS ====================
function normalizeAmJid(jid) {
    if (!jid) return '';
    const num = String(jid).split(':')[0].replace(/[^0-9]/g, '');
    return num ? `${num}@s.whatsapp.net` : String(jid);
}

const isResellerAM = (sender) => {
    const resellerPath = './library/database/reseller_am.json';
    if (!fs.existsSync(resellerPath)) {
        try { fs.writeFileSync(resellerPath, JSON.stringify([])); } catch {}
        return false;
    }
    try {
        const data = JSON.parse(fs.readFileSync(resellerPath));
        if (!Array.isArray(data)) return false;
        const num = String(sender || '').split(':')[0].replace(/[^0-9]/g, '');
        const stdJid = num ? `${num}@s.whatsapp.net` : '';
        return data.includes(sender) || (stdJid && data.includes(stdJid)) || (num && data.some(k => k.includes(num)));
    } catch {
        return false;
    }
};

const isPartnerAM = (sender) => {
    const partnerPath = './library/database/partner_am.json';
    if (!fs.existsSync(partnerPath)) {
        try { fs.writeFileSync(partnerPath, JSON.stringify([])); } catch {}
        return false;
    }
    try {
        const data = JSON.parse(fs.readFileSync(partnerPath));
        if (!Array.isArray(data)) return false;
        const num = String(sender || '').split(':')[0].replace(/[^0-9]/g, '');
        const stdJid = num ? `${num}@s.whatsapp.net` : '';
        return data.includes(sender) || (stdJid && data.includes(stdJid)) || (num && data.some(k => k.includes(num)));
    } catch {
        return false;
    }
};

const isReseller = (jid) => {
    try {
        const resellerPath = './library/database/reseller_am.json';
        if (fs.existsSync(resellerPath)) {
            const list = JSON.parse(fs.readFileSync(resellerPath));
            if (!Array.isArray(list)) return false;
            const num = String(jid || '').split(':')[0].replace(/[^0-9]/g, '');
            const stdJid = num ? `${num}@s.whatsapp.net` : '';
            return list.includes(jid) || (stdJid && list.includes(stdJid)) || (num && list.some(k => k.includes(num)));
        }
    } catch {}
    return false;
};

const checkResellerAccess = (jid, isCreator) => {
    if (isCreator) return true;
    if (typeof isReseller === 'function' && isReseller(jid)) return true;
    if (typeof isResellerAM === 'function' && isResellerAM(jid)) return true;
    if (typeof isPartnerAM === 'function' && isPartnerAM(jid)) return true;
    const cleanJid = normalizeAmJid(jid);
    if (typeof isReseller === 'function' && isReseller(cleanJid)) return true;
    if (typeof isResellerAM === 'function' && isResellerAM(cleanJid)) return true;
    if (typeof isPartnerAM === 'function' && isPartnerAM(cleanJid)) return true;
    return false;
};

global.normalizeAmJid = normalizeAmJid;
global.isResellerAM = isResellerAM;
global.isPartnerAM = isPartnerAM;
global.isReseller = isReseller;
global.checkResellerAccess = checkResellerAccess;

function unwrapAlightLink(urlStr) {
    if (!urlStr) return '';
    let link = String(urlStr).trim();
    if (link.startsWith('b64:')) {
        try { link = Buffer.from(link.slice(4), 'base64').toString('utf-8').trim(); } catch (e) {}
    }
    for (let depth = 0; depth < 3; depth++) {
        try {
            if (/link=|url=|continueUrl=/i.test(link)) {
                const u = new URL(link);
                const inner = u.searchParams.get('link') || u.searchParams.get('url');
                if (inner && /^https?:\/\//i.test(inner)) {
                    link = inner;
                    continue;
                }
            }
        } catch (e) {}
        break;
    }
    return link;
}

function extractEmailFromUrl(urlStr) {
    if (!urlStr) return null;
    try {
        const decoded = decodeURIComponent(decodeURIComponent(urlStr));
        const match = decoded.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (match) return match[0].toLowerCase();
    } catch (e) {
        const match = String(urlStr).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (match) return match[0].toLowerCase();
    }
    return null;
}

global.unwrapAlightLink = unwrapAlightLink;
global.extractEmailFromUrl = extractEmailFromUrl;

const AM_SESSION_PATH = './library/database/am_session.json';
function amSessionSet(jid, email) {
    const stdJid = normalizeAmJid(jid);
    let data = {};
    try { data = JSON.parse(fs.readFileSync(AM_SESSION_PATH)); } catch {}
    const entry = { email, at: Date.now() };
    if (jid) data[jid] = entry;
    if (stdJid) data[stdJid] = entry;
    try { fs.writeFileSync(AM_SESSION_PATH, JSON.stringify(data, null, 2)); } catch {}
    if (!global.__amSession) global.__amSession = {};
    if (jid) global.__amSession[jid] = entry;
    if (stdJid) global.__amSession[stdJid] = entry;
}

function amSessionGet(jid) {
    const stdJid = normalizeAmJid(jid);
    const num = (jid || '').split(':')[0].replace(/[^0-9]/g, '');

    if (global.__amSession) {
        const s = global.__amSession[jid] || (stdJid && global.__amSession[stdJid]);
        if (s && Date.now() - s.at < 24 * 60 * 60 * 1000) return s;
    }
    try {
        const data = JSON.parse(fs.readFileSync(AM_SESSION_PATH));
        let s = data[jid] || (stdJid && data[stdJid]);
        if (!s && num) {
            for (const k of Object.keys(data)) {
                if (k.includes(num)) {
                    s = data[k];
                    break;
                }
            }
        }
        if (s && Date.now() - s.at < 24 * 60 * 60 * 1000) {
            if (!global.__amSession) global.__amSession = {};
            global.__amSession[jid] = s;
            if (stdJid) global.__amSession[stdJid] = s;
            return s;
        }
    } catch {}
    return null;
}

function amSessionDel(jid) {
    const stdJid = normalizeAmJid(jid);
    const num = (jid || '').split(':')[0].replace(/[^0-9]/g, '');
    if (global.__amSession) {
        delete global.__amSession[jid];
        if (stdJid) delete global.__amSession[stdJid];
    }
    try {
        const data = JSON.parse(fs.readFileSync(AM_SESSION_PATH));
        delete data[jid];
        if (stdJid) delete data[stdJid];
        if (num) {
            for (const k of Object.keys(data)) {
                if (k.includes(num)) delete data[k];
            }
        }
        fs.writeFileSync(AM_SESSION_PATH, JSON.stringify(data, null, 2));
    } catch {}
}

const AM2_SESS = './library/database/amprem2_session.json';
const am2SessionGet = (jid) => {
    const stdJid = normalizeAmJid(jid);
    const num = (jid || '').split(':')[0].replace(/[^0-9]/g, '');
    try {
        const db = JSON.parse(fs.readFileSync(AM2_SESS));
        let s = db[jid] || (stdJid && db[stdJid]);
        if (!s && num) {
            for (const k of Object.keys(db)) {
                if (k.includes(num)) {
                    s = db[k];
                    break;
                }
            }
        }
        if (s && Date.now() - s.at < 24 * 60 * 60 * 1000) return s;
    } catch {}
    return null;
};
const am2SessionSet = (jid, email) => {
    const stdJid = normalizeAmJid(jid);
    let db = {};
    try { db = JSON.parse(fs.readFileSync(AM2_SESS)); } catch {}
    const entry = { email, at: Date.now() };
    if (jid) db[jid] = entry;
    if (stdJid) db[stdJid] = entry;
    try { fs.writeFileSync(AM2_SESS, JSON.stringify(db, null, 2)); } catch {}
};
const am2SessionDel = (jid) => {
    const stdJid = normalizeAmJid(jid);
    const num = (jid || '').split(':')[0].replace(/[^0-9]/g, '');
    try {
        const db = JSON.parse(fs.readFileSync(AM2_SESS));
        delete db[jid];
        if (stdJid) delete db[stdJid];
        if (num) {
            for (const k of Object.keys(db)) {
                if (k.includes(num)) delete db[k];
            }
        }
        fs.writeFileSync(AM2_SESS, JSON.stringify(db, null, 2));
    } catch {}
};

async function amRequestSend(email) {
    const url = `https://api.theresav.eu/api/premium/alightmotion/send?email=${encodeURIComponent(email)}`;
    try {
        const res = await axios.get(url, { headers: { 'x-apikey': 'diezyaikey' }, timeout: 15000, validateStatus: () => true });
        return res.data;
    } catch (e) {
        throw e;
    }
}

async function amRequestVerify(email, link) {
    const url = `https://api.theresav.eu/api/premium/alightmotion/verify?email=${encodeURIComponent(email)}&link=${encodeURIComponent(link)}&orderid=DIEZYCLUTCH`;
    try {
        const res = await axios.get(url, { headers: { 'x-apikey': 'diezyaikey' }, timeout: 15000, validateStatus: () => true });
        return res.data;
    } catch (e) {
        throw e;
    }
}

const getValidCommands = () => {
    try {
        const content = fs.readFileSync(__filename, 'utf8');
        const matches = [...content.matchAll(/case\s+["']([^"']+)["']/g)];
        const cmds = new Set(matches.map(m => m[1].toLowerCase()));
        const pluginsDir = path.join(__dirname, 'plugins');
        const getAllPlugins = (dir) => {
            let res = [];
            try {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const full = path.join(dir, file);
                    if (fs.statSync(full).isDirectory()) {
                        res = res.concat(getAllPlugins(full));
                    } else if (file.endsWith('.js')) {
                        res.push(full);
                    }
                }
            } catch (e) {}
            return res;
        };
        const pluginFiles = getAllPlugins(pluginsDir);
        for (const filePath of pluginFiles) {
            try {
                const plugin = require(filePath);
                if (plugin && Array.isArray(plugin.command)) {
                    plugin.command.forEach(c => cmds.add(String(c).toLowerCase()));
                }
            } catch (e) {}
        }
        return [...cmds];
    } catch (e) {
        return [];
    }
};
const validCommandsList = getValidCommands();

// Plugin dengan hook `before` (dipanggil untuk pesan TANPA command, mis. reply jawaban AI untuk lanjut ngobrol).
// Daftar di-cache 60 detik supaya tidak scan folder plugins di setiap pesan.
let _beforePlugins = [], _beforePluginsAt = 0;
const getBeforePlugins = () => {
    if (Date.now() - _beforePluginsAt < 60000) return _beforePlugins;
    _beforePluginsAt = Date.now();
    const res = [];
    const walk = (dir) => {
        let items = [];
        try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
        for (const it of items) {
            const full = path.join(dir, it.name);
            if (it.isDirectory()) { walk(full); continue; }
            if (!it.name.endsWith('.js')) continue;
            try {
                const plugin = require(full);
                if (plugin && typeof plugin.before === 'function') res.push(plugin);
            } catch (e) {}
        }
    };
    walk(path.join(__dirname, 'plugins'));
    _beforePlugins = res;
    return res;
};

const handler = async (shorekeeper, m, chatUpdate, store) => {
    try {
        await LoadDataBase(shorekeeper, m)
        const botNumber = await shorekeeper.decodeJid(shorekeeper.user.id)
		const body = ((m.type === 'conversation') ? m.message.conversation :
		(m.type == 'imageMessage') ? m.message.imageMessage.caption :
		(m.type == 'videoMessage') ? m.message.videoMessage.caption :
		(m.type == 'extendedTextMessage') ? m.message.extendedTextMessage.text :
		(m.type == 'reactionMessage') ? m.message.reactionMessage.text :
		(m.type == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId :
		(m.type == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
		(m.type == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId :
		(m.type == 'interactiveResponseMessage'  && m.quoted) ? (m.message.interactiveResponseMessage?.nativeFlowResponseMessage ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id : '') :
		(m.type == 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || '') :
		(m.type == 'editedMessage') ? (m.message.editedMessage?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text || m.message.editedMessage?.message?.protocolMessage?.editedMessage?.conversation || '') :
		(m.type == 'protocolMessage') ? (m.message.protocolMessage?.editedMessage?.extendedTextMessage?.text || m.message.protocolMessage?.editedMessage?.conversation || m.message.protocolMessage?.editedMessage?.imageMessage?.caption || m.message.protocolMessage?.editedMessage?.videoMessage?.caption || '') : '') || '';
		
        const validCommands = validCommandsList
        let isCmd = false
        let command = ""
        let args = []

        const trimmedBody = body.trim()
        const hasPrefix = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^/]/i.test(trimmedBody)

        if (trimmedBody.length > 0) {
            const cleanBody = hasPrefix ? trimmedBody.replace(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^/]+/, '').trim() : trimmedBody;
            const parts = cleanBody.split(/ +/);
            const rawFirstWord = (parts[0] || '').toLowerCase();
            if (validCommands.includes(rawFirstWord)) {
                isCmd = true;
                command = rawFirstWord;
                args = parts.slice(1);
            }
        }
		const getQuoted = (m.quoted || m)
		const quoted = (getQuoted.type == 'buttonsMessage') ? getQuoted[Object.keys(getQuoted)[1]] : (getQuoted.type == 'templateMessage') ? getQuoted.hydratedTemplate[Object.keys(getQuoted.hydratedTemplate)[1]] : (getQuoted.type == 'product') ? getQuoted[Object.keys(getQuoted)[0]] : m.quoted ? m.quoted : m
		const senderNumber = (m.sender || '').split(':')[0].replace(/[^0-9]/g, '')
		const botNumberOnly = botNumber.split(':')[0].replace(/[^0-9]/g, '')
		const ownerNumbers = [global.owner, ...(loadOwners() || [])].map(v => String(v).replace(/[^0-9]/g, '')).filter(Boolean)
		const mappedSenderNum = global.lidMap ? global.lidMap[senderNumber] : null
		const isCreator = isOwner = (m.key.fromMe || m.fromMe || (botNumberOnly && senderNumber === botNumberOnly) || ownerNumbers.includes(senderNumber) || m.isDeveloper || (mappedSenderNum && (ownerNumbers.includes(mappedSenderNum) || mappedSenderNum === botNumberOnly))) ? true : false
		const isPrem = isPremiumUser(m.sender, isCreator);
		const text = q = args.join(' ')
		const mime = (quoted.msg || quoted).mimetype || ''
		const qmsg = (quoted.msg || quoted)
		const prefix = '.';

		const example = (teks) => {
			return `📌 *Contoh penggunaan:*\n> ◦ ${command} ${teks}`;
		}

		const Reply = makeReplyDZ(shorekeeper, m);

		if (isCmd) {
			console.log(chalk.cyan.bold(` ╭─────[ COMMAND NOTIFICATION ]`), chalk.blue.bold(`\n  Command :`), chalk.white.bold(`${command}`), chalk.blue.bold(`\n  From :`), chalk.white.bold(m.isGroup ? `Group - ${m.sender.split("@")[0]}\n` : m.sender.split("@")[0] +`\n`), chalk.cyan.bold(`╰────────────────────────────\n`))
		}

        // Auto check game answer or game controls
        if (body && typeof body === 'string' && body.trim().length > 0 && !m.isBaileys) {
            const isGameHandled = await handleGameAnswer(shorekeeper, m, body, isCmd, command);
            if (isGameHandled) return;
        }

        // Auto verif link Alight Motion
        const amBodyText = (typeof body === 'string' && body) ? body : (m.body || '');
        const amLinkRegex = /https?:\/\/(?:alight-creative\.firebaseapp\.com\/[^\s]+|(?:[\w-]+\.)?alightcreative\.(?:com|page\.link)\/[^\s]+|alight\.link\/[^\s]+)/i;

        if (
            !isCmd &&
            !hasPrefix &&
            amBodyText &&
            amLinkRegex.test(amBodyText) &&
            !m.isBaileys
        ) {
            const rawAutoLink = amBodyText.match(amLinkRegex)[0];
            const amAutoLink = unwrapAlightLink(rawAutoLink);
            const isResellerAMAuto = (typeof checkResellerAccess === 'function' && checkResellerAccess(m.sender, isCreator)) ||
                                     (typeof isPartnerAM === 'function' && isPartnerAM(m.sender));

            if (!isResellerAMAuto && !isCreator && !isPrem) {
                await Reply("❌ Link Alight Motion terdeteksi, tapi fitur ini khusus Reseller, Premium & Owner.\nHubungi owner untuk upgrade.");
                return;
            } else if (checkLimit(m.sender, isPrem, isCreator)) {
                await Reply(global.mess?.limit || "❌ Limit harian kamu habis!");
                return;
            } else {
                const amSess = (typeof amSessionGet === 'function') ? amSessionGet(m.sender) : null;
                const autoEmail = extractEmailFromUrl(amAutoLink) ||
                                  (amSess && amSess.email) ||
                                  global.ampremSessions?.[m.sender] ||
                                  global.ampremSessions?.[normalizeAmJid(m.sender)] ||
                                  (global.__amEmailStore && global.__amEmailStore.get(m.sender)) ||
                                  global.ampremEmail;

                if (!autoEmail) {
                    await Reply(`❌ *Email Alight Motion Belum Ditemukan!*\n\nKirim email dulu dengan: *${prefix}amprem email@kamu.com*\nLalu kirimkan link verifikasinya ke sini.`);
                    return;
                } else {
                    addLimit(m.sender, isPrem, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});

                    const apiKey = global.apikeydiezy || global.apikeyalip || "alipaiapikeybaru";
                    const baseUrl = (global.apidiezy || "https://api-shorekeeper.clutch.ai.id").replace(/\/$/, "");

                    try {
                        let resData = null;
                        try {
                            const apiUrl = `${baseUrl}/apkprem/alightmotion/verify?apikey=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(autoEmail)}&magicLink=${encodeURIComponent(amAutoLink)}`;
                            const res = await axios.get(apiUrl, { timeout: 20000, validateStatus: () => true });
                            resData = res.data;
                        } catch (errClutch) {
                            try {
                                const fallbackData = await amRequestVerify(autoEmail, amAutoLink);
                                if (fallbackData && (fallbackData.status === true || fallbackData.status === 'true')) {
                                    resData = { status: true, data: { status: 'ACTIVE' } };
                                }
                            } catch (eFallback) {}
                        }

                        if (resData && (resData.status === true || resData.data?.status === 'ACTIVE' || resData.status === 'true')) {
                            await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                            await Reply(`\`⌜ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ᴘʀᴇᴍɪᴜᴍ ⌟\`\n> ◦ ᴄʀᴇᴀᴛᴏʀ : *Kureza*\n> ◦ sᴛᴀᴛᴜs : *✅ Berhasil Diaktifkan (Auto Verif)*\n> ◦ ᴇᴍᴀɪʟ : *${autoEmail}*\n> ◦ ᴍᴇᴍʙᴇʀsʜɪᴘ : *Alight Motion VIP Pro (1 Tahun)*\n\n🎉 Akun Alight Motion Anda telah aktif Pro 1 Tahun! Silakan buka aplikasi.`);
                            if (typeof amSessionDel === 'function') amSessionDel(m.sender);
                            if (global.ampremSessions) delete global.ampremSessions[m.sender];
                        } else {
                            await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                            await Reply(`❌ Gagal verifikasi link Alight Motion: ${resData?.message || resData?.error || 'Link tidak valid atau kadaluwarsa.'}`);
                        }
                    } catch (errAuto) {
                        console.error('[AUTO AMPREM VERIF ERROR]', errAuto.message);
                        await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                        await Reply(`❌ Gagal memproses verifikasi link: ${errAuto.message}`);
                    }
                    return;
                }
            }
        }

        // Auto responder for list keyword (if not a command itself)
        if (!isCmd && m.isGroup && body && typeof body === 'string' && body.trim().length > 0 && !m.isBaileys) {
          const chatId = m.chat;
          let listDb = loadLists();
          let listGrup = listDb[chatId] || [];

          if (listGrup.length > 0) {
            const searchText = body.toLowerCase().trim();
            const cleanSearchText = searchText.replace(/^[.!#$/]/, '').trim();
            let cari = listGrup.find(item => {
              if (!item || !item.name) return false;
              const iname = item.name.toLowerCase().trim();
              return iname === searchText || iname === cleanSearchText;
            });
            
            if (cari) {
              const menuQuote = await buildMenuJpmVerifiedQuote(m.sender).catch(() => ({}));
              const itemContext = {
                  ...(menuQuote.contextInfo || {}),
                  mentionedJid: [m.sender]
              };
              if (cari.hasImage && cari.image && fs.existsSync(cari.image)) {
                const ext = cari.image.split('.').pop().toLowerCase();
                let payload = {};
                if (ext === 'mp4') {
                    payload = { video: fs.readFileSync(cari.image), caption: cari.desc, contextInfo: itemContext };
                } else if (ext === 'mp3' || ext === 'ogg' || ext === 'm4a') {
                    payload = { audio: fs.readFileSync(cari.image), mimetype: 'audio/mpeg', ptt: false, contextInfo: itemContext };
                } else if (ext === 'webp') {
                    payload = { sticker: fs.readFileSync(cari.image), contextInfo: itemContext };
                } else {
                    payload = { image: fs.readFileSync(cari.image), caption: cari.desc, contextInfo: itemContext };
                }

                await shorekeeper.sendMessage(m.chat, payload, { quoted: menuQuote.quotedLocation || m });
                if ((ext === 'mp3' || ext === 'ogg' || ext === 'm4a' || ext === 'webp') && cari.desc && cari.desc.trim() !== '') {
                    await shorekeeper.sendMessage(m.chat, { text: cari.desc, contextInfo: itemContext }, { quoted: menuQuote.quotedLocation || m });
                }
              } else {
                await shorekeeper.sendMessage(m.chat, { text: cari.desc || `*${cari.name}*\n(Tidak ada deskripsi)`, contextInfo: itemContext }, { quoted: menuQuote.quotedLocation || m });
              }
            }
          }

          // Auto responder for payment keywords
          const paymentDBPath = './library/database/autopay.json';
          try {
            if (fs.existsSync(paymentDBPath)) {
              const autopayDb = JSON.parse(fs.readFileSync(paymentDBPath));
              const groupPayments = autopayDb[chatId]?.payments;
              if (groupPayments) {
                const userText = body.toLowerCase().trim().replace(/^[.!#$/]/, '');
                for (const [kw, pdata] of Object.entries(groupPayments)) {
                  if (userText === kw.toLowerCase()) {
                    if (pdata.image && fs.existsSync(pdata.image)) {
                      await shorekeeper.sendMessage(m.chat, {
                        image: fs.readFileSync(pdata.image),
                        caption: `*${kw.toUpperCase()} PAYMENT*\nNomor: *${pdata.value}*`
                      }, { quoted: m });
                    } else {
                      await shorekeeper.sendMessage(m.chat, {
                        text: `*${kw.toUpperCase()} PAYMENT*\nNomor: *${pdata.value}*`
                      }, { quoted: m });
                    }
                    break;
                  }
                }
              }
            }
          } catch (e) {}
        }

        const formatWithPrefix = (text) => {
            if (!text) return '';
            return text.split('\n').map(l => {
                if (!l.trim()) return '';
                if (l.startsWith('>')) return l;
                return `> ${l}`;
            }).join('\n');
        };

        const menureply = async (categoryTeks) => {
            const menuStyle = getMenuStyle();
            const senderJid = m.sender;
            const botname = global.botname;
            const ownerJid = global.owner.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            const totalFitur = validCommandsList.length || 0;

            let userStatus = 'User';
            if (isCreator) {
                userStatus = 'Owner';
            }

            const hour = parseInt(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false }), 10);
            const greet = hour < 5 ? '🌙 Selamat Malam' : hour < 11 ? '🌅 Selamat Pagi' : hour < 15 ? '☀️ Selamat Siang' : hour < 18 ? '🌤️ Selamat Sore' : '🌙 Selamat Malam';

            let mode = 'ᴘᴜʙʟɪᴄ';
            try {
                const sfPath = './library/database/selfmode.json';
                if (fs.existsSync(sfPath)) {
                    const sfData = JSON.parse(fs.readFileSync(sfPath));
                    if (sfData && sfData.enabled) mode = 'ꜱᴇʟꜰ';
                }
            } catch {}

            let akses = isCreator ? ' ᴏᴡɴᴇʀ' : (global.isPrem && global.isPrem(m.sender)) ? ' ᴘʀᴇᴍɪᴜᴍ' : ' ᴜꜱᴇʀ';
            let limit = isCreator ? ' ᴜɴʟɪᴍɪᴛᴇᴅ' : ' ʟɪᴍɪᴛ';
            let daftar = ' ꜱᴜᴅᴀʜ';
            try {
                const regPath = './library/database/database.json';
                if (fs.existsSync(regPath)) {
                    const regDB = JSON.parse(fs.readFileSync(regPath));
                    const isFound = regDB.users && (regDB.users[m.sender] || regDB.users[m.sender.split('@')[0] + '@s.whatsapp.net']);
                    daftar = isFound || isCreator ? ' ꜱᴜᴅᴀʜ' : ' ʙᴇʟᴜᴍ';
                }
            } catch {}

            let totalSewaBot = 0;
            try {
                const sewaPath = './library/database/sewagrup.json';
                if (fs.existsSync(sewaPath)) {
                    const sewagrup = JSON.parse(fs.readFileSync(sewaPath));
                    totalSewaBot = Array.isArray(sewagrup) ? sewagrup.length : 0;
                }
            } catch {}

            const userName = m.pushName || 'User';

            const buildStandardMenuText = (extraTeks = '') => {
                let text = `ʜᴇʟʟᴏ *${ucapanWaktu}* , ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ʜɪᴛᴏsʜɪ ᴍᴅ 💍, 
ɪɴ ᴀᴅᴅɪᴛɪᴏɴ ᴛᴏ ʙᴇɪɴɢ ᴇɴᴛᴇʀᴛᴀɪɴɪɴɢ 💫, 
ɪ ᴄᴀɴ ᴀʟsᴏ ᴡᴏʀᴋ ᴏɴ ᴀɴsᴡᴇʀ ǫᴜᴇsᴛɪᴏɴs 🙂‍↔.

╒─━─• *\`⟨  ɪɴғᴏ ʙᴏᴛ  ⟩\`* 
│♤ ʙᴏᴛ ɴᴀᴍᴇ : ʜɪᴛᴏsʜɪ ᴍᴅ  
│♤ ᴛʏᴘᴇ : ᴄᴀsᴇ
│♤ ᴘʀᴇᴍɪᴜᴍ: ${isPrem ? 'Yes':'No'}
│♤ ᴄʀᴇᴀᴛᴏʀ : ᴋᴜʀᴇᴢᴀ ᴅᴇᴠ
╙─━─• *\`⟨  ʜɪᴛᴏsʜɪ ᴍᴅ ❁ ⟩\`*

${readmore}
ᴅᴇsᴄʀɪᴘᴛɪᴏɴ 𐂄 :
ʜɪᴛᴏsʜɪ ᴍᴅ ᴠ1 ɪs ᴀ ᴍᴜʟᴛɪ-ᴘᴜʀᴘᴏsᴇ ᴡʜᴀᴛsᴀᴘᴘ ʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ᴋᴜʀᴇᴢᴀ ᴅᴇᴠ 🪽, ʙᴜɪʟᴛ ᴛᴏ ᴍᴀᴋᴇ ʏᴏᴜʀ ᴅᴀɪʟʏ ᴄʜᴀᴛ ᴇᴀsɪᴇʀ ᴀɴᴅ ᴍᴏʀᴇ ғᴜɴ — ғʀᴏᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀs, sᴛɪᴄᴋᴇʀs, ᴀɪ ᴀɴᴅ ɢᴀᴍᴇs ᴛᴏ ɢʀᴏᴜᴘ ᴛᴏᴏʟs ᴀɴᴅ ᴍᴜᴄʜ ᴍᴏʀᴇ 💥.

ᴊᴜsᴛ ᴛʏᴘᴇ ᴀ ᴄᴏᴍᴍᴀɴᴅ ғʀᴏᴍ ᴛʜᴇ ᴍᴇɴᴜ ʙᴇʟᴏᴡ ᴀɴᴅ ʜɪᴛᴏsʜɪ ᴡɪʟʟ ʀᴇsᴘᴏɴᴅ ʀɪɢʜᴛ ᴀᴡᴀʏ. ᴘɪᴄᴋ ᴀ ᴄᴀᴛᴇɢᴏʀʏ, ᴇxᴘʟᴏʀᴇ ᴛʜᴇ ғᴇᴀᴛᴜʀᴇs, ᴀɴᴅ ᴇɴᴊᴏʏ 👏.`;
                if (extraTeks && String(extraTeks).trim()) {
                    text += `\n\n${extraTeks}`;
                }
                return text;
            };

            const sections = [
                {
                    title: toSmallCaps('menu utama'),
                    highlight_label: 'Rekomendasi',
                    rows: [
                        { title: toSmallCaps('semua fitur'), description: `➜ ${botname}`, id: 'allmenu' },
                        { title: toSmallCaps('menu group'), description: `➜ ${botname}`, id: 'menu-group' },
                        { title: toSmallCaps('menu store'), description: `➜ ${botname}`, id: 'menu-store' },
                        { title: toSmallCaps('menu download'), description: `➜ ${botname}`, id: 'menu-download' },
                        { title: toSmallCaps('menu search'), description: `➜ ${botname}`, id: 'menu-search' },
                        { title: toSmallCaps('menu ai'), description: `➜ ${botname}`, id: 'menu-ai' },
                        { title: toSmallCaps('menu maker'), description: `➜ ${botname}`, id: 'menu-maker' },
                        { title: toSmallCaps('menu stiker'), description: `➜ ${botname}`, id: 'menu-stiker' },
                        { title: toSmallCaps('menu game'), description: `➜ ${botname}`, id: 'menu-game' },
                        { title: toSmallCaps('menu primbon'), description: `➜ ${botname}`, id: 'menu-primbon' },
                        { title: toSmallCaps('menu tools'), description: `➜ ${botname}`, id: 'menu-tools' },
                        { title: toSmallCaps('menu fun'), description: `➜ ${botname}`, id: 'menu-fun' },
                        { title: toSmallCaps('menu stalk'), description: `➜ ${botname}`, id: 'menu-stalk' },
                        { title: toSmallCaps('menu islami'), description: `➜ ${botname}`, id: 'menu-islami' },
                        { title: toSmallCaps('menu premium'), description: `➜ ${botname}`, id: 'menu-prem' }
                    ]
                },
                {
                    title: toSmallCaps('kategori menu lain'),
                    rows: [
                        { title: toSmallCaps('menu owner'), description: `➜ ${botname}`, id: 'menu-owner' },
                        { title: toSmallCaps('menu jpm'), description: `➜ ${botname}`, id: 'menu-jpm' },
                        { title: toSmallCaps('menu auto join'), description: `➜ ${botname}`, id: 'menu-join' }
                    ]
                }
            ];

            // ==================== STYLE V2 (VIDEO MENU) ====================
            if (menuStyle === 'v2') {
                let listMenuContent = '';
                if (categoryTeks) {
                    listMenuContent = `\n${categoryTeks}\n`;
                } else {
                    listMenuContent = `             ╭ ──〔    *list menu*    〕── ╮
             │  ֺ𔓐ׅ𝅄   allmenu
             │  ֺ𔓐ׅ𝅄   menu-owner
             │  ֺ𔓐ׅ𝅄   menu-store
             ╰╶─────────────────`;
                }

                const menuV2Status = isCreator ? 'Owner' : (global.isPrem && global.isPrem(m.sender)) ? 'Premium' : 'Free';
                const menuV2Limit = isCreator ? 'Unlimited' : (global.isPrem && global.isPrem(m.sender)) ? 'Unlimited' : (limit || 'Free');

                const menuText = `ʜᴇʟʟᴏ *${ucapanWaktu}* , ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ʜɪᴛᴏsʜɪ ᴍᴅ 💍, 
ɪɴ ᴀᴅᴅɪᴛɪᴏɴ ᴛᴏ ʙᴇɪɴɢ ᴇɴᴛᴇʀᴛᴀɪɴɪɴɢ 💫, 
ɪ ᴄᴀɴ ᴀʟsᴏ ᴡᴏʀᴋ ᴏɴ ᴀɴsᴡᴇʀ ǫᴜᴇsᴛɪᴏɴs 🙂‍↔.

╒─━─• *\`⟨  ɪɴғᴏ ʙᴏᴛ  ⟩\`* 
│♤ ʙᴏᴛ ɴᴀᴍᴇ : ʜɪᴛᴏsʜɪ ᴍᴅ  
│♤ ᴛʏᴘᴇ : ᴄᴀsᴇ
│♤ ᴘʀᴇᴍɪᴜᴍ: ${isPrem ? 'Yes':'No'}
│♤ ᴄʀᴇᴀᴛᴏʀ : ᴋᴜʀᴇᴢᴀ ᴅᴇᴠ
╙─━─• *\`⟨  ʜɪᴛᴏsʜɪ ᴍᴅ ❁ ⟩\`*

${readmore}
ᴅᴇsᴄʀɪᴘᴛɪᴏɴ 𐂄 :
ʜɪᴛᴏsʜɪ ᴍᴅ ᴠ1 ɪs ᴀ ᴍᴜʟᴛɪ-ᴘᴜʀᴘᴏsᴇ ᴡʜᴀᴛsᴀᴘᴘ ʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ᴋᴜʀᴇᴢᴀ ᴅᴇᴠ 🪽, ʙᴜɪʟᴛ ᴛᴏ ᴍᴀᴋᴇ ʏᴏᴜʀ ᴅᴀɪʟʏ ᴄʜᴀᴛ ᴇᴀsɪᴇʀ ᴀɴᴅ ᴍᴏʀᴇ ғᴜɴ — ғʀᴏᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀs, sᴛɪᴄᴋᴇʀs, ᴀɪ ᴀɴᴅ ɢᴀᴍᴇs ᴛᴏ ɢʀᴏᴜᴘ ᴛᴏᴏʟs ᴀɴᴅ ᴍᴜᴄʜ ᴍᴏʀᴇ 💥.

ᴊᴜsᴛ ᴛʏᴘᴇ ᴀ ᴄᴏᴍᴍᴀɴᴅ ғʀᴏᴍ ᴛʜᴇ ᴍᴇɴᴜ ʙᴇʟᴏᴡ ᴀɴᴅ ʜɪᴛᴏsʜɪ ᴡɪʟʟ ʀᴇsᴘᴏɴᴅ ʀɪɢʜᴛ ᴀᴡᴀʏ. ᴘɪᴄᴋ ᴀ ᴄᴀᴛᴇɢᴏʀʏ, ᴇxᴘʟᴏʀᴇ ᴛʜᴇ ғᴇᴀᴛᴜʀᴇs, ᴀɴᴅ ᴇɴᴊᴏʏ 👏."`;

                const menuQuote = await buildMenuJpmVerifiedQuote(senderJid);
                const contextInfo = {
                    ...menuQuote.contextInfo,
                    mentionedJid: [senderJid, ownerJid, global.owner ? global.owner.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null].filter(Boolean)
                };

                const videoPath = "./source/media/menuv2.mp4";
                if (fs.existsSync(videoPath)) {
                    try {
                        return await shorekeeper.sendMessage(m.chat, {
                            video: fs.readFileSync(videoPath),
                            caption: menuText,
                            gifPlayback: true,
                            contextInfo: contextInfo
                        }, { quoted: menuQuote.quotedLocation });
                    } catch (err) {
                        console.error('Menu V2 Error:', err?.message || err);
                    }
                }
                return await shorekeeper.sendMessage(m.chat, {
                    text: menuText,
                    contextInfo: contextInfo
                }, { quoted: menuQuote.quotedLocation });
            }

            // ==================== STYLE V3 (ORBIT FLOW MENU) ====================
            if (menuStyle === 'v3' || menuStyle === 'v9') {
                let menuText = buildStandardMenuText(categoryTeks ? formatWithPrefix(categoryTeks) : '');

                // ===== BANNER: header gambar lebar (lib/media/menu_banner.jpg) untuk menu mode teks =====
                // Kalau gagal (file hilang / upload error) otomatis lanjut ke tampilan lama di bawah.
                try {
                    const bannerPathV3 = path.join(__dirname, 'lib', 'media', 'menu_banner.jpg');
                    if (fs.existsSync(bannerPathV3)) {
                        const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
                        const headerImage = await prepareWAMessageMedia(
                            { image: fs.readFileSync(bannerPathV3) },
                            { upload: shorekeeper.waUploadToServer }
                        );
                        const bq = await buildMenuJpmVerifiedQuote(senderJid);
                        const bannerContext = {
                            ...bq.contextInfo,
                            mentionedJid: [senderJid]
                        };

                        const bannerMsg = generateWAMessageFromContent(
                            m.chat,
                            {
                                viewOnceMessage: {
                                    message: {
                                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                                        interactiveMessage: proto.Message.InteractiveMessage.create({
                                            header: proto.Message.InteractiveMessage.Header.create({
                                                hasMediaAttachment: true,
                                                ...headerImage
                                            }),
                                            body: proto.Message.InteractiveMessage.Body.create({ text: menuText }),
                                            footer: proto.Message.InteractiveMessage.Footer.create({ text: `© ${global.botname}` }),
                                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                                buttons: [
                                                    {
                                                        name: 'single_select',
                                                        buttonParamsJson: JSON.stringify({ title: 'Pilih Menu', sections })
                                                    },
                                                    {
                                                        name: 'quick_reply',
                                                        buttonParamsJson: JSON.stringify({ display_text: '⌕ script', id: '.script' })
                                                    }
                                                ]
                                            }),
                                            contextInfo: bannerContext
                                        })
                                    }
                                }
                            },
                            { quoted: bq.quotedLocation }
                        );

                        await shorekeeper.relayMessage(m.chat, bannerMsg.message, { messageId: bannerMsg.key.id });
                        return bannerMsg;
                    }
                } catch (bannerErr) {
                    console.error('Menu V3 banner gagal, pakai tampilan lama:', bannerErr?.message || bannerErr);
                }

                try {
                    // Menggunakan image menu utama yang dipakai menu v1 (setimg menu), bukan foto reply
                    const finalThumb = await loadMenuMainThumbBuffer(300);
                    const menuQuote = await buildMenuJpmVerifiedQuote(senderJid);
                    if (menuQuote?.quotedLocation?.message?.locationMessage) {
                        menuQuote.quotedLocation.message.locationMessage.jpegThumbnail = finalThumb;
                    }

                    const { ButtonV2 } = require('./library/baileys-mbuilder/index');
                    const btn = new ButtonV2(shorekeeper);

                    const now = new Date();
                    const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
                    const jamRealtime = [wib.getHours(), wib.getMinutes(), wib.getSeconds()]
                        .map(v => String(v).padStart(2, '0'))
                        .join(' : ');

                    btn.loadFrom({
                        buttonsMessage: {
                            locationMessage: {
                                degreesLatitude: 0,
                                degreesLongitude: 0,
                                name: `${global.botname}`,
                                address: jamRealtime,
                                jpegThumbnail: finalThumb
                            },
                            contentText: `ׄ`,
                            footerText: `${menuText}\n\n© ${global.botname}`,
                            buttons: [
                                {
                                    buttonId: 'menu',
                                    buttonText: {
                                        displayText: '☰ menu'
                                    },
                                    nativeFlowInfo: {
                                        name: 'single_select',
                                        paramsJson: JSON.stringify({
                                            title: 'Pilih Menu',
                                            sections: sections
                                        })
                                    },
                                    type: 1
                                },
                                {
                                    buttonId: '.script',
                                    buttonText: {
                                        displayText: '⌕ script'
                                    },
                                    type: 1
                                }
                            ],
                            headerType: 6,
                            contextInfo: {
                                ...menuQuote.contextInfo,
                                mentionedJid: [senderJid]
                            }
                        }
                    });

                    return await btn.send(m.chat, { quoted: menuQuote.quotedLocation });
                } catch (err) {
                    console.error('Menu V3 Error', err?.message || err);
                    const menuQuote = await buildMenuJpmVerifiedQuote(senderJid).catch(() => ({}));
                    return await shorekeeper.sendMessage(m.chat, {
                        text: menuText,
                        contextInfo: menuQuote.contextInfo || { mentionedJid: [senderJid] }
                    }, { quoted: menuQuote.quotedLocation || m });
                }
            }

            // ==================== STYLE V1 (INTERACTIVE MESSAGE - DEFAULT) ====================
            const greetingText = `ʜᴇʟʟᴏ *${ucapanWaktu}* , ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ʜɪᴛᴏsʜɪ ᴍᴅ 💍, 
ɪɴ ᴀᴅᴅɪᴛɪᴏɴ ᴛᴏ ʙᴇɪɴɢ ᴇɴᴛᴇʀᴛᴀɪɴɪɴɢ 💫, 
ɪ ᴄᴀɴ ᴀʟsᴏ ᴡᴏʀᴋ ᴏɴ ᴀɴsᴡᴇʀ ǫᴜᴇsᴛɪᴏɴs 🙂‍↔.

╒─━─• *\`⟨  ɪɴғᴏ ʙᴏᴛ  ⟩\`* 
│♤ ʙᴏᴛ ɴᴀᴍᴇ : ʜɪᴛᴏsʜɪ ᴍᴅ  
│♤ ᴛʏᴘᴇ : ᴄᴀsᴇ
│♤ ᴘʀᴇᴍɪᴜᴍ: ${isPrem ? 'Yes':'No'}
│♤ ᴄʀᴇᴀᴛᴏʀ : ᴋᴜʀᴇᴢᴀ ᴅᴇᴠ
╙─━─• *\`⟨  ʜɪᴛᴏsʜɪ ᴍᴅ ❁ ⟩\`*

${readmore}
ᴅᴇsᴄʀɪᴘᴛɪᴏɴ 𐂄 :
ʜɪᴛᴏsʜɪ ᴍᴅ ᴠ1 ɪs ᴀ ᴍᴜʟᴛɪ-ᴘᴜʀᴘᴏsᴇ ᴡʜᴀᴛsᴀᴘᴘ ʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ᴋᴜʀᴇᴢᴀ ᴅᴇᴠ 🪽, ʙᴜɪʟᴛ ᴛᴏ ᴍᴀᴋᴇ ʏᴏᴜʀ ᴅᴀɪʟʏ ᴄʜᴀᴛ ᴇᴀsɪᴇʀ ᴀɴᴅ ᴍᴏʀᴇ ғᴜɴ — ғʀᴏᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀs, sᴛɪᴄᴋᴇʀs, ᴀɪ ᴀɴᴅ ɢᴀᴍᴇs ᴛᴏ ɢʀᴏᴜᴘ ᴛᴏᴏʟs ᴀɴᴅ ᴍᴜᴄʜ ᴍᴏʀᴇ 💥.

ᴊᴜsᴛ ᴛʏᴘᴇ ᴀ ᴄᴏᴍᴍᴀɴᴅ ғʀᴏᴍ ᴛʜᴇ ᴍᴇɴᴜ ʙᴇʟᴏᴡ ᴀɴᴅ ʜɪᴛᴏsʜɪ ᴡɪʟʟ ʀᴇsᴘᴏɴᴅ ʀɪɢʜᴛ ᴀᴡᴀʏ. ᴘɪᴄᴋ ᴀ ᴄᴀᴛᴇɢᴏʀʏ, ᴇxᴘʟᴏʀᴇ ᴛʜᴇ ғᴇᴀᴛᴜʀᴇs, ᴀɴᴅ ᴇɴᴊᴏʏ 👏.

╔─╼═[  *ᴋᴀᴛᴇɢᴏʀɪ ᴍᴇɴᴜ* ]═─፨፦⋆
│ ❈ .allmenu
│ ❈ .menu-group
│ ❈ .menu-store
│ ❈ .menu-owner
│ ❈ .menu-prem
│ ❈ .menu-stickers
│ ❈ .menu-maker
│ ❈ .menu-download
│ ❈ .menu-search
│ ❈ .menu-ai
│ ❈ .menu-enc
│ ❈ .menu-game
│ ❈ .menu-tools
│ ❈ .menu-fun
│ ❈ .menu-primbon
│ ❈ .menu-rpg
│ ❈ .menu-panel
│ ❈ .menu-anime
│ ❈ .menu-islami
╠─━─━─━━━━━━━━•⟢
╙────────··`;

            const fullMenuText = categoryTeks ? formatWithPrefix(categoryTeks) : headerInfo;
            // Banner lokal (sama dengan kartu HTML .allmenu) jadi prioritas; fallback ke global.image.menu / link lama
            let menuImage = { url: global.image?.menu || 'https://u.pone.rs/gsckkedx.jpg' };
            try {
                const bannerPath = path.join(__dirname, 'lib', 'media', 'menu_banner.jpg');
                if (fs.existsSync(bannerPath)) menuImage = fs.readFileSync(bannerPath);
            } catch (e) { console.log('[MENU BANNER] gagal baca lokal, pakai fallback:', e?.message || e); }
            const fullMessageBody = `${greetingText}\n\n${fullMenuText}`;

            const menuQuote = await buildMenuJpmVerifiedQuote(senderJid);
            const contextInfo = {
                ...menuQuote.contextInfo,
                mentionedJid: [senderJid, ownerJid],
                forwardedNewsletterMessageInfo: {
                    newsletterJid: global.idSaluran || "120363186130999681@newsletter",
                    newsletterName: global.namaSaluran || botname,
                    serverId: 200
                }
            };

            try {
                return await shorekeeper.sendMessage(m.chat, {
                    image: menuImage,
                    caption: fullMessageBody,
                    contextInfo: contextInfo
                }, { quoted: menuQuote.quotedLocation });
            } catch (err) {
                console.log('menureply error:', err?.message || err);
                return await shorekeeper.sendMessage(m.chat, {
                    text: fullMessageBody,
                    contextInfo: contextInfo
                }, { quoted: menuQuote.quotedLocation });
            }
        };

        const sendMenuCard = menureply;
        const replyWithImageMenu = menureply;

        // ==================== STATE MACHINE (jpmpilih / outpilih) ====================
        if (!isCmd && isCreator) {
            global._jpmState = global._jpmState || {};
            global._outState = global._outState || {};
            const jpmSt = global._jpmState[m.sender];
            const outSt = global._outState[m.sender];

            // JPM Pilih - step 1: user kirim nomor grup
            if (jpmSt && jpmSt.step === 'pilih_nomor' && body && /^[\d\s.,]+$/.test(body.trim())) {
                if (jpmSt.lastMsgId === m.key.id) return;
                const nomorInput = body.trim().replace(/[.,\s]+/g, ',');
                const indices = nomorInput.split(',').map(v => parseInt(v.trim()) - 1)
                    .filter(v => !isNaN(v) && v >= 0 && v < (global._jpmPilihList || []).length);

                if (indices.length === 0) return Reply("❌ Nomor tidak valid. Coba lagi.");

                const selected = indices.map(i => global._jpmPilihList[i]);
                global._jpmState[m.sender] = { step: 'tunggu_pesan', selected, chat: jpmSt.chat, lastMsgId: m.key.id };

                const namaGrup = selected.map((g, i) => `*${i+1}.* ${g.name}`).join('\n');
                return Reply(`\`⌜ Grup Dipilih ⌟\`\n> ◦ Total : *${selected.length} Grup*\n\n${namaGrup}\n\n📝 *Sekarang kirim pesan yang ingin di-broadcast:*`);
            }

            // JPM Pilih - step 2: user kirim pesan → langsung broadcast
            if (jpmSt && jpmSt.step === 'tunggu_pesan') {
                if (jpmSt.lastMsgId === m.key.id) return;
                const targetList = jpmSt.selected || [];
                const isMedia = /image|video/.test(mime);
                const pesanJpm = body.trim();
                let count = 0;
                const delayJpm = global.db.settings.delayJpm || 3000;

                delete global._jpmState[m.sender];

                await Reply(`\`⌜ JPM Dimulai ⌟\`\n> ◦ Target : *${targetList.length} Grup*\n> ◦ Delay : *${delayJpm}ms*`);

                for (let g of targetList) {
                    try {
                        if (isMedia && qmsg.download) {
                            const buf = await qmsg.download();
                            if (/image/.test(mime)) {
                                await shorekeeper.sendMessage(g.id, { image: buf, caption: pesanJpm });
                            } else {
                                await shorekeeper.sendMessage(g.id, { video: buf, caption: pesanJpm, mimetype: mime });
                            }
                        } else {
                            await shorekeeper.sendMessage(g.id, { text: pesanJpm });
                        }
                        count++;
                    } catch (e) {
                        console.error(`Gagal jpmpilih ke ${g.id}:`, e.message);
                    }
                    await new Promise(r => setTimeout(r, delayJpm));
                }

                return Reply(`\`⌜ JPM Selesai ⌟\`\n> ◦ Berhasil : *${count} Grup*\n> ◦ Gagal : *${targetList.length - count} Grup*`);
            }

            // Out Pilih - step 1: user kirim nomor grup
            if (outSt && outSt.step === 'pilih_nomor' && body && /^[\d\s.,]+$/.test(body.trim())) {
                if (outSt.lastMsgId === m.key.id) return;
                const nomorInput = body.trim().replace(/[.,\s]+/g, ',');
                const indices = nomorInput.split(',').map(v => parseInt(v.trim()) - 1)
                    .filter(v => !isNaN(v) && v >= 0 && v < (global._outPilihList || []).length);

                if (indices.length === 0) return Reply("❌ Nomor tidak valid. Coba lagi.");

                outSt.lastMsgId = m.key.id;
                delete global._outState[m.sender];
                const selected = indices.map(i => global._outPilihList[i]);

                let count = 0;
                await Reply(`\`⌜ Keluar Grup ⌟\`\n> ◦ Target : *${selected.length} Grup*\n> ◦ Proses keluar...`);

                for (let g of selected) {
                    try {
                        await shorekeeper.groupLeave(g.id);
                        count++;
                    } catch (e) {}
                    await new Promise(r => setTimeout(r, 1500));
                }

                return Reply(`\`⌜ Out Pilih Selesai ⌟\`\n> ◦ Berhasil keluar : *${count} Grup*`);
            }

            // BL Pilih - step 1: user kirim nomor grup
            if (global._blState?.[m.sender]?.step === 'pilih_nomor' && body && /^[\d\s.,]+$/.test(body.trim())) {
                if (global._blState[m.sender].lastMsgId === m.key.id) return;
                const nomorInput = body.trim().replace(/[.,\s]+/g, ',');
                const indices = nomorInput.split(',').map(v => parseInt(v.trim()) - 1)
                    .filter(v => !isNaN(v) && v >= 0 && v < (global._blPilihList || []).length);

                if (indices.length === 0) return Reply("❌ Nomor tidak valid. Coba lagi.");

                global._blState[m.sender].lastMsgId = m.key.id;
                delete global._blState[m.sender];
                const selected = indices.map(i => global._blPilihList[i]);

                let added = 0, removed = 0;
                for (let g of selected) {
                    if (!global.db.groups[g.id]) global.db.groups[g.id] = {};
                    if (global.db.groups[g.id].blacklistjpm) {
                        global.db.groups[g.id].blacklistjpm = false;
                        removed++;
                    } else {
                        global.db.groups[g.id].blacklistjpm = true;
                        added++;
                    }
                }

                return Reply(`\`⌜ Blacklist JPM ⌟\`\n> ◦ Ditambahkan : *${added} Grup*\n> ◦ Dihapus : *${removed} Grup*`);
            }

            // Del BL - step: user kirim nomor dari list BL
            if (global._blState?.[m.sender]?.step === 'delbl' && body && /^[\d\s.,]+$/.test(body.trim())) {
                if (global._blState[m.sender].lastMsgId === m.key.id) return;
                const blList = global._delBlList || [];
                const nomorInput = body.trim().replace(/[.,\s]+/g, ',');
                const indices = nomorInput.split(',').map(v => parseInt(v.trim()) - 1)
                    .filter(v => !isNaN(v) && v >= 0 && v < blList.length);

                if (indices.length === 0) return Reply("❌ Nomor tidak valid. Coba lagi.");

                global._blState[m.sender].lastMsgId = m.key.id;
                delete global._blState[m.sender];
                let count = 0;
                for (let idx of indices) {
                    const [jid] = blList[idx];
                    if (global.db.groups[jid]) {
                        global.db.groups[jid].blacklistjpm = false;
                        count++;
                    }
                }

                return Reply(`\`⌜ Delbl ⌟\`\n> ◦ Dihapus dari blacklist : *${count} Grup*`);
            }
        }

        // ==================== EVAL & EXEC (>, =>, $) ====================
        const budy = (typeof m.text === 'string' ? m.text : body) || body || '';
        const trimmedBudy = budy.trim();

        if (trimmedBudy.startsWith('=>')) {
            if (!isCreator) return;
            try {
                let code = trimmedBudy.slice(2).trim();
                let evaled;
                try {
                    evaled = await eval(`(async () => { return ${code} })()`);
                } catch {
                    evaled = await eval(`(async () => { ${code} })()`);
                }
                if (evaled !== undefined) {
                    if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
                    await Reply(evaled);
                }
            } catch (err) {
                await Reply(String(err));
            }
            return;
        }

        if (trimmedBudy.startsWith('>')) {
            if (!isCreator) return;
            try {
                let code = trimmedBudy.slice(1).trim();
                let evaled;
                try {
                    evaled = await eval(`(async () => { return ${code} })()`);
                } catch {
                    evaled = await eval(`(async () => { ${code} })()`);
                }
                if (evaled !== undefined) {
                    if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
                    await Reply(evaled);
                }
            } catch (err) {
                await Reply(String(err));
            }
            return;
        }

        if (trimmedBudy.startsWith('$')) {
            if (!isCreator) return;
            const cmdStr = trimmedBudy.slice(1).trim();
            if (!cmdStr) return;
            exec(cmdStr, (err, stdout, stderr) => {
                if (err) return Reply(String(err));
                if (stderr && !stdout) return Reply(String(stderr));
                if (stdout) return Reply(String(stdout));
            });
            return;
        }

        // ------------------ DYNAMIC PLUGINS RUNNER ------------------
        // grup yang di-ban (.bangc): abaikan command dari non-owner
        try { if (isCmd && m.isGroup && !isCreator && require('./lib/bangc.cjs').isBanned(m.chat)) return; } catch (_) {}
        // ------------------ PLUGIN BEFORE HOOK (pesan tanpa command) ------------------
        if (!isCmd && !m.key.fromMe && body) {
            try {
                if (!(m.isGroup && !isCreator && require('./lib/bangc.cjs').isBanned(m.chat))) {
                    for (const bp of getBeforePlugins()) {
                        const handled = await bp.before(m, {
                            shorekeeper, m, command: '', args: [], text: body.trim(), prefix,
                            isCreator, isOwner: isCreator, isPremium: isPrem, isPrem,
                            Reply, checkLimit, addLimit, example, mime, qmsg, quoted, botNumber
                        });
                        if (handled) return;
                    }
                }
            } catch (errBefore) { console.error('[PLUGIN BEFORE ERROR]', errBefore); }
        }
        let pluginExecuted = false;
        try {
            const pluginsDir = path.join(__dirname, 'plugins');
            const getAllPlugins = (dir) => {
                let res = [];
                try {
                    const files = fs.readdirSync(dir);
                    for (const file of files) {
                        const full = path.join(dir, file);
                        if (fs.statSync(full).isDirectory()) {
                            res = res.concat(getAllPlugins(full));
                        } else if (file.endsWith('.js')) {
                            res.push(full);
                        }
                    }
                } catch (e) {}
                return res;
            };

            const pluginFiles = getAllPlugins(pluginsDir);
            for (const filePath of pluginFiles) {
                let plugin;
                try {
                    plugin = require(filePath);
                } catch (e) {
                    continue;
                }
                if (plugin && Array.isArray(plugin.command)) {
                    const matched = plugin.command.some(c => String(c).toLowerCase() === command);
                    if (matched && typeof plugin === 'function') {
                        pluginExecuted = true;
                        const shorekeeperdev = {
                            shorekeeper,
                            m,
                            command,
                            args,
                            text,
                            prefix,
                            isCreator,
                            isOwner: isCreator,
                            isPremium: isPrem,
                            isPrem,
                            isRegistered: () => true,
                            checkLimit,
                            addLimit,
                            Reply,
                            example,
                            mime,
                            qmsg,
                            quoted,
                            botNumber,
                            isReseller,
                            isResellerAM,
                            isPartnerAM,
                            checkResellerAccess: (jid) => checkResellerAccess(jid, isCreator)
                        };
                        if (isCmd) require('./lib/autobadge.cjs').sendBadge(shorekeeper, m).catch(() => {});
                        await plugin(m, shorekeeperdev);
                        break;
                    }
                }
            }
        } catch (errPlugin) {
            console.error('[PLUGIN ERROR]', errPlugin);
        }
        if (pluginExecuted) return;
        // ------------------ END PLUGINS RUNNER ------------------
        try { const _ab = require('./lib/autobadge.cjs'); if (isCmd && _ab.isCaseCommand(command)) _ab.sendBadge(shorekeeper, m).catch(() => {}); } catch (_) {}

        switch (command) {
            case 'menu':
            case 'help': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    const _rm = require('./lib/richmenu.cjs');
                    if (await _rm.send({ sock: shorekeeper, m, isOwner: isCreator, isPremium: isPrem, prefix, sub: (args[0] || '').toLowerCase() })) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                        break;
                    }
                } catch (_e) { console.log('[RICHMENU] fallback ke menu lama:', _e.message); }
                try {
                    const sub = (args[0] || '').toLowerCase();
                    if (sub === 'group' || sub === 'grup' || sub === 'gc') {
                        await menureply(global.menugroup);
                    } else if (sub === 'owner' || sub === 'creator') {
                        await menureply(global.menuowner);
                    } else if (sub === 'list' || sub === 'store' || sub === 'toko') {
                        await menureply(global.menulist);
                    } else if (sub === 'sewa' || sub === 'rent') {
                        await menureply(global.menugroup);
                    } else if (sub === 'jpm' || sub === 'broadcast' || sub === 'push') {
                        await menureply(global.menujpm);
                    } else if (sub === 'join' || sub === 'autojoin') {
                        await menureply(global.menujoin);
                    } else if (sub === 'download' || sub === 'dl' || sub === 'unduh') {
                        await menureply(global.menudownload);
                    } else if (sub === 'search' || sub === 'cari' || sub === 'play') {
                        await menureply(global.menusearch);
                    } else if (sub === 'ai' || sub === 'gemini') {
                        await menureply(global.menuai);
                    } else if (sub === 'prem' || sub === 'premium' || sub === 'vip') {
                        await menureply(global.menuprem);
                    } else if (sub === 'maker' || sub === 'make') {
                        await menureply(global.menumaker);
                    } else if (sub === 'stiker' || sub === 'sticker' || sub === 'brat') {
                        await menureply(global.menusticker);
                    } else if (sub === 'tools' || sub === 'tool' || sub === 'alat') {
                        await menureply(global.menutools);
                    } else if (sub === 'fun' || sub === 'hiburan' || sub === 'lelucon') {
                        await menureply(global.menufun);
                    } else if (sub === 'stalk' || sub === 'stalker') {
                        await menureply(global.menustalk);
                    } else if (sub === 'islami' || sub === 'islam' || sub === 'agama') {
                        await menureply(global.menuislami);
                    } else if (sub === 'game' || sub === 'games' || sub === 'permainan') {
                        await menureply(global.menugame);
                    } else if (sub === 'gc' || sub === 'group-manager' || sub === 'manager') {
                        await menureply(global.menugc);
                    } else if (sub === 'all' || sub === 'allmenu' || sub === 'semua') {
                        await menureply(global.allmenu);
                    } else {
                        await menureply('');
                        if (global.db.settings?.audiomenu) {
                            const audioPath = path.join(process.cwd(), 'source/media/menu.mp3');
                            if (fs.existsSync(audioPath)) {
                                const audioBuffer = fs.readFileSync(audioPath);
                                await shorekeeper.sendMessage(m.chat, {
                                    audio: audioBuffer,
                                    mimetype: 'audio/mp4',
                                    ptt: true
                                }, { quoted: m });
                            }
                        }
                    }
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.log('menu error:', err.message);
                    await Reply(formatWithPrefix(global.mainmenu || global.allmenu));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'script':
            case 'sc':
            case 'sourcecode':
            case 'infoscript':
            case 'buyscript': {
                try {
                    const botName = global.botname || 'Hitoshi-MD';
                    const ownerNum = String(global.owner || '6289531204240').replace(/[^0-9]/g, '');
                    const ownerLink = global.linkOwner || `https://wa.me/${ownerNum}`;
                    const groupLink = global.linkGrup || 'https://chat.whatsapp.com/CUGkYst9qgmCagf0iWDSBR?s=cl&p=a&mlu=4&ilr=4&iam=2';
                    const channelLink = global.linkSaluran || 'https://whatsapp.com/channel/0029VaBOlsv002TEjlntTE2D';
                    const imageUrl = global.image?.menuv3 || global.image?.menu || 'https://cdn-alip.clutch.web.id/api/u/mq0pjz4v.jpg';

                    let pkgVersion = '2.0.0';
                    try {
                        const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
                        if (pkg.version) pkgVersion = pkg.version;
                    } catch (_) {}

                    let totalFitur = (validCommandsList && validCommandsList.length) ? validCommandsList.length : 0;
                    if (!totalFitur) {
                        try {
                            const cmdStr = fs.readFileSync(__filename, 'utf8');
                            totalFitur = (cmdStr.match(/case\s+['"`]/g) || []).length;
                        } catch (_) {
                            totalFitur = 400;
                        }
                    }

                    const carousel = new Carousel(shorekeeper)
                        .setBody(`╔─╼═[ *SOURCE CODE & SPECIFICATION* ]═─፨፦⋆\n│ ❈ *Bot Name* : ${botName}\n│ ❈ *Version*  : v${pkgVersion}\n│ ❈ *Engine*   : Baileys Multi-Device v2\n╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡`)
                        .setFooter(global.footer || `${botName} • Modern WhatsApp Bot`);

                    // Card 1: Core Architecture & System Specs
                    carousel.card((c) => c
                        .image(imageUrl)
                        .title('`⌜ SYSTEM ARCHITECTURE ⌟`')
                        .text(`╔─╼═[ INFO SYSTEM ]═─፨፦⋆\n` +
                              `│ ❈ Nama     : ${botName}\n` +
                              `│ ❈ Versi    : v${pkgVersion}\n` +
                              `│ ❈ Engine   : Node.js ${process.version}\n` +
                              `│ ❈ Baileys  : Modern Multi-Device\n` +
                              `│ ❈ Fitur    : ${totalFitur}+ Perintah Aktif\n` +
                              `╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡\n\n` +
                              `╔─╼═[ SPESIFIKASI ]═─፨፦⋆\n` +
                              `│ ❈ Runtime  : Multi-Auth Baileys\n` +
                              `│ ❈ Router   : Modular Command Router\n` +
                              `│ ❈ Storage  : Lightweight Local JSON\n` +
                              `│ ❈ Render   : High-Speed Native Canvas\n` +
                              `╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡`)
                        .addReply('Buka Menu', '.menu')
                        .addReply('Cek Speed', '.ping')
                    );

                    // Card 2: Features Ecosystem & Highlights
                    carousel.card((c) => c
                        .image(imageUrl)
                        .title('`⌜ FITUR UNGGULAN ⌟`')
                        .text(`╔─╼═[ MODUL FITUR ]═─፨፦⋆\n` +
                              `│ ❈ Brat Suite : 15 Varian Style Lengkap\n` +
                              `│ ❈ Smart AI   : ChatGPT, Claude & Gemini\n` +
                              `│ ❈ Downloader : TikTok, IG, FB, YT, Spotify\n` +
                              `│ ❈ Store/JPM  : Auto List, Broadcast & Order\n` +
                              `│ ❈ Mini Games : RPG, Kuis & Interaktif\n` +
                              `│ ❈ Proteksi   : Anti-Spam & Limit Otomatis\n` +
                              `╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡\n\n` +
                              `╔─╼═[ KEUNGGULAN ]═─፨፦⋆\n` +
                              `│ ❈ 100% No Encryption (Bebas Edit)\n` +
                              `│ ❈ Ringan, Responsif & Efisien Memori\n` +
                              `│ ❈ Tampilan Modern & Menu Interaktif\n` +
                              `╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡`)
                        .addUrl('Saluran Resmi', channelLink)
                        .addReply('Info Owner', '.owner')
                    );

                    // Card 3: Source Code Access & Developer Contact
                    carousel.card((c) => c
                        .image(imageUrl)
                        .title('`⌜ SOURCE CODE ACCESS ⌟`')
                        .text(`╔─╼═[ AKSES SCRIPT ]═─፨፦⋆\n` +
                              `│ ❈ Status  : Official Customized Release\n` +
                              `│ ❈ Lisensi : Personal & Commercial Ready\n` +
                              `│ ❈ Support : Komunitas & Pembaruan\n` +
                              `╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡\n\n` +
                              `╔─╼═[ DEVELOPER INFO ]═─፨፦⋆\n` +
                              `│ ❈ Creator : ${global.namaOwner || 'Kureza MD'}\n` +
                              `│ ❈ Kontak  : wa.me/${ownerNum}\n` +
                              `│ ❈ Group   : Komunitas Resmi Bot\n` +
                              `╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡\n` +
                              `> Silakan hubungi kontak developer jika ingin memiliki atau mengembangkan script ini.`)
                        .addUrl('Chat Developer', `https://wa.me/${ownerNum}?text=Halo%20kak,%20saya%20mau%20tanya%20source%20code%20${encodeURIComponent(botName)}`)
                        .addUrl('Komunitas Grup', groupLink)
                    );

                    await carousel.send(m.chat, { quoted: m });
                } catch (err) {
                    console.error('[SCRIPT COMMAND ERROR]', err);
                    try {
                        const botName = global.botname || 'Hitoshi-MD';
                        const ownerNum = String(global.owner || '6289531204240').replace(/[^0-9]/g, '');
                        const imageUrl = global.image?.menuv3 || global.image?.menu || 'https://cdn-alip.clutch.web.id/api/u/mq0pjz4v.jpg';
                        const fallbackText = `╔─╼═[ *${botName.toUpperCase()} SOURCE CODE* ]═─፨፦⋆\n` +
                            `│ ❈ Name    : ${botName}\n` +
                            `│ ❈ Version : v2.0.0\n` +
                            `│ ❈ Engine  : Baileys Multi-Device (Node ${process.version})\n` +
                            `│ ❈ Owner   : wa.me/${ownerNum}\n` +
                            `╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡\n\n` +
                            `\`⌜ Fitur & Keunggulan ⌟\`\n` +
                            `> ◦ 15-in-1 Brat Suite (Classic, Gojo, Vermeil, Viral, dll)\n` +
                            `> ◦ Smart AI Assistant & Auto Downloader All-in-One\n` +
                            `> ◦ Store, Order & JPM Broadcast Manager\n` +
                            `> ◦ Anti-Spam & Limit Protection System\n` +
                            `> ◦ Clean Code, No Encryption & Fast Response\n\n` +
                            `\`⌜ Dapatkan Script ⌟\`\n` +
                            `> ◦ Hubungi Owner : wa.me/${ownerNum}\n` +
                            `> ◦ Saluran Resmi : ${global.linkSaluran || 'https://whatsapp.com/channel/0029VaBOlsv002TEjlntTE2D'}`;

                        await shorekeeper.sendMessage(m.chat, {
                            image: { url: imageUrl },
                            caption: fallbackText
                        }, { quoted: m });
                    } catch (e2) {
                        Reply(`Gagal menampilkan info script: ${err.message}`);
                    }
                }
            }
            break;

            case 'allmenu':
            case 'menu-all':
            case 'menuall': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    const _rm = require('./lib/richmenu.cjs');
                    if (await _rm.send({ sock: shorekeeper, m, isOwner: isCreator, isPremium: isPrem, prefix, sub: 'all' })) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                        break;
                    }
                } catch (_e) { console.log('[RICHMENU] fallback ke menu lama:', _e.message); }
                try {
                    await menureply(global.allmenu);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.allmenu));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-group':
            case 'menugroup':
            case 'groupmenu': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menugroup);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menugroup));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-owner':
            case 'menuowner':
            case 'ownermenu': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menuowner);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menuowner));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-list':
            case 'menulist':
            case 'menu-store':
            case 'menustore':
            case 'storemenu': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menulist);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menulist));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-download':
            case 'menudownload':
            case 'downloadmenu':
            case 'menu-dl':
            case 'menudl': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menudownload);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menudownload));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-search':
            case 'menusearch':
            case 'searchmenu':
            case 'menu-play':
            case 'playmenu': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menusearch);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menusearch));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-ai':
            case 'menuai':
            case 'aimenu': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menuai);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menuai));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-maker':
            case 'menumaker':
            case 'makermenu': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menumaker);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menumaker));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-stiker':
            case 'menustiker':
            case 'menusticker':
            case 'menu-sticker': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menusticker);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menusticker));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-prem':
            case 'menuprem':
            case 'premmenu':
            case 'menupremium':
            case 'prem':
            case 'premium': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menuprem);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menuprem));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-tools':
            case 'menutools':
            case 'toolsmenu':
            case 'tools': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menutools);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menutools));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-fun':
            case 'menufun':
            case 'funmenu':
            case 'fun': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menufun);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menufun));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-stalk':
            case 'menustalk':
            case 'stalkmenu':
            case 'stalk': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menustalk);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menustalk));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-islami':
            case 'menuislami':
            case 'islamimenu':
            case 'islami':
            case 'islam': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menuislami);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menuislami));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-game':
            case 'menugame':
            case 'gamemenu': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menugame);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menugame));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-primbon':
            case 'menuprimbon':
            case 'primbonmenu':
            case 'primbon': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menuprimbon);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menuprimbon));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-sewa':
            case 'menusewa':
            case 'sewamenu': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menugroup);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menugroup));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-jpm':
            case 'menujpm':
            case 'jpm-menu': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menujpm);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menujpm));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-join':
            case 'menujoin':
            case 'joinmenu': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menujoin);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menujoin));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'menu-gc':
            case 'menugc':
            case 'gcmenu': {
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                try {
                    await menureply(global.menugc);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await Reply(formatWithPrefix(global.menugc));
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                }
            }
            break;

            case 'autoread': {
                if (!isCreator) return Reply(global.mess.owner);
                let value = args[0]?.toLowerCase();
                if (!value || (value !== 'on' && value !== 'off')) {
                    return Reply(example("on/off"));
                }
                if (value === 'on') {
                    global.db.settings.autoread = true;
                    Reply(`\`⌜ Autoread Settings ⌟\`\n> ◦ Status : *Aktif*\n> ◦ Info : *Bot akan otomatis membaca pesan masuk*`);
                } else if (value === 'off') {
                    global.db.settings.autoread = false;
                    Reply(`\`⌜ Autoread Settings ⌟\`\n> ◦ Status : *Nonaktif*\n> ◦ Info : *Bot tidak akan otomatis membaca pesan masuk*`);
                }
            }
            break;

            case "on":
            case "off":
            case "fitur":
            case "groupfitur":
            case "fiturgrup":
            case "gpset":
            case "groupsetting":
            case "gcsetting":
            case "gcset": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                if (!global.db.groups) global.db.groups = {};
                if (!global.db.groups[m.chat]) global.db.groups[m.chat] = {};
                const group = global.db.groups[m.chat];

                const settingConfig = [
                    // ◈ ᴀɴᴛɪ ʟɪɴᴋ & ᴘʀᴏᴍᴏsɪ
                    { key: "antilink", name: "antilink (kick)", label: "Anti Link (Kick)", category: "◈ ᴀɴᴛɪ ʟɪɴᴋ & ᴘʀᴏᴍᴏsɪ" },
                    { key: "antilink2", name: "antilink (hapus)", label: "Anti Link (Hapus)", category: "◈ ᴀɴᴛɪ ʟɪɴᴋ & ᴘʀᴏᴍᴏsɪ" },
                    { key: "antilinkGroup", name: "antilink group", label: "Anti Link Group", category: "◈ ᴀɴᴛɪ ʟɪɴᴋ & ᴘʀᴏᴍᴏsɪ" },
                    { key: "antilinkChannel", name: "antilink saluran", label: "Anti Link Saluran", category: "◈ ᴀɴᴛɪ ʟɪɴᴋ & ᴘʀᴏᴍᴏsɪ" },
                    { key: "antilinkWa", name: "antilink wa", label: "Anti Link WA.me", category: "◈ ᴀɴᴛɪ ʟɪɴᴋ & ᴘʀᴏᴍᴏsɪ" },
                    { key: "antilinkAll", name: "antilink all", label: "Anti Link Semua URL", category: "◈ ᴀɴᴛɪ ʟɪɴᴋ & ᴘʀᴏᴍᴏsɪ" },
                    { key: "antilinkCapcut", name: "antilink capcut", label: "Anti Link CapCut", category: "◈ ᴀɴᴛɪ ʟɪɴᴋ & ᴘʀᴏᴍᴏsɪ" },
                    { key: "antiPromosi", name: "anti promosi", label: "Anti Promosi", category: "◈ ᴀɴᴛɪ ʟɪɴᴋ & ᴘʀᴏᴍᴏsɪ" },

                    // ◈ ᴋᴇᴀᴍᴀɴᴀɴ & ᴀɴᴛɪ sᴘᴀᴍ
                    { key: "antibot", name: "anti bot (hapus)", label: "Anti Bot (Hapus)", category: "◈ ᴋᴇᴀᴍᴀɴᴀɴ & ᴀɴᴛɪ sᴘᴀᴍ" },
                    { key: "antibotkick", name: "anti bot (kick)", label: "Anti Bot (Kick)", category: "◈ ᴋᴇᴀᴍᴀɴᴀɴ & ᴀɴᴛɪ sᴘᴀᴍ" },
                    { key: "antispam", name: "anti spam", label: "Anti Spam", category: "◈ ᴋᴇᴀᴍᴀɴᴀɴ & ᴀɴᴛɪ sᴘᴀᴍ" },
                    { key: "antitagall", name: "anti tag all", label: "Anti Tag All", category: "◈ ᴋᴇᴀᴍᴀɴᴀɴ & ᴀɴᴛɪ sᴘᴀᴍ" },
                    { key: "antihidetag", name: "anti hidetag", label: "Anti Hidetag", category: "◈ ᴋᴇᴀᴍᴀɴᴀɴ & ᴀɴᴛɪ sᴘᴀᴍ" },
                    { key: "antiswgc", name: "anti sw gc", label: "Anti SW ke GC (Hapus)", category: "◈ ᴋᴇᴀᴍᴀɴᴀɴ & ᴀɴᴛɪ sᴘᴀᴍ" },
                    { key: "antiswgc_kick", name: "anti sw gc kick", label: "Anti SW ke GC (Kick)", category: "◈ ᴋᴇᴀᴍᴀɴᴀɴ & ᴀɴᴛɪ sᴘᴀᴍ" },
                    { key: "antitagsw", name: "anti tag sw", label: "Anti Tag SW (Hapus)", category: "◈ ᴋᴇᴀᴍᴀɴᴀɴ & ᴀɴᴛɪ sᴘᴀᴍ" },
                    { key: "antitagswkick", name: "anti tag sw kick", label: "Anti Tag SW (Kick)", category: "◈ ᴋᴇᴀᴍᴀɴᴀɴ & ᴀɴᴛɪ sᴘᴀᴍ" },

                    // ◈ ꜰɪʟᴛᴇʀ ᴋᴏɴᴛᴇɴ & ᴍᴇᴅɪᴀ
                    { key: "antiToxic", name: "anti toxic (hapus)", label: "Anti Toxic (Hapus)", category: "◈ ꜰɪʟᴛᴇʀ ᴋᴏɴᴛᴇɴ & ᴍᴇᴅɪᴀ" },
                    { key: "antiToxicKick", name: "anti toxic (kick)", label: "Anti Toxic (Kick)", category: "◈ ꜰɪʟᴛᴇʀ ᴋᴏɴᴛᴇɴ & ᴍᴇᴅɪᴀ" },
                    { key: "antinsfw", name: "anti nsfw", label: "Anti NSFW", category: "◈ ꜰɪʟᴛᴇʀ ᴋᴏɴᴛᴇɴ & ᴍᴇᴅɪᴀ" },
                    { key: "antifoto", name: "anti foto", label: "Anti Foto", category: "◈ ꜰɪʟᴛᴇʀ ᴋᴏɴᴛᴇɴ & ᴍᴇᴅɪᴀ" },
                    { key: "antivideo", name: "anti video", label: "Anti Video", category: "◈ ꜰɪʟᴛᴇʀ ᴋᴏɴᴛᴇɴ & ᴍᴇᴅɪᴀ" },
                    { key: "antiaudio", name: "anti audio", label: "Anti Audio / VN", category: "◈ ꜰɪʟᴛᴇʀ ᴋᴏɴᴛᴇɴ & ᴍᴇᴅɪᴀ" },
                    { key: "antisticker", name: "anti sticker", label: "Anti Sticker", category: "◈ ꜰɪʟᴛᴇʀ ᴋᴏɴᴛᴇɴ & ᴍᴇᴅɪᴀ" },

                    // ◈ ᴘᴇɴɢᴀᴛᴜʀᴀɴ ɢʀᴜᴘ & ɴᴏᴛɪꜰ
                    { key: "welcome", name: "welcome", label: "Welcome Message", category: "◈ ᴘᴇɴɢᴀᴛᴜʀᴀɴ ɢʀᴜᴘ & ɴᴏᴛɪꜰ" },
                    { key: "left", name: "left", label: "Left Message", category: "◈ ᴘᴇɴɢᴀᴛᴜʀᴀɴ ɢʀᴜᴘ & ɴᴏᴛɪꜰ" },
                    { key: "antidelete", name: "anti delete", label: "Anti Delete", category: "◈ ᴘᴇɴɢᴀᴛᴜʀᴀɴ ɢʀᴜᴘ & ɴᴏᴛɪꜰ" },
                    { key: "autodownload", name: "auto download", label: "Auto Download Sosmed", category: "◈ ᴘᴇɴɢᴀᴛᴜʀᴀɴ ɢʀᴜᴘ & ɴᴏᴛɪꜰ" },
                    { key: "notifgempa", name: "notif gempa", label: "Notif Gempa BMKG", category: "◈ ᴘᴇɴɢᴀᴛᴜʀᴀɴ ɢʀᴜᴘ & ɴᴏᴛɪꜰ" },
                    { key: "onlyAdminMode", name: "only admin", label: "Only Admin Mode", category: "◈ ᴘᴇɴɢᴀᴛᴜʀᴀɴ ɢʀᴜᴘ & ɴᴏᴛɪꜰ" },
                    { key: "mute", name: "mute", label: "Mute Chat Grup", category: "◈ ᴘᴇɴɢᴀᴛᴜʀᴀɴ ɢʀᴜᴘ & ɴᴏᴛɪꜰ" }
                ];

                const isToggleCmd = (command === 'on' || command === 'off') && text && text.trim().length > 0;
                const isFiturArgToggle = (command === 'fitur' || command === 'groupfitur' || command === 'fiturgrup' || command === 'gpset' || command === 'groupsetting' || command === 'gcset' || command === 'gcsetting') && text && text.trim().length > 0 && text.trim().toLowerCase() !== 'on' && text.trim().toLowerCase() !== 'off';

                if (!isToggleCmd && !isFiturArgToggle) {
                    const activeCount = settingConfig.filter(s => !!group[s.key]).length;
                    const inactiveCount = settingConfig.length - activeCount;

                    let listText = `╔─╼═[ 🄶ʀᴏᴜᴘ 🅂ᴇᴛᴛɪɴɢꜱ ]═─፨፦⋆\n`;
                    listText += `│ ❈ ɢʀᴜᴘ   : ${m.metadata?.subject || 'Grup'}\n`;
                    listText += `│ ❈ ᴀᴋᴛɪꜰ  : ${activeCount} Fitur\n`;
                    listText += `│ ❈ ᴏꜰꜰ    : ${inactiveCount} Fitur\n`;

                    const categories = [
                        "◈ ᴀɴᴛɪ ʟɪɴᴋ & ᴘʀᴏᴍᴏsɪ",
                        "◈ ᴋᴇᴀᴍᴀɴᴀɴ & ᴀɴᴛɪ sᴘᴀᴍ",
                        "◈ ꜰɪʟᴛᴇʀ ᴋᴏɴᴛᴇɴ & ᴍᴇᴅɪᴀ",
                        "◈ ᴘᴇɴɢᴀᴛᴜʀᴀɴ ɢʀᴜᴘ & ɴᴏᴛɪꜰ"
                    ];

                    let globalIndex = 1;

                    for (const cat of categories) {
                        listText += `├┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡\n┃ ${cat}\n`;
                        const items = settingConfig.filter(s => s.category === cat);
                        for (const item of items) {
                            const numStr = String(globalIndex).padStart(2, '0');
                            const isActive = !!group[item.key];
                            const statusStr = isActive ? '[ ᴏɴ ]' : '[ ᴏғғ ]';
                            listText += `│ ❈ ${numStr}. ${item.name} : ${statusStr}\n`;
                            globalIndex++;
                        }
                    }

                    listText += `├┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡\n`;
                    listText += `┃ ◈ ᴘᴀɴᴅᴜᴀɴ\n`;
                    listText += `│ ❈ .on <nomor/nama>\n`;
                    listText += `│ ❈ .off <nomor/nama>\n`;
                    listText += `│ ❈ Contoh: .on 9,10 atau .on antibot\n`;
                    listText += `╙────────···`;

                    return Reply(listText);
                }

                let targetInput = text.trim();
                let forceOn = (command === 'on');
                let forceOff = (command === 'off');

                if (targetInput.toLowerCase().startsWith('toggle ')) {
                    targetInput = targetInput.slice(7).trim();
                } else if (targetInput.toLowerCase().endsWith(' on')) {
                    targetInput = targetInput.slice(0, -3).trim();
                    forceOn = true;
                    forceOff = false;
                } else if (targetInput.toLowerCase().endsWith(' off')) {
                    targetInput = targetInput.slice(0, -4).trim();
                    forceOff = true;
                    forceOn = false;
                }

                const tokens = targetInput.split(',').map(s => s.trim()).filter(Boolean);
                const results = [];

                for (const token of tokens) {
                    let matched = null;
                    const num = parseInt(token);
                    if (!isNaN(num) && num >= 1 && num <= settingConfig.length) {
                        matched = settingConfig[num - 1];
                    } else {
                        const qLower = token.toLowerCase().replace(/[\s_-]/g, '');
                        matched = settingConfig.find(s =>
                            s.key.toLowerCase() === token.toLowerCase() ||
                            s.key.toLowerCase().replace(/[\s_-]/g, '') === qLower ||
                            s.name.toLowerCase().replace(/[\s_-]/g, '') === qLower ||
                            s.label.toLowerCase().replace(/[\s_-]/g, '') === qLower ||
                            (s.key === 'antiToxic' && qLower === 'antibadword') ||
                            (s.key === 'antibadword' && qLower === 'antitoxic')
                        );
                    }

                    if (!matched) continue;

                    let newStatus;
                    if (forceOn) newStatus = true;
                    else if (forceOff) newStatus = false;
                    else newStatus = !group[matched.key];

                    group[matched.key] = newStatus;

                    if (matched.key === 'antibadword' || matched.key === 'antiToxic') {
                        group.antibadword = newStatus;
                        group.antiToxic = newStatus;
                    }

                    if (matched.key === 'antidelete' && !newStatus) {
                        group.antideleteMessages = {};
                    }

                    if (matched.key === 'notifgempa' && newStatus) {
                        try {
                            const axios = require('axios');
                            const resp = await axios.get("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json", { timeout: 15000 });
                            if (resp.data?.Infogempa?.gempa) {
                                const g = resp.data.Infogempa.gempa;
                                let gText = `╔─╼═[ ɪɴꜰᴏ ɢᴇᴍᴘᴀ ]═─፨፦⋆\n`;
                                gText += `│ ❈ ᴛᴀɴɢɢᴀʟ : ${g.Tanggal} - ${g.Jam}\n`;
                                gText += `│ ❈ ᴍᴀɢɴɪᴛᴜᴅᴇ: ${g.Magnitude}\n`;
                                gText += `│ ❈ ᴋᴇᴅᴀʟᴀᴍᴀɴ: ${g.Kedalaman}\n`;
                                gText += `│ ❈ ᴡɪʟᴀʏᴀʜ  : ${g.Wilayah}\n`;
                                gText += `│ ❈ ᴘᴏᴛᴇɴsɪ  : ${g.Potensi}\n`;
                                gText += `╙────────···`;
                                await shorekeeper.sendMessage(m.chat, { text: gText });
                            }
                        } catch (e) {}
                    }

                    const idxNum = settingConfig.indexOf(matched) + 1;
                    const numPadded = String(idxNum).padStart(2, '0');
                    results.push({
                        label: `${numPadded}. ${matched.label}`,
                        status: newStatus ? '[ ᴏɴ ]' : '[ ᴏғғ ]'
                    });
                }

                if (results.length === 0) {
                    return Reply(`╔─╼═[ ᴘᴇʀɪɴɢᴀᴛᴀɴ ]═─፨፦⋆\n│ ❈ ɪɴꜰᴏ : Fitur tidak ditemukan!\n│ ❈ ᴛɪᴘs : Ketik .fitur untuk melihat daftar nomor & nama\n╙────────···`);
                }

                let confText = `╔─╼═[ ᴜᴘᴅᴀᴛᴇ ᴘᴇɴɢᴀᴛᴜʀᴀɴ ]═─፨፦⋆\n`;
                results.forEach((r) => {
                    confText += `│ ❈ ${r.label} : ${r.status}\n`;
                });
                confText += `╙────────···`;

                return Reply(confText);
            }
            break;

            case "antibot": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                if (!global.db.groups) global.db.groups = {};
                if (!global.db.groups[m.chat]) global.db.groups[m.chat] = {};
                const group = global.db.groups[m.chat];

                const sub = (args[0] || '').toLowerCase().trim();
                const action = (args[1] || '').toLowerCase().trim();

                if (!sub) {
                    const delStat = group.antibot ? '[ ᴏɴ ]' : '[ ᴏғғ ]';
                    const kickStat = group.antibotkick ? '[ ᴏɴ ]' : '[ ᴏғғ ]';
                    let msg = `╔─╼═[ ᴀɴᴛɪ ʙᴏᴛ ]═─፨፦⋆\n`;
                    msg += `│ ❈ ɢʀᴜᴘ   : ${m.metadata?.subject || 'Grup'}\n`;
                    msg += `│ ❈ ʜᴀᴘᴜs  : ${delStat}\n`;
                    msg += `│ ❈ ᴋɪᴄᴋ   : ${kickStat}\n`;
                    msg += `├┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡\n`;
                    msg += `┃ ◈ ᴘᴀɴᴅᴜᴀɴ\n`;
                    msg += `│ ❈ .antibot delete on / off\n`;
                    msg += `│ ❈ .antibot kick on / off\n`;
                    msg += `│ ❈ .antibot on / off\n`;
                    msg += `╙────────···`;
                    return Reply(msg);
                }

                if (sub === 'delete') {
                    const val = action === 'on' || action === 'aktif' || action === '1';
                    group.antibot = val;
                    return Reply(`╔─╼═[ ᴜᴘᴅᴀᴛᴇ sᴛᴀᴛᴜs ]═─፨፦⋆\n│ ❈ ꜰɪᴛᴜʀ  : Anti Bot\n│ ❈ ᴍᴏᴅᴇ   : Delete (Hapus Pesan)\n│ ❈ sᴛᴀᴛᴜs : ${val ? '[ ᴏɴ ]' : '[ ᴏғғ ]'}\n╙────────···`);
                } else if (sub === 'kick') {
                    const val = action === 'on' || action === 'aktif' || action === '1';
                    group.antibotkick = val;
                    return Reply(`╔─╼═[ ᴜᴘᴅᴀᴛᴇ sᴛᴀᴛᴜs ]═─፨፦⋆\n│ ❈ ꜰɪᴛᴜʀ  : Anti Bot\n│ ❈ ᴍᴏᴅᴇ   : Kick (Hapus & Keluarkan)\n│ ❈ sᴛᴀᴛᴜs : ${val ? '[ ᴏɴ ]' : '[ ᴏғғ ]'}\n╙────────···`);
                } else if (sub === 'on' || sub === 'aktif') {
                    group.antibot = true;
                    return Reply(`╔─╼═[ ᴜᴘᴅᴀᴛᴇ sᴛᴀᴛᴜs ]═─፨፦⋆\n│ ❈ ꜰɪᴛᴜʀ  : Anti Bot\n│ ❈ ᴍᴏᴅᴇ   : Delete (Hapus Pesan)\n│ ❈ sᴛᴀᴛᴜs : [ ᴏɴ ]\n╙────────···`);
                } else if (sub === 'off' || sub === 'mati') {
                    group.antibot = false;
                    group.antibotkick = false;
                    return Reply(`╔─╼═[ ᴜᴘᴅᴀᴛᴇ sᴛᴀᴛᴜs ]═─፨፦⋆\n│ ❈ ꜰɪᴛᴜʀ  : Anti Bot\n│ ❈ ᴍᴏᴅᴇ   : Semua Mode\n│ ❈ sᴛᴀᴛᴜs : [ ᴏғғ ]\n╙────────···`);
                } else {
                    return Reply(`╔─╼═[ ꜰᴏʀᴍᴀᴛ sᴀʟᴀʜ ]═─፨፦⋆\n│ ❈ ꜰᴏʀᴍᴀᴛ : .antibot delete on/off atau .antibot kick on/off\n╙────────···`);
                }
            }
            break;

            case "onlyadmin":
            case "onlyadminmode": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                if (!global.db.groups) global.db.groups = {};
                if (!global.db.groups[m.chat]) global.db.groups[m.chat] = {};
                const group = global.db.groups[m.chat];
                group.onlyAdminMode = !group.onlyAdminMode;
                const status = group.onlyAdminMode ? '[ ᴏɴ ]' : '[ ᴏғғ ]';

                return Reply(`╔─╼═[ ᴏɴʟʏ ᴀᴅᴍɪɴ ]═─፨፦⋆\n│ ❈ sᴛᴀᴛᴜs : ${status}\n│ ❈ ɪɴꜰᴏ   : ${group.onlyAdminMode ? 'Hanya admin yang dapat menggunakan bot' : 'Semua anggota dapat menggunakan bot'}\n╙────────···`);
            }
            break;

            case 'setwelcome': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                
                const welcomePath = './library/database/welcome.json';
                const welcomeDB = fs.existsSync(welcomePath) ? JSON.parse(fs.readFileSync(welcomePath)) : {};
                
                const q = m.quoted ? m.quoted : m;
                const mime = (q.msg || q).mimetype || '';
                const isImage = /image/.test(mime);
                
                if (isImage) {
                    try {
                        Reply(global.mess.wait);
                        const buffer = await q.download();
                        const cdnUrl = await uploadToCDN(buffer, mime);
                        if (!cdnUrl) return Reply(`❌ Gagal mengunggah foto ke CDN.`);
                        
                        if (!welcomeDB[m.chat]) welcomeDB[m.chat] = {};
                        welcomeDB[m.chat].welcomeImage = cdnUrl;
                        
                        if (text) {
                            welcomeDB[m.chat].welcomeText = text;
                        }
                        fs.writeFileSync(welcomePath, JSON.stringify(welcomeDB, null, 2));
                        
                        return Reply(`\`⌜ Welcome Settings ⌟\`\n> ◦ Status : *Berhasil*\n> ◦ URL : *${cdnUrl}*\n> ◦ Info : *Foto welcome berhasil disimpan ke CDN*`);
                    } catch (e) {
                        return Reply(`❌ Gagal mengunggah foto welcome: ${e.message}`);
                    }
                }
                
                if (text && (text.toLowerCase() === 'reset' || text.toLowerCase() === 'delete')) {
                    if (welcomeDB[m.chat]?.welcomeImage) {
                        delete welcomeDB[m.chat].welcomeImage;
                        fs.writeFileSync(welcomePath, JSON.stringify(welcomeDB, null, 2));
                        return Reply(`\`⌜ Welcome Settings ⌟\`\n> ◦ Status : *Berhasil*\n> ◦ Info : *Foto welcome berhasil di-reset ke default*`);
                    } else {
                        return Reply(`⚠️ Grup ini tidak memiliki foto welcome kustom.`);
                    }
                }
                
                if (!text) {
                    return Reply(`*Contoh Penggunaan*\nsetwelcome text (sambil reply foto jika mau ganti foto welcome)\n\n*Berikut Variabel yang tersedia*\n- @user\n> tag user\n- @group\n> nama grup\n- @totalmember\n> total member grup\n- @datenow\n> hari, tanggal, jam (WIB)`);
                }
                
                if (!welcomeDB[m.chat]) welcomeDB[m.chat] = {};
                welcomeDB[m.chat].welcomeText = text;
                
                fs.writeFileSync(welcomePath, JSON.stringify(welcomeDB, null, 2));
                const previewDate = moment().tz('Asia/Jakarta').format('dddd, DD MMMM YYYY HH:mm:ss [WIB]');
                const previewText = text
                    .replace(/@user/g, `@${m.sender.split('@')[0]}`)
                    .replace(/@group/g, m.metadata?.subject || 'Nama Grup')
                    .replace(/@totalmember/g, m.metadata?.participants?.length || 0)
                    .replace(/@datenow/g, previewDate);
                
                Reply(`\`⌜ Welcome Settings ⌟\`\n> ◦ Status : *Berhasil*\n> ◦ Info : *Teks welcome berhasil disimpan*`);
            }
            break;

            case 'setleft': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                
                const leftFile = './library/database/left.json';
                const leftDB = fs.existsSync(leftFile) ? JSON.parse(fs.readFileSync(leftFile)) : {};
                
                const q = m.quoted ? m.quoted : m;
                const mime = (q.msg || q).mimetype || '';
                const isImage = /image/.test(mime);
                
                if (isImage) {
                    try {
                        Reply(global.mess.wait);
                        const buffer = await q.download();
                        const cdnUrl = await uploadToCDN(buffer, mime);
                        if (!cdnUrl) return Reply(`❌ Gagal mengunggah foto ke CDN.`);
                        
                        if (!leftDB[m.chat]) leftDB[m.chat] = {};
                        leftDB[m.chat].leftImage = cdnUrl;
                        
                        if (text) {
                            leftDB[m.chat].leftText = text;
                        }
                        fs.writeFileSync(leftFile, JSON.stringify(leftDB, null, 2));
                        
                        return Reply(`\`⌜ Left Settings ⌟\`\n> ◦ Status : *Berhasil*\n> ◦ URL : *${cdnUrl}*\n> ◦ Info : *Foto left berhasil disimpan ke CDN*`);
                    } catch (e) {
                        return Reply(`❌ Gagal mengunggah foto left: ${e.message}`);
                    }
                }
                
                if (text && (text.toLowerCase() === 'reset' || text.toLowerCase() === 'delete')) {
                    if (leftDB[m.chat]?.leftImage) {
                        delete leftDB[m.chat].leftImage;
                        fs.writeFileSync(leftFile, JSON.stringify(leftDB, null, 2));
                        return Reply(`\`⌜ Left Settings ⌟\`\n> ◦ Status : *Berhasil*\n> ◦ Info : *Foto left berhasil di-reset ke default*`);
                    } else {
                        return Reply(`⚠️ Grup ini tidak memiliki foto left kustom.`);
                    }
                }
                
                if (!text) {
                    return Reply(`*Contoh Penggunaan*\nsetleft text (sambil reply foto jika mau ganti foto left)\n\n*Berikut Variabel yang tersedia*\n- @user\n> tag user\n- @group\n> nama grup\n- @totalmember\n> total member grup\n- @datenow\n> hari, tanggal, jam (WIB)`);
                }
                
                if (!leftDB[m.chat]) leftDB[m.chat] = {};
                leftDB[m.chat].leftText = text;
                
                fs.writeFileSync(leftFile, JSON.stringify(leftDB, null, 2));
                const previewDate = moment().tz('Asia/Jakarta').format('dddd, DD MMMM YYYY HH:mm:ss [WIB]');
                const previewText = text
                    .replace(/@user/g, `@${m.sender.split('@')[0]}`)
                    .replace(/@group/g, m.metadata?.subject || 'Nama Grup')
                    .replace(/@totalmember/g, m.metadata?.participants?.length || 0)
                    .replace(/@datenow/g, previewDate);
                
                Reply(`\`⌜ Left Settings ⌟\`\n> ◦ Status : *Berhasil*\n> ◦ Info : *Teks left berhasil disimpan*`);
            }
            break;

            case 'setlist': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                
                let currentPrefix = '';
                if (!text) {
                    return Reply(
`\`⌜ Variabel Tersedia ⌟\`
> ◦ @name / @user - Nama user
> ◦ @group - Nama grup
> ◦ @time - Waktu
> ◦ @date - Tanggal
> ◦ @fulldate - Full tanggal
> ◦ @daytime - Waktu hari
> ◦ @x - List keyword
> ◦ @prefix teks - Ganti format item

📌 *Contoh Penggunaan:*

${currentPrefix}setlist \`⌜ List Produk @group ⌟\`
> ◦ Customer : @name
> ◦ Waktu : @time
> ◦ Tanggal : @date

\`⌜ List Produk ⌟\`
> ◦ @x
@prefix > ◦`
                    )
                }
                
                const settings = loadListSettings();
                if (!settings[m.chat]) settings[m.chat] = {};
                
                const prefixMatch = text.match(/@prefix\s+([^\n]+)/i);
                if (prefixMatch && prefixMatch[1]) {
                    settings[m.chat].prefix = prefixMatch[1].trim();
                } else {
                    delete settings[m.chat].prefix;
                }
                
                settings[m.chat].template = text;
                
                if (m.type === 'imageMessage') {
                    try {
                        const media = await downloadAndSaveMedia(m, 'image');
                        settings[m.chat].media = media;
                        settings[m.chat].mediaType = 'image';
                    } catch (e) {}
                } else if (m.quoted && m.quoted.type === 'imageMessage') {
                    try {
                        const media = await downloadAndSaveMedia(m.quoted, 'image');
                        settings[m.chat].media = media;
                        settings[m.chat].mediaType = 'image';
                    } catch (e) {}
                } else {
                    delete settings[m.chat].media;
                    delete settings[m.chat].mediaType;
                }
                
                saveListSettings(settings);
                Reply(`\`⌜ List Settings ⌟\`\n> ◦ Status : *Berhasil*\n> ◦ Info : *Template list berhasil disimpan*`);
            }
            break;

            case 'addlist': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                
                if (!text || !text.includes('|')) return Reply(example("Burger|Burger dengan keju melt"));
                
                let parts = text.split('|');
                if (parts.length < 2) return Reply(example("Burger|Burger dengan keju melt"));
                
                const nama = parts[0].trim();
                const deskripsi = parts.slice(1).join('|').trim();
                
                const chatId = m.chat;
                let listDb = loadLists();
                
                if (!listDb[chatId]) {
                    listDb[chatId] = [];
                }
                
                const newItem = {
                    name: nama,
                    desc: deskripsi,
                    addedBy: m.sender,
                    addedAt: Date.now()
                };
                
                let mediaMsg = null;
                let mediaType = '';

                if (m.type === 'imageMessage') { mediaMsg = m; mediaType = 'image'; }
                else if (m.type === 'videoMessage') { mediaMsg = m; mediaType = 'video'; }
                else if (m.type === 'audioMessage') { mediaMsg = m; mediaType = 'audio'; }
                else if (m.type === 'stickerMessage') { mediaMsg = m; mediaType = 'sticker'; }
                else if (m.quoted) {
                    if (m.quoted.type === 'imageMessage') { mediaMsg = m.quoted; mediaType = 'image'; }
                    else if (m.quoted.type === 'videoMessage') { mediaMsg = m.quoted; mediaType = 'video'; }
                    else if (m.quoted.type === 'audioMessage') { mediaMsg = m.quoted; mediaType = 'audio'; }
                    else if (m.quoted.type === 'stickerMessage') { mediaMsg = m.quoted; mediaType = 'sticker'; }
                }

                if (mediaMsg) {
                    try {
                        const mediaPath = await downloadAndSaveMedia(mediaMsg, mediaType);
                        newItem.image = mediaPath;
                        newItem.hasImage = true;
                    } catch (e) {
                        console.error("Gagal mendownload media addlist:", e);
                    }
                }
                
                listDb[chatId].push(newItem);
                saveLists(listDb);
                
                Reply(`✅ Item "${nama}" berhasil ditambahkan!`);
            }
            break;

            case 'list': {
                if (!m.isGroup) return Reply(global.mess.group);

                const chatId = m.chat;
                const listDb = loadLists();
                const listGrup = listDb[chatId] || [];

                if (listGrup.length === 0) {
                    const menuQuote = await buildMenuJpmVerifiedQuote(m.sender).catch(() => ({}));
                    return await shorekeeper.sendMessage(chatId, {
                        text: `\`⌜ ʟɪsᴛ ⌟\`\n> ◦ sᴛᴀᴛᴜs : *Belum ada item*\n> ◦ ᴛᴀᴍʙᴀʜ : *.addlist nama|deskripsi*`,
                        contextInfo: menuQuote.contextInfo || { mentionedJid: [m.sender] }
                    }, { quoted: menuQuote.quotedLocation || m });
                }

                const sortedListGrup = [...listGrup].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }));

                try {
                    const groupMetadata = m.isGroup ? await shorekeeper.groupMetadata(chatId).catch(() => null) : null;
                    const groupName = groupMetadata ? groupMetadata.subject : 'Grup Ini';
                    const userName = m.pushName || m.sender.split('@')[0];

                    const listText = getListWithTemplate(chatId, userName, groupName, sortedListGrup);

                    const settings = loadListSettings();
                    const chatSettings = settings[chatId];
                    const menuQuote = await buildMenuJpmVerifiedQuote(m.sender);
                    const listContext = {
                        ...menuQuote.contextInfo,
                        mentionedJid: [m.sender]
                    };

                    if (chatSettings && chatSettings.media && fs.existsSync(chatSettings.media)) {
                        await shorekeeper.sendMessage(chatId, {
                            image: fs.readFileSync(chatSettings.media),
                            caption: listText,
                            contextInfo: listContext
                        }, { quoted: menuQuote.quotedLocation });
                    } else {
                        await shorekeeper.sendMessage(chatId, {
                            text: listText,
                            contextInfo: listContext
                        }, { quoted: menuQuote.quotedLocation });
                    }

                    const letterGroups = {};
                    for (const item of sortedListGrup) {
                        if (!item || !item.name) continue;
                        const firstChar = (String(item.name).trim()[0] || '#').toUpperCase();
                        const letterKey = /^[A-Z]$/.test(firstChar) ? firstChar : '#';
                        if (!letterGroups[letterKey]) letterGroups[letterKey] = [];
                        letterGroups[letterKey].push(item);
                    }

                    const sortedLetters = Object.keys(letterGroups).sort((a, b) => {
                        if (a === '#') return 1;
                        if (b === '#') return -1;
                        return a.localeCompare(b, 'id');
                    });

                    const sections = [];
                    for (const letter of sortedLetters) {
                        const items = letterGroups[letter];
                        sections.push({
                            title: `★ ʜᴜʀᴜғ ${letter} (${items.length})`,
                            rows: items.map(item => ({
                                title: item.name.length > 24 ? item.name.slice(0, 21) + '...' : item.name,
                                description: item.desc ? (item.desc.length > 50 ? item.desc.slice(0, 47) + '...' : item.desc) : 'Klik untuk melihat detail',
                                rowId: item.name
                            }))
                        });
                    }

                    try {
                        await shorekeeper.relayMessage(
                            m.chat,
                            {
                                listMessage: {
                                    title: `${(global.botname || 'shorekeeper').toUpperCase()} PRODUCT`,
                                    description: "Pilih salah satu produk di bawah untuk melihat detail.",
                                    buttonText: "Pilih Produk",
                                    listType: 1,
                                    sections: sections,
                                    footerText: `${(global.botname2 || global.botname || "Hitoshi MD V1").toUpperCase()}`
                                }
                            },
                            {
                                additionalNodes: [
                                    {
                                        tag: "biz",
                                        attrs: {},
                                        content: [
                                            {
                                                tag: "list",
                                                attrs: {
                                                    v: "2",
                                                    type: "product_list"
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        );
                    } catch (relayErr) {
                        console.error('[RELAY LIST ERROR]', relayErr?.message || relayErr);
                    }
                } catch (e) {
                    console.error('[LIST ERROR]', e);
                    try {
                        const listText = getListWithTemplate(chatId, m.pushName || 'User', 'Grup', sortedListGrup);
                        const menuQuote = await buildMenuJpmVerifiedQuote(m.sender).catch(() => ({}));
                        await shorekeeper.sendMessage(chatId, {
                            text: listText,
                            contextInfo: menuQuote.contextInfo || { mentionedJid: [m.sender] }
                        }, { quoted: menuQuote.quotedLocation || m });
                    } catch (err) {
                        Reply(global.mess?.error || 'Gagal memproses list.');
                    }
                }
            }
            break;

            case 'updatelist': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                
                if (!text || !text.includes('|')) return Reply(example("Burger|Dengan daging wagyu"));
                
                let parts = text.split('|');
                if (parts.length < 2) return Reply(example("Burger|Dengan daging wagyu"));
                
                const keyword = parts[0].trim();
                const deskripsiBaru = parts.slice(1).join('|').trim();
                
                const chatId = m.chat;
                const listDb = loadLists();
                let listGrup = listDb[chatId] || [];
                
                if (listGrup.length === 0) return Reply("❌ Tidak ada item di list");
                
                let itemIndex = listGrup.findIndex(item => 
                    item.name.toLowerCase() === keyword.toLowerCase() ||
                    item.name.toLowerCase().includes(keyword.toLowerCase())
                );
                
                if (itemIndex === -1) return Reply(`❌ Item "${keyword}" tidak ditemukan`);
                
                const itemLama = listGrup[itemIndex];
                listGrup[itemIndex].desc = deskripsiBaru;
                
                let mediaMsg = null;
                let mediaType = '';

                if (m.type === 'imageMessage') { mediaMsg = m; mediaType = 'image'; }
                else if (m.type === 'videoMessage') { mediaMsg = m; mediaType = 'video'; }
                else if (m.type === 'audioMessage') { mediaMsg = m; mediaType = 'audio'; }
                else if (m.type === 'stickerMessage') { mediaMsg = m; mediaType = 'sticker'; }
                else if (m.quoted) {
                    if (m.quoted.type === 'imageMessage') { mediaMsg = m.quoted; mediaType = 'image'; }
                    else if (m.quoted.type === 'videoMessage') { mediaMsg = m.quoted; mediaType = 'video'; }
                    else if (m.quoted.type === 'audioMessage') { mediaMsg = m.quoted; mediaType = 'audio'; }
                    else if (m.quoted.type === 'stickerMessage') { mediaMsg = m.quoted; mediaType = 'sticker'; }
                }

                if (mediaMsg) {
                    try {
                        if (itemLama.hasImage && itemLama.image && fs.existsSync(itemLama.image)) {
                            fs.unlinkSync(itemLama.image);
                        }
                        const mediaPath = await downloadAndSaveMedia(mediaMsg, mediaType);
                        listGrup[itemIndex].image = mediaPath;
                        listGrup[itemIndex].hasImage = true;
                    } catch (e) {}
                }
                
                listDb[chatId] = listGrup;
                saveLists(listDb);
                
                Reply(`✅ Item "${itemLama.name}" berhasil diperbarui!`);
            }
            break;

            case 'dellist': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                
                if (!text) return Reply(example("Burger"));
                
                const chatId = m.chat;
                const listDb = loadLists();
                let listGrup = listDb[chatId] || [];
                
                if (listGrup.length === 0) return Reply("❌ Tidak ada item di list");
                
                let itemDihapus = null;
                let index = -1;
                
                if (!isNaN(text)) {
                    index = parseInt(text) - 1;
                    if (index >= 0 && index < listGrup.length) {
                        itemDihapus = listGrup[index];
                    }
                } else {
                    const keyword = text.toLowerCase();
                    index = listGrup.findIndex(item => 
                        item.name.toLowerCase() === keyword ||
                        item.name.toLowerCase().includes(keyword)
                    );
                    if (index !== -1) {
                        itemDihapus = listGrup[index];
                    }
                }
                
                if (!itemDihapus) return Reply(`❌ Item "${text}" tidak ditemukan`);
                
                if (itemDihapus.hasImage && itemDihapus.image && fs.existsSync(itemDihapus.image)) {
                    try {
                        fs.unlinkSync(itemDihapus.image);
                    } catch (e) {}
                }
                
                listGrup.splice(index, 1);
                listDb[chatId] = listGrup;
                saveLists(listDb);
                
                Reply(`✅ Item "${itemDihapus.name}" berhasil dihapus dari list!`);
            }
            break;

            case 'clearlist': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                const chatId = m.chat;
                const listDb = loadLists();
                const listGrup = listDb[chatId] || [];

                if (listGrup.length === 0) return Reply('❌ Tidak ada item di list untuk dibersihkan.');

                const totalItem = listGrup.length;

                for (const item of listGrup) {
                    if (item.hasImage && item.image && fs.existsSync(item.image)) {
                        try { fs.unlinkSync(item.image); } catch (e) {}
                    }
                }

                delete listDb[chatId];
                saveLists(listDb);

                Reply(`✅ Berhasil membersihkan *${totalItem} item* dari list grup ini!`);
            }
            break;

            case 'dellistall': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                const chatId = m.chat;
                const listDb = loadLists();
                const listGrup = listDb[chatId] || [];

                if (listGrup.length === 0) return Reply(`❌ Tidak ada item di list`);

                const totalDihapus = listGrup.length;

                listGrup.forEach(item => {
                    if (item.hasImage && item.image && fs.existsSync(item.image)) {
                        try { fs.unlinkSync(item.image); } catch (e) {}
                    }
                });

                listDb[chatId] = [];
                saveLists(listDb);

                Reply(`✅ Semua produk (${totalDihapus} item) berhasil dihapus dari list!`);
            }
            break;

            case 'clist': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                const kanjiIcon = '╼ ׅ ֹ𔖰᷼𔖮';
                const chatId = m.chat;
                const listDb = loadLists();
                const listGrup = listDb[chatId] || [];

                if (listGrup.length === 0) {
                    return Reply(
`${kanjiIcon} *${toSmallCaps('cek list')}*
╭╼─┈───┈──⏣╼
┆品 ➤ ${toSmallCaps('status')} : *${toSmallCaps('belum ada item')}*
╰─╼𔕬─┈───┈───┈

Tambahkan lewat *${prefix}addlist nama|deskripsi*`
                    );
                }

                const sortedItems = [...listGrup].sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }));
                const rows = sortedItems.map(item => `┆品 ➤ ${toSmallCaps('produk')} : *${item.name.trim()}*`).join('\n');

                const cekText =
`${kanjiIcon} *${toSmallCaps('cek list')} (${listGrup.length} ${toSmallCaps('item')})*
╭╼─┈───┈──⏣╼
${rows}
╰─╼𔕬─┈───┈───┈`;

                const clickHint = `『 品 』${toSmallCaps('klik tombol di bawah untuk kelola list')}`;
                const bodyText = `${cekText}\n\n${clickHint}`;

                const hapusRows = sortedItems.map(item => ({
                    title: item.name,
                    description: toSmallCaps('klik untuk hapus item ini'),
                    id: `${prefix}dellist ${item.name}`
                }));

                try {
                    const btnClist = new (require('./library/baileys-mbuilder/index').ButtonV2)(shorekeeper);
                    btnClist.setBody(bodyText)
                        .setFooter(`${kanjiIcon} ${global.botname || 'Bot'} \u2022 ${toSmallCaps('kelola daftar produk')}`)
                        .setThumbnail(global.image?.menu || "https://i.ibb.co/2Y5zZYd/avatar.png")
                        .addRawButton({
                            buttonText: { displayText: `品 ${toSmallCaps('hapus semua')}` },
                            buttonId: 'diezy_clist_dellistall',
                            type: 1,
                            nativeFlowInfo: {
                                name: 'single_select',
                                paramsJson: JSON.stringify({
                                    title: `品 ${toSmallCaps('hapus semua produk')}`,
                                    sections: [{
                                        title: toSmallCaps('konfirmasi'),
                                        rows: [{
                                            title: toSmallCaps('ya, hapus semua produk'),
                                            description: toSmallCaps('tindakan ini tidak bisa dibatalkan'),
                                            id: `${prefix}dellistall`
                                        }]
                                    }]
                                })
                            }
                        })
                        .addRawButton({
                            buttonText: { displayText: `品 ${toSmallCaps('hapus item')}` },
                            buttonId: 'diezy_clist_hapus_item',
                            type: 1,
                            nativeFlowInfo: {
                                name: 'single_select',
                                paramsJson: JSON.stringify({
                                    title: `品 ${toSmallCaps('hapus item')}`,
                                    sections: [{ title: toSmallCaps('pilih item yang mau dihapus'), rows: hapusRows }]
                                })
                            }
                        });

                    await btnClist.send(chatId);
                } catch (err) {
                    console.error('Clist Buttonv2 Error:', err);
                    await shorekeeper.sendMessage(chatId, { text: bodyText }, { quoted: m });
                }
            }
            break;

            case 'resetlist': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                
                const settings = loadListSettings();
                
                if (settings[m.chat]) {
                    if (settings[m.chat].media && fs.existsSync(settings[m.chat].media)) {
                        try {
                            fs.unlinkSync(settings[m.chat].media);
                        } catch (e) {}
                    }
                    delete settings[m.chat];
                    saveListSettings(settings);
                }
                
                Reply(`✅ Template list berhasil direset ke default!`);
            }
            break;

            case 'setproses': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                if (!text) {
                    return Reply(`📝 Format: .setproses <template_pesan>

🔄 Variabel yang tersedia:
• @tanggal - Tanggal saat ini
• @jam - Waktu saat ini
• @status - Status pesanan (Proses)
• @item - Item/Produk yang dipesan
• @user - Tag user (akan otomatis tag user yang direply)
• @group - Nama grup

📋 Contoh:
.setproses template_proses_anda`);
                }

                const chatId = m.chat;
                let prosesMessages = loadProsesMessages();

                prosesMessages[chatId] = {
                    template: text.trim(),
                    setBy: m.sender,
                    setAt: Date.now()
                };

                saveProsesMessages(prosesMessages);

                const previewResponse = generateResponseWithMentions(text.trim(), "AM12", m, m.metadata);

                Reply(`✅ Template .proses berhasil diatur!\n\n📋 Preview:\n${previewResponse.text}\n\nℹ️ Gunakan: .proses [item] (reply ke user)`);
            }
            break;

            case 'setdone': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                if (!text) {
                    return Reply(`📝 Format: .setdone <template_pesan>

🔄 Variabel yang tersedia:
• @tanggal - Tanggal saat ini
• @jam - Waktu saat ini
• @status - Status pesanan (Selesai)
• @item - Item/Produk yang dipesan
• @user - Tag user (akan otomatis tag user yang direply)
• @group - Nama grup

📋 Contoh:
.setdone template_done_anda`);
                }

                const chatId = m.chat;
                let doneMessages = loadDoneMessages();

                doneMessages[chatId] = {
                    template: text.trim(),
                    setBy: m.sender,
                    setAt: Date.now()
                };

                saveDoneMessages(doneMessages);

                const previewResponse = generateResponseWithMentions(text.trim(), "AM12", m, m.metadata);

                Reply(`✅ Template .done berhasil diatur!\n\n📋 Preview:\n${previewResponse.text}\n\nℹ️ Gunakan: .done [item] (reply ke user)`);
            }
            break;

            case 'resetproses': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                let prosesMessages = loadProsesMessages();
                if (prosesMessages[m.chat]) {
                    delete prosesMessages[m.chat];
                    saveProsesMessages(prosesMessages);
                }
                Reply(`✅ Template .proses berhasil direset ke default!`);
            }
            break;

            case 'resetdone': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                let doneMessages = loadDoneMessages();
                if (doneMessages[m.chat]) {
                    delete doneMessages[m.chat];
                    saveDoneMessages(doneMessages);
                }
                Reply(`✅ Template .done berhasil direset ke default!`);
            }
            break;

            case 'proses': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                if (!m.quoted) {
                    return Reply('❌ Reply pesan user yang mau diproses!\nContoh: .proses AM12 (reply ke user)');
                }

                const prosesMessages = loadProsesMessages();
                const template = (prosesMessages[m.chat] && prosesMessages[m.chat].template)
                    ? prosesMessages[m.chat].template
                    : defaultProsesTemplate;

                const item = text || "Produk";
                const responseData = generateResponseWithMentions(template, item, m.quoted, m.metadata);

                await shorekeeper.sendMessage(m.chat, {
                    text: responseData.text,
                    mentions: responseData.mentions
                }, { quoted: m.quoted });
            }
            break;

            case 'done': {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                if (!m.quoted) {
                    return Reply('❌ Reply pesan user yang sudah selesai!\nContoh: .done AM12 (reply ke user)');
                }

                const doneMessages = loadDoneMessages();
                const template = (doneMessages[m.chat] && doneMessages[m.chat].template)
                    ? doneMessages[m.chat].template
                    : defaultDoneTemplate;

                const item = text || "Produk";
                const responseData = generateResponseWithMentions(template, item, m.quoted, m.metadata);

                await shorekeeper.sendMessage(m.chat, {
                    text: responseData.text,
                    mentions: responseData.mentions
                }, { quoted: m.quoted });
            }
            break;

            case "setpay": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                if (!text) {
                    return Reply(
                        `╭─❏ Set payment\n│▣ Format : .setpay keyword|nomor\n│▣ Contoh : .setpay dana|08123456789\n│▣ Wajib reply foto → jadi thumbnail\n╰──────────❏`
                    );
                }

                const paymentDBPath = './library/database/autopay.json';

                function loadPayments() {
                    try {
                        if (!fs.existsSync(paymentDBPath)) return {};
                        return JSON.parse(fs.readFileSync(paymentDBPath));
                    } catch (e) {
                        return {};
                    }
                }

                function savePayments(data) {
                    fs.writeFileSync(paymentDBPath, JSON.stringify(data, null, 2));
                }

                if (text.startsWith('tbuttonurl ')) {
                    const rest = text.substring(11).trim();
                    if (!rest.includes('|')) {
                        return Reply(
                            `╭─❏ Set payment - Gagal\n│▣ Alasan : Format salah\n│▣ Format : .setpay tbuttonurl keyword|url\n│▣ Contoh : .setpay tbuttonurl dana|https://link.dana.id\n╰──────────❏`
                        );
                    }

                    const [keyword, url] = rest.split('|').map(s => s.trim());
                    if (!keyword || !url) {
                        return Reply(
                            `╭─❏ Set payment - Gagal\n│▣ Alasan : Keyword dan URL harus diisi\n│▣ Format : .setpay tbuttonurl keyword|url\n╰──────────❏`
                        );
                    }

                    const db = loadPayments();
                    const existingPayment = db[m.chat]?.payments?.[keyword];

                    if (!existingPayment) {
                        return Reply(
                            `╭─❏ Set payment - Gagal\n│▣ Alasan : Payment "${keyword}" belum ada\n│▣ Buat dulu : .setpay ${keyword}|<nomor>\n│▣ Wajib : Reply foto sebagai thumbnail\n╰──────────❏`
                        );
                    }

                    const finalUrl = url.startsWith('http') ? url : 'https://' + url;
                    db[m.chat].payments[keyword].type = 'buttonurl';
                    db[m.chat].payments[keyword].buttonUrl = finalUrl;
                    db[m.chat].payments[keyword].updatedAt = Date.now();

                    savePayments(db);

                    return Reply(
                        `╭─❏ Set payment - Berhasil\n│▣ Keyword : ${keyword}\n│▣ Tipe : Button URL\n│▣ Nomor : ${existingPayment.value}\n│▣ URL : ${finalUrl}\n╰──────────❏`
                    );
                } else {
                    if (!text.includes('|')) {
                        return Reply(
                            `╭─❏ Set payment - Gagal\n│▣ Alasan : Format salah\n│▣ Format : .setpay keyword|nomor\n│▣ Contoh : .setpay dana|08123456789\n│▣ Wajib : Reply foto sebagai thumbnail\n╰──────────❏`
                        );
                    }

                    const [keyword, nomor] = text.split('|').map(s => s.trim());
                    if (!keyword || !nomor) {
                        return Reply(
                            `╭─❏ Set payment - Gagal\n│▣ Alasan : Keyword dan nomor harus diisi\n│▣ Format : .setpay keyword|nomor\n╰──────────❏`
                        );
                    }

                    if (!m.quoted || !(m.quoted.type === 'imageMessage' || m.quoted.msg?.imageMessage)) {
                        return Reply(
                            `╭─❏ Set payment - Gagal\n│▣ Alasan : Wajib reply foto sebagai thumbnail\n╰──────────❏`
                        );
                    }

                    try {
                        const mediaDir = './library/media/payments/';
                        if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

                        const quotedMsg = m.quoted.msg || m.quoted;
                        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
                        const mediaBuffer = await downloadContentFromMessage(quotedMsg, 'image');

                        let buffer = Buffer.from([]);
                        for await (const chunk of mediaBuffer) {
                            buffer = Buffer.concat([buffer, chunk]);
                        }

                        const timestamp = Date.now();
                        const random = Math.random().toString(36).substring(7);
                        const imagePath = `${mediaDir}${m.chat.replace('@g.us', '')}_${keyword}_${timestamp}_${random}.jpg`;
                        fs.writeFileSync(imagePath, buffer);

                        const db = loadPayments();
                        if (!db[m.chat]) db[m.chat] = { payments: {} };

                        db[m.chat].payments[keyword] = {
                            type: 'text',
                            value: nomor,
                            buttonUrl: null,
                            image: imagePath,
                            setBy: m.sender,
                            setAt: Date.now()
                        };

                        savePayments(db);

                        return Reply(
                            `╭─❏ Set payment - Berhasil\n│▣ Keyword : ${keyword}\n│▣ Nomor : ${nomor}\n│▣ Tipe : Text\n│▣ Thumbnail : Tersedia\n╰──────────❏\n\nUpgrade ke button url:\n.setpay tbuttonurl ${keyword}|<url>`
                        );

                    } catch (e) {
                        return Reply(
                            `╭─❏ Set payment - Gagal\n│▣ Alasan : Gagal menyimpan foto QR\n╰──────────❏`
                        );
                    }
                }
            }
            break;

            case "listpay": {
                if (!m.isGroup) return Reply(global.mess.group);

                const paymentDBPath = './library/database/autopay.json';

                function loadPayments() {
                    try {
                        if (!fs.existsSync(paymentDBPath)) return {};
                        return JSON.parse(fs.readFileSync(paymentDBPath));
                    } catch (e) {
                        return {};
                    }
                }

                const db = loadPayments();
                const groupPayments = db[m.chat]?.payments;

                if (!groupPayments || Object.keys(groupPayments).length === 0) {
                    return Reply('📭 Tidak ada payment di grup ini');
                }

                let list = '📋 DAFTAR PAYMENT\n\n';
                for (const [keyword, data] of Object.entries(groupPayments)) {
                    list += `• ${keyword} (${data.type === 'buttonurl' ? '🔗 URL' : '📝 Text'})\n`;
                }
                list += `\nTotal: ${Object.keys(groupPayments).length} payment`;

                Reply(list);
            }
            break;

            case "delpay": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                if (!text) return Reply('Format: .delpay dana');

                const paymentDBPath = './library/database/autopay.json';

                function loadPayments() {
                    try {
                        if (!fs.existsSync(paymentDBPath)) return {};
                        return JSON.parse(fs.readFileSync(paymentDBPath));
                    } catch (e) {
                        return {};
                    }
                }

                function savePayments(data) {
                    fs.writeFileSync(paymentDBPath, JSON.stringify(data, null, 2));
                }

                const keyword = text.trim().toLowerCase();
                const db = loadPayments();

                if (!db[m.chat] || !db[m.chat].payments || !db[m.chat].payments[keyword]) {
                    return Reply(`❌ Payment "${keyword}" tidak ditemukan`);
                }

                const paymentData = db[m.chat].payments[keyword];

                if (paymentData.image && fs.existsSync(paymentData.image)) {
                    try { fs.unlinkSync(paymentData.image); } catch (e) {}
                }

                delete db[m.chat].payments[keyword];
                savePayments(db);

                Reply(`✅ Payment "${keyword}" berhasil dihapus`);
            }
            break;

            case "pay":
            case "payment": {
                if (!m.isGroup) return Reply(global.mess.group);

                const paymentDBPath = './library/database/autopay.json';

                let payments = [];
                let hasCustom = false;

                try {
                    if (fs.existsSync(paymentDBPath)) {
                        const db = JSON.parse(fs.readFileSync(paymentDBPath));
                        if (db[m.chat] && db[m.chat].payments) {
                            const raw = db[m.chat].payments;
                            for (const [key, val] of Object.entries(raw)) {
                                payments.push({
                                    label: key.toUpperCase(),
                                    value: val.value || val.buttonUrl || '',
                                    type: val.type || 'text',
                                    buttonUrl: val.buttonUrl || null,
                                    image: val.image || null
                                });
                            }
                            hasCustom = payments.length > 0;
                        }
                    }
                } catch (e) {}

                if (!hasCustom) {
                    if (global.payment?.dana || global.dana) payments.push({ label: 'DANA', value: global.payment?.dana || global.dana, type: 'text' });
                    if (global.payment?.gopay || global.gopay) payments.push({ label: 'GOPAY', value: global.payment?.gopay || global.gopay, type: 'text' });
                    if (global.payment?.qris || global.image?.qris) {
                        payments.push({
                            label: 'QRIS',
                            value: global.payment?.qris || global.image.qris,
                            type: 'buttonurl',
                            buttonUrl: global.payment?.qris || global.image.qris
                        });
                    }
                }

                if (payments.length === 0) {
                    return Reply(
                        `\`⌜ ᴘᴀʏᴍᴇɴᴛ ⌟\`\n> ◦ ➢ sᴛᴀᴛᴜs : ʙᴇʟᴜᴍ ᴀᴅᴀ ᴍᴇᴛᴏᴅᴇ\n> ◦ ➢ sᴇᴛᴛɪɴɢ : .setpay ᴅᴀɴᴀ|ɴᴏᴍᴏʀ`
                    );
                }

                let nominal = 0;
                if (args[0]) {
                    const cleaned = args[0].replace(/[^0-9]/g, '');
                    if (cleaned) nominal = parseInt(cleaned, 10);
                }
                const nominalStr = nominal > 0 ? 'Rp ' + nominal.toLocaleString('id-ID') : '';

                const MB = require("./library/baileys-mbuilder/index");
                const carousel = new MB.Carousel(shorekeeper);
                carousel.setBody(
                    nominalStr
                        ? `*_⏤͟͟͞͞ Payment Clutch_*\n💰 Total Tagihan : *${nominalStr}*`
                        : `*_⏤͟͟͞͞ Payment Clutch_*`
                );

                for (const p of payments) {
                    const isQris = p.type === 'buttonurl';

                    let cardImageUrl = p.image || (isQris
                        ? (p.buttonUrl || p.value)
                        : (global.payment?.qris || global.image?.qris || global.image?.menu || "https://i.ibb.co/2Y5zZYd/avatar.png"));

                    let cardBuffer;
                    try {
                        if (/^https?:\/\//i.test(cardImageUrl)) {
                            cardBuffer = await MB.Toolkit.fetchBuffer(cardImageUrl, {}, { silent: true });
                        } else if (fs.existsSync(cardImageUrl)) {
                            cardBuffer = fs.readFileSync(cardImageUrl);
                        }
                    } catch (e) {}
                    if (!cardBuffer || cardBuffer.length === 0) {
                        try { cardBuffer = await MB.Toolkit.fetchBuffer("https://i.ibb.co/2Y5zZYd/avatar.png", {}, { silent: true }); } catch (err) {}
                    }

                    let titleText = `${p.label} : ${p.value}${nominalStr ? `\n*Total:* ${nominalStr}` : ''}`;

                    const card = new MB.Button(shorekeeper);
                    card.setTitle(titleText);
                    if (cardBuffer && cardBuffer.length > 0) card.setImage(cardBuffer);

                    if (isQris && p.buttonUrl) {
                        card.addUrl("📱 Lihat QRIS", p.buttonUrl);
                    } else {
                        card.addUrl("✅ Konfirmasi Bayar", `https://wa.me/${global.owner}`);
                    }

                    carousel.addCard(await card.toCard());
                }

                await carousel.send(m.chat, { quoted: m });
            }
            break;

            case "tiktok":
            case "tt":
            case "ttdl":
            case "tiktokdl":
            case "tiktokmp3":
            case "ttmp3":
            case "tiktokaudio": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const urlMatch = (text || '').match(/(https?:\/\/[^\s]+)/i);
                const targetUrl = urlMatch ? urlMatch[0] : (text || '').trim();
                if (!targetUrl || !targetUrl.includes('tiktok.com')) {
                    return Reply(example("https://vt.tiktok.com/ZSqfG4kQ1/"));
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    let result = null;
                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;

                    // 1. Coba lewat API Clutch
                    try {
                        const apiUrl = `${baseUrl}/download/tiktok?apikey=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
                        const response = await axios.get(apiUrl, { timeout: 20000 });
                        if (response.data?.status && response.data?.result) {
                            result = response.data.result;
                        }
                    } catch (e) {
                        console.error('Clutch API error, mencoba fallback TikWM:', e?.message);
                    }

                    // 2. Fallback langsung ke TikWM jika API Clutch kosong / error
                    if (!result || !result.data) {
                        try {
                            const tikwmRes = await axios.post("https://www.tikwm.com/api/", {}, {
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                                },
                                params: { url: targetUrl, count: 12, cursor: 0, web: 1, hd: 1 },
                                timeout: 20000
                            });
                            const d = tikwmRes.data?.data;
                            if (d) {
                                let dataItems = [];
                                if (d.duration == 0 && Array.isArray(d.images)) {
                                    dataItems = d.images.map(img => ({ type: "photo", url: img }));
                                } else {
                                    if (d.hdplay) dataItems.push({ type: "nowatermark_hd", url: "https://www.tikwm.com" + d.hdplay });
                                    if (d.play) dataItems.push({ type: "nowatermark", url: "https://www.tikwm.com" + d.play });
                                    if (d.wmplay) dataItems.push({ type: "watermark", url: "https://www.tikwm.com" + d.wmplay });
                                }
                                result = {
                                    title: d.title,
                                    durations: d.duration,
                                    duration: `${d.duration} Seconds`,
                                    cover: d.cover ? "https://www.tikwm.com" + d.cover : null,
                                    data: dataItems,
                                    music_info: {
                                        id: d.music_info?.id,
                                        title: d.music_info?.title || d.music || 'TikTok Audio',
                                        author: d.music_info?.author,
                                        url: d.music_info?.play ? "https://www.tikwm.com" + d.music_info.play : (d.music ? "https://www.tikwm.com" + d.music : null)
                                    },
                                    stats: {
                                        views: d.play_count,
                                        likes: d.digg_count,
                                        comment: d.comment_count,
                                        share: d.share_count
                                    },
                                    author: {
                                        id: d.author?.id,
                                        nickname: d.author?.nickname,
                                        fullname: d.author?.unique_id,
                                        avatar: d.author?.avatar ? "https://www.tikwm.com" + d.author?.avatar : null
                                    }
                                };
                            }
                        } catch (e2) {
                            console.error('TikWM fallback error:', e2?.message);
                        }
                    }

                    if (!result || !result.data || result.data.length === 0) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return Reply("❌ Konten TikTok tidak ditemukan. Pastikan tautan masih aktif, video bukan privat, dan link benar.");
                    }

                    const isAudioOnly = command === 'tiktokmp3' || command === 'ttmp3' || command === 'tiktokaudio';
                    
                    // Helper cerdas untuk mendapatkan buffer audio TikTok
                    const getAudioBuffer = async () => {
                        let directUrl = result.music_info?.play || (result.music_info?.url && !result.music_info.url.includes('tikwm.com/video/music') ? result.music_info.url : null);
                        
                        if (directUrl) {
                            try {
                                const aRes = await axios.get(directUrl, {
                                    responseType: 'arraybuffer',
                                    timeout: 15000,
                                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                                });
                                if (aRes.data && aRes.data.length > 5000) return Buffer.from(aRes.data);
                            } catch (e) {}
                        }

                        // Fetch direct audio stream via TikWM API
                        try {
                            const tikwmRes = await axios.post("https://www.tikwm.com/api/", {}, {
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
                                },
                                params: { url: targetUrl, count: 12, cursor: 0, web: 1, hd: 1 },
                                timeout: 15000
                            });
                            const musicStreamUrl = tikwmRes.data?.data?.music_info?.play || (tikwmRes.data?.data?.music?.startsWith("http") ? tikwmRes.data.data.music : null);
                            if (musicStreamUrl) {
                                const aRes = await axios.get(musicStreamUrl, {
                                    responseType: 'arraybuffer',
                                    timeout: 15000,
                                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                                });
                                if (aRes.data && aRes.data.length > 5000) return Buffer.from(aRes.data);
                            }
                        } catch (e2) {}

                        return null;
                    };

                    // Jika command khusus mp3/audio
                    if (isAudioOnly) {
                        const audioBuf = await getAudioBuffer();
                        if (audioBuf) {
                            await shorekeeper.sendMessage(m.chat, {
                                audio: audioBuf,
                                mimetype: 'audio/mpeg',
                                ptt: false,
                                fileName: `${result.music_info?.title || 'tiktok_audio'}.mp3`
                            }, { quoted: m });
                            addLimit(m.sender, isCreator);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                            return;
                        } else {
                            await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                            return Reply("❌ Audio tidak ditemukan untuk konten ini.");
                        }
                    }

                    const captionText = `\`⌜ TikTok Downloader ⌟\`
> ◦ *Judul :* ${result.title || '-'}
> ◦ *Author :* ${result.author?.nickname || result.author?.fullname || '-'}
> ◦ *Likes :* ${result.stats?.likes || '0'}
> ◦ *Komentar :* ${result.stats?.comment || '0'}
> ◦ *Share :* ${result.stats?.share || '0'}
> ◦ *Views :* ${result.stats?.views || '0'}
> ◦ *Audio :* ${result.music_info?.title || '-'}`;

                    const isPhotoSlide = result.durations === 0 || result.duration === "0 Seconds" || result.data?.some(e => e.type === 'photo');

                    if (isPhotoSlide) {
                        const photos = (result.data || []).filter(e => e.type === 'photo' || e.url);
                        if (photos.length > 1) {
                            const albumItems = photos.map((p, idx) => ({
                                image: { url: p.url },
                                ...(idx === 0 ? { caption: captionText } : {})
                            }));
                            await shorekeeper.sendMessage(m.chat, {
                                albumMessage: albumItems
                            }, { quoted: m });
                        } else if (photos.length === 1) {
                            await shorekeeper.sendMessage(m.chat, {
                                image: { url: photos[0].url },
                                caption: captionText
                            }, { quoted: m });
                        } else {
                            await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                            return Reply("❌ Tidak ada media foto yang dapat diunduh.");
                        }
                    } else {
                        const videoObj = (result.data || []).find(e => e.type === "nowatermark_hd") || 
                                         (result.data || []).find(e => e.type === "nowatermark") || 
                                         (result.data || []).find(e => e.type === "watermark") || 
                                         result.data?.[0];
                        if (videoObj && videoObj.url) {
                            await shorekeeper.sendMessage(m.chat, {
                                video: { url: videoObj.url },
                                caption: captionText
                            }, { quoted: m });
                        } else {
                            await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                            return Reply("❌ Gagal menemukan URL video TikTok.");
                        }
                    }

                    // Kirim audio TikTok otomatis jika tersedia
                    try {
                        const audioBuf = await getAudioBuffer();
                        if (audioBuf) {
                            await shorekeeper.sendMessage(m.chat, {
                                audio: audioBuf,
                                mimetype: 'audio/mpeg',
                                ptt: false,
                                fileName: `${result.music_info?.title || 'tiktok_audio'}.mp3`
                            }, { quoted: m });
                        }
                    } catch (audioErr) {
                        console.error("Gagal kirim audio tiktok:", audioErr?.message);
                    }

                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('tiktok dl error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Terjadi kesalahan saat mengunduh TikTok: ${err?.response?.data?.error || err.message}`);
                }
            }
            break;

            case "ig":
            case "instagram":
            case "igdl":
            case "instagramdl": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const urlMatch = (text || '').match(/(https?:\/\/[^\s]+)/i);
                const targetUrl = urlMatch ? urlMatch[0] : (text || '').trim();
                if (!targetUrl || !targetUrl.includes('instagram.com')) {
                    return Reply(example("https://www.instagram.com/reel/xxxx/"));
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;
                    const apiUrl = `${baseUrl}/download/instagram?apikey=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
                    const response = await axios.get(apiUrl, { timeout: 30000 });
                    const json = response.data;

                    if (!json.status || !json.result || !json.result.data || json.result.data.length === 0) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return Reply(json.error || "❌ Gagal mengunduh konten Instagram. Pastikan akun tidak privat dan link valid.");
                    }

                    const result = json.result;
                    const captionText = `\`⌜ Instagram Downloader ⌟\`
> ◦ *Username :* ${result.profile?.username || '-'}
> ◦ *Caption :* ${result.caption?.text || '-'}
> ◦ *Likes :* ${result.statistics?.like || '-'}
> ◦ *Comments :* ${result.statistics?.comment || '-'}
> ◦ *Share :* ${result.statistics?.share || '0'}`;

                    const mediaList = result.data || [];

                    if (mediaList.length > 1) {
                        const albumItems = mediaList.map((item, idx) => {
                            if (item.type === 'video') {
                                return {
                                    video: { url: item.url },
                                    ...(idx === 0 ? { caption: captionText } : {})
                                };
                            } else {
                                return {
                                    image: { url: item.url },
                                    ...(idx === 0 ? { caption: captionText } : {})
                                };
                            }
                        });
                        await shorekeeper.sendMessage(m.chat, {
                            albumMessage: albumItems
                        }, { quoted: m });
                    } else if (mediaList.length === 1) {
                        const item = mediaList[0];
                        if (item.type === 'video') {
                            await shorekeeper.sendMessage(m.chat, {
                                video: { url: item.url },
                                caption: captionText
                            }, { quoted: m });
                        } else {
                            await shorekeeper.sendMessage(m.chat, {
                                image: { url: item.url },
                                caption: captionText
                            }, { quoted: m });
                        }
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('instagram dl error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Terjadi kesalahan saat mengunduh Instagram: ${err?.response?.data?.error || err.message}`);
                }
            }
            break;

            case "capcut":
            case "cc":
            case "capcutdl": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || m.quoted?.caption || '';
                if (!targetUrl || targetUrl.trim().length === 0) {
                    return Reply(example("https://www.capcut.com/tv2/ZSqaGCJUv/"));
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await downloadCapcut(targetUrl);
                    const captionText = `\`⌜ CapCut Downloader ⌟\`\n> ◦ *Judul :* ${result.title || '-'}\n> ◦ *Author :* ${result.author || '-'}\n> ◦ *Kualitas :* HD (No Watermark)`;

                    if (result.buffer) {
                        await shorekeeper.sendMessage(m.chat, {
                            video: result.buffer,
                            caption: captionText,
                            mimetype: 'video/mp4'
                        }, { quoted: m });
                    } else if (result.videoUrl) {
                        await shorekeeper.sendMessage(m.chat, {
                            video: { url: result.videoUrl },
                            caption: captionText,
                            mimetype: 'video/mp4'
                        }, { quoted: m });
                    } else {
                        throw new Error("Gagal memuat video CapCut.");
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('CapCut dl error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Terjadi kesalahan saat mengunduh CapCut: ${err?.message || err}`);
                }
            }
            break;

            case "facebook":
            case "fb":
            case "fbdl": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || m.quoted?.caption || '';
                if (!targetUrl || targetUrl.trim().length === 0) {
                    return Reply(example("https://www.facebook.com/share/r/1DP7ECk3Cf/"));
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await downloadFacebook(targetUrl);
                    const captionText = `\`⌜ Facebook Downloader ⌟\`\n> ◦ *Judul :* ${result.title || 'Facebook Video'}\n> ◦ *Kualitas :* ${result.quality || 'HD'}`;

                    if (result.buffer) {
                        await shorekeeper.sendMessage(m.chat, {
                            video: result.buffer,
                            caption: captionText,
                            mimetype: 'video/mp4'
                        }, { quoted: m });
                    } else if (result.videoUrl) {
                        await shorekeeper.sendMessage(m.chat, {
                            video: { url: result.videoUrl },
                            caption: captionText,
                            mimetype: 'video/mp4'
                        }, { quoted: m });
                    } else {
                        throw new Error("Gagal memuat video Facebook.");
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('Facebook dl error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Terjadi kesalahan saat mengunduh Facebook: ${err?.message || err}`);
                }
            }
            break;

            case "spotify":
            case "spotdl":
            case "spotifydl": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || m.quoted?.caption || '';
                if (!targetUrl || targetUrl.trim().length === 0) {
                    return Reply(example("https://open.spotify.com/track/3JkDuxcnIzBUngCk6peKZi..."));
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await downloadSpotify(targetUrl);
                    const captionText = `\`⌜ Spotify Downloader ⌟\`\n> ◦ *Judul :* ${result.title || 'Spotify Track'}\n> ◦ *Artis :* ${result.artist || 'Unknown Artist'}\n> ◦ *Durasi :* ${result.duration || '-'}`;

                    if (result.image) {
                        try {
                            await shorekeeper.sendMessage(m.chat, {
                                image: { url: result.image },
                                caption: captionText
                            }, { quoted: m });
                        } catch (imgErr) {}
                    }

                    if (result.buffer) {
                        await shorekeeper.sendMessage(m.chat, {
                            audio: result.buffer,
                            mimetype: 'audio/mpeg',
                            fileName: `${result.title || 'spotify'}.mp3`
                        }, { quoted: m });
                    } else if (result.download) {
                        await shorekeeper.sendMessage(m.chat, {
                            audio: { url: result.download },
                            mimetype: 'audio/mpeg',
                            fileName: `${result.title || 'spotify'}.mp3`
                        }, { quoted: m });
                    } else {
                        throw new Error("Gagal memuat audio Spotify.");
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('Spotify dl error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Terjadi kesalahan saat mengunduh Spotify: ${err?.message || err}`);
                }
            }
            break;

            case "play":
            case "playmusic":
            case "lagu":
            case "music": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                if (!text || text.trim().length === 0) {
                    return Reply(example("La la lost you"));
                }

                const query = text.trim();
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    // 1. Coba via Clutch API Play
                    let playData = null;
                    try {
                        const playRes = await axios.get(`${baseUrl}/download/play?apikey=${apiKey}&query=${encodeURIComponent(query)}`, {
                            timeout: 25000,
                            headers: { 'User-Agent': 'Mozilla/5.0' }
                        });
                        if (playRes.data?.status && playRes.data?.result) {
                            playData = playRes.data.result;
                        }
                    } catch (ePlay) {}

                    if (playData && (playData.audio || playData.download)) {
                        const captionInfo = `\`⌜ Play Music ⌟\`
> ◦ *Judul :* ${playData.title || query}
> ◦ *Channel :* ${playData.author?.name || '-'}
> ◦ *Durasi :* ${playData.duration || '-'}
> ◦ *Views :* ${playData.views || '-'}
> ◦ *Diunggah :* ${playData.ago || '-'}`;

                        if (playData.thumbnail) {
                            await shorekeeper.sendMessage(m.chat, {
                                image: { url: playData.thumbnail },
                                caption: captionInfo
                            }, { quoted: m });
                        } else {
                            await Reply(captionInfo);
                        }

                        const audioUrl = playData.audio || playData.download;
                        try {
                            const aRes = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 30000 });
                            await shorekeeper.sendMessage(m.chat, {
                                audio: Buffer.from(aRes.data),
                                mimetype: 'audio/mpeg',
                                fileName: `${playData.title || 'music'}.mp3`
                            }, { quoted: m });
                        } catch (errAudio) {
                            await shorekeeper.sendMessage(m.chat, {
                                audio: { url: audioUrl },
                                mimetype: 'audio/mpeg',
                                fileName: `${playData.title || 'music'}.mp3`
                            }, { quoted: m });
                        }

                        addLimit(m.sender, isCreator);
                        return await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    }

                    // 2. Fallback via AnaBot Playmusic
                    const initRes = await axios.get(`https://anabot.my.id/api/download/playmusic?query=${encodeURIComponent(query)}&apikey=freeApikey`, {
                        timeout: 25000
                    });

                    const taskId = initRes.data?.data?.taskId;
                    if (!initRes.data?.success || !taskId) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return Reply("❌ Gagal memulai proses pencarian musik.");
                    }

                    let completedData = null;
                    for (let i = 0; i < 20; i++) {
                        await new Promise(res => setTimeout(res, 2000));
                        try {
                            const statusRes = await axios.get(`https://anabot.my.id/api/download/status?id=${taskId}&apikey=freeApikey`, { timeout: 15000 });
                            if (statusRes.data?.status === 'completed' && statusRes.data?.data) {
                                completedData = statusRes.data.data;
                                break;
                            }
                        } catch (pollErr) {}
                    }

                    if (!completedData || !completedData.urls) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return Reply(`❌ Lagu "${query}" tidak ditemukan atau proses unduhan timeout.`);
                    }

                    const metadata = completedData.metadata || {};
                    const formatDuration = (seconds) => {
                        if (!seconds || isNaN(seconds)) return '-';
                        const mins = Math.floor(seconds / 60);
                        const secs = seconds % 60;
                        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                    };

                    const captionInfo = `\`⌜ Play Music ⌟\`
> ◦ *Judul :* ${metadata.title || query}
> ◦ *Channel :* ${metadata.channel || metadata.uploader || '-'}
> ◦ *Durasi :* ${formatDuration(metadata.duration)}
> ◦ *Views :* ${metadata.view_count ? Number(metadata.view_count).toLocaleString('id-ID') : '-'}`;

                    if (metadata.thumbnail) {
                        await shorekeeper.sendMessage(m.chat, {
                            image: { url: metadata.thumbnail },
                            caption: captionInfo
                        }, { quoted: m });
                    } else {
                        await Reply(captionInfo);
                    }

                    const aRes = await axios.get(completedData.urls, { responseType: 'arraybuffer', timeout: 30000 });
                    await shorekeeper.sendMessage(m.chat, {
                        audio: Buffer.from(aRes.data),
                        mimetype: 'audio/mpeg',
                        fileName: `${metadata.title || 'music'}.mp3`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('play music error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Terjadi kesalahan saat memutar musik: ${err?.message}`);
                }
            }
            break;

            case "play2": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                try {
                    const play2Plugin = require('./plugins/play2');
                    await play2Plugin(m, {
                        shorekeeper,
                        command,
                        text,
                        prefix,
                        isCreator,
                        isPremium: isPrem,
                        checkLimit,
                        addLimit,
                        Reply
                    });
                } catch (err) {
                    console.error('play2 error:', err);
                    Reply(`❌ Gagal memproses play2: ${err?.message || err}`);
                }
            }
            break;

            case "ytmp3":
            case "ytaudio": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || m.quoted?.caption || '';
                if (!targetUrl || targetUrl.trim().length === 0) {
                    return Reply(example("https://www.youtube.com/watch?v=kXYiU_JCYtU"));
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/download/ytmp3?apikey=${apiKey}&url=${encodeURIComponent(targetUrl.trim())}`, {
                        timeout: 35000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });

                    const data = res.data?.result || res.data?.data;
                    if (!data || (!data.audio && !data.download)) {
                        throw new Error(res.data?.error || "Gagal mengunduh audio YouTube.");
                    }

                    const captionInfo = `\`⌜ YouTube MP3 Downloader ⌟\`
> ◦ *Judul :* ${data.title || 'YouTube Audio'}
> ◦ *Durasi :* ${data.duration || '-'}`;

                    if (data.thumbnail) {
                        try {
                            await shorekeeper.sendMessage(m.chat, { image: { url: data.thumbnail }, caption: captionInfo }, { quoted: m });
                        } catch (e) {}
                    }

                    const audioUrl = data.audio || data.download;
                    try {
                        const aRes = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 35000 });
                        await shorekeeper.sendMessage(m.chat, {
                            audio: Buffer.from(aRes.data),
                            mimetype: 'audio/mpeg',
                            fileName: `${data.title || 'youtube'}.mp3`
                        }, { quoted: m });
                    } catch (eDl) {
                        await shorekeeper.sendMessage(m.chat, {
                            audio: { url: audioUrl },
                            mimetype: 'audio/mpeg',
                            fileName: `${data.title || 'youtube'}.mp3`
                        }, { quoted: m });
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('ytmp3 error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal mengunduh YouTube MP3: ${err?.message || err}`);
                }
            }
            break;

            case "ytmp4":
            case "ytvideo":
            case "yt": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || m.quoted?.caption || '';
                if (!targetUrl || targetUrl.trim().length === 0) {
                    return Reply(example("https://www.youtube.com/watch?v=kXYiU_JCYtU"));
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/download/youtube?apikey=${apiKey}&url=${encodeURIComponent(targetUrl.trim())}&quality=720p`, {
                        timeout: 45000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });

                    const data = res.data?.result || res.data?.data;
                    if (!data || (!data.video && !data.download)) {
                        throw new Error(res.data?.error || "Gagal mengunduh video YouTube.");
                    }

                    const videoUrl = data.video || data.download;
                    const captionInfo = `\`⌜ YouTube MP4 Downloader ⌟\`
> ◦ *Judul :* ${data.title || 'YouTube Video'}
> ◦ *Durasi :* ${data.duration || '-'}`;

                    let finalVideoBuffer = null;
                    try {
                        const vRes = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 60000 });
                        finalVideoBuffer = Buffer.from(vRes.data);
                    } catch (dlErr) {
                        console.error('ytmp4 download buffer error:', dlErr?.message || dlErr);
                    }

                    if (finalVideoBuffer) {
                        await shorekeeper.sendMessage(m.chat, {
                            video: finalVideoBuffer,
                            caption: captionInfo,
                            mimetype: 'video/mp4'
                        }, { quoted: m });
                    } else {
                        await shorekeeper.sendMessage(m.chat, {
                            video: { url: videoUrl },
                            caption: captionInfo,
                            mimetype: 'video/mp4'
                        }, { quoted: m });
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('ytmp4 error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal mengunduh YouTube MP4: ${err?.message || err}`);
                }
            }
            break;

            case "playch": {
                if (!isCreator) return Reply(global.mess.owner);

                if (!text || text.trim().length === 0) {
                    return Reply(
                        `\`⌜ Contoh Penggunaan ⌟\`\n> ◦ *Format :* playch <judul_lagu> | <link_channel>\n> ◦ *Contoh :* playch Steal The Show | https://whatsapp.com/channel/xxx`
                    );
                }

                let targetChannel = '';
                let songTitle = '';

                if (text.includes('|')) {
                    const parts = text.split('|');
                    const p0 = parts[0].trim();
                    const p1 = parts.slice(1).join('|').trim();

                    if (p0.includes('whatsapp.com/channel/') || p0.endsWith('@newsletter')) {
                        targetChannel = p0;
                        songTitle = p1;
                    } else {
                        songTitle = p0;
                        targetChannel = p1;
                    }
                } else {
                    const words = text.trim().split(/\s+/);
                    if (words[0].includes('whatsapp.com/channel/') || words[0].endsWith('@newsletter')) {
                        targetChannel = words[0];
                        songTitle = words.slice(1).join(' ');
                    } else if (words[words.length - 1].includes('whatsapp.com/channel/') || words[words.length - 1].endsWith('@newsletter')) {
                        targetChannel = words[words.length - 1];
                        songTitle = words.slice(0, -1).join(' ');
                    } else {
                        return Reply(
                            `\`⌜ Contoh Penggunaan ⌟\`\n> ◦ *Format :* playch <judul_lagu> | <link_channel>\n> ◦ *Contoh :* playch Steal The Show | https://whatsapp.com/channel/xxx`
                        );
                    }
                }

                if (!targetChannel || !songTitle) {
                    return Reply(
                        `\`⌜ Contoh Penggunaan ⌟\`\n> ◦ *Format :* playch <judul_lagu> | <link_channel>\n> ◦ *Contoh :* playch Steal The Show | https://whatsapp.com/channel/xxx`
                    );
                }

                let CH_ID = '';
                let channelInfo = null;

                try {
                    if (targetChannel.endsWith('@newsletter')) {
                        CH_ID = targetChannel;
                        channelInfo = await shorekeeper.newsletterMetadata('jid', CH_ID).catch(() => ({ id: CH_ID, name: 'Saluran WhatsApp' }));
                    } else if (targetChannel.includes('whatsapp.com/channel/')) {
                        const inviteCode = targetChannel.split('https://whatsapp.com/channel/')[1]?.split(/[?&/]/)[0];
                        if (!inviteCode) return Reply("❌ Link channel tidak valid!");
                        channelInfo = await shorekeeper.newsletterMetadata("invite", inviteCode).catch(() => null);
                        if (!channelInfo) return Reply("❌ Gagal mengambil data channel!");
                        CH_ID = channelInfo.id;
                    } else {
                        return Reply("❌ Masukkan link saluran WhatsApp yang valid (contoh: https://whatsapp.com/channel/xxx)!");
                    }
                } catch (metaErr) {
                    return Reply(`❌ Gagal mengambil data channel: ${metaErr?.message || metaErr}`);
                }

                if (!CH_ID) return Reply("❌ ID channel tidak ditemukan!");

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const { promisify } = require("util");
                const { exec } = require("child_process");
                const execPromise = promisify(exec);
                const { createCanvas, loadImage } = (() => { try { return require('@napi-rs/canvas'); } catch (_) { return require('canvas'); } })();

                const tmpDir = path.join(__dirname, "tmp");
                if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

                const fileId = Date.now();
                const inputPath = path.join(tmpDir, `playch_in_${fileId}.mp3`);
                const outputPath = path.join(tmpDir, `playch_out_${fileId}.opus`);

                try {
                    let trackTitle = songTitle;
                    let trackArtist = 'Unknown Artist';
                    let trackDuration = '-';
                    let trackThumbnail = null;
                    let audioBuffer = null;

                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;

                    // 1. Primary: YouTube Play via Clutch API
                    try {
                        const playRes = await axios.get(`${baseUrl}/download/play?apikey=${apiKey}&query=${encodeURIComponent(songTitle)}`, { timeout: 35000 });
                        const pData = playRes.data?.result;
                        if (pData && (pData.audio || pData.download)) {
                            trackTitle = pData.title || songTitle;
                            trackArtist = pData.author?.name || 'Artist';
                            trackDuration = pData.duration || '-';
                            trackThumbnail = pData.thumbnail || pData.banner;

                            const dlUrl = pData.audio || pData.download;
                            const dlRes = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 45000 });
                            audioBuffer = Buffer.from(dlRes.data);
                        }
                    } catch (playErr) {
                        console.error('[Playch Clutch Play Error]:', playErr.message);
                    }

                    // 2. Fallback: SoundCloud Play via Clutch API
                    if (!audioBuffer) {
                        try {
                            const scRes = await axios.get(`${baseUrl}/download/soundcloudplay?apikey=${apiKey}&query=${encodeURIComponent(songTitle)}`, { timeout: 35000 });
                            const scData = scRes.data?.result;
                            if (scData && (scData.audio || scData.download || scData.url)) {
                                trackTitle = scData.title || trackTitle;
                                trackArtist = scData.artist || scData.author || trackArtist;
                                trackThumbnail = scData.thumbnail || scData.image || trackThumbnail;

                                const scDl = scData.audio || scData.download || scData.url;
                                const dlRes = await axios.get(scDl, { responseType: 'arraybuffer', timeout: 45000 });
                                audioBuffer = Buffer.from(dlRes.data);
                            }
                        } catch (scErr) {
                            console.error('[Playch Clutch SC Error]:', scErr.message);
                        }
                    }

                    if (!audioBuffer) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return Reply(`❌ Lagu "${songTitle}" tidak ditemukan.`);
                    }

                    fs.writeFileSync(inputPath, audioBuffer);

                    // 3. Convert ke Opus dengan ffmpeg agar voice note PTT tajam dan lancar
                    let finalBuffer = audioBuffer;
                    let isOpus = false;
                    try {
                        await execPromise(`ffmpeg -i "${inputPath}" -c:a libopus -ac 1 -ar 48000 -b:a 48k -application voip -map_metadata -1 "${outputPath}" -y`);
                        if (fs.existsSync(outputPath)) {
                            finalBuffer = fs.readFileSync(outputPath);
                            isOpus = true;
                        }
                    } catch (ffErr) {
                        finalBuffer = audioBuffer;
                    }

                    // 4. Kirim Audio / Voice Note ke Saluran (Channel)
                    await shorekeeper.sendMessage(CH_ID, {
                        audio: finalBuffer,
                        mimetype: isOpus ? "audio/ogg; codecs=opus" : "audio/mp4",
                        ptt: true,
                        contextInfo: {
                            isForwarded: true,
                            forwardingScore: 9999,
                            businessMessageForwardInfo: { businessOwnerJid: global.owner + "@s.whatsapp.net" },
                            forwardedNewsletterMessageInfo: {
                                newsletterName: trackTitle,
                                newsletterJid: CH_ID
                            }
                        }
                    });

                    // 5. Generate Spotify Canvas Card Image (Ala-ala base-wa & bot-wa)
                    try {
                        const width = 1200;
                        const height = 630;
                        const canvas = createCanvas(width, height);
                        const ctx = canvas.getContext('2d');

                        // Background gradient
                        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
                        bgGrad.addColorStop(0, '#050508');
                        bgGrad.addColorStop(0.5, '#0b0b10');
                        bgGrad.addColorStop(1, '#030305');
                        ctx.fillStyle = bgGrad;
                        ctx.fillRect(0, 0, width, height);

                        // Particle dots
                        for (let i = 0; i < 300; i++) {
                            ctx.fillStyle = `rgba(0, 210, 255, ${Math.random() * 0.03 + 0.005})`;
                            ctx.beginPath();
                            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
                            ctx.fill();
                        }

                        // Glow cyan backdrop
                        const cyanGlow = ctx.createRadialGradient(280, 315, 50, 280, 315, 450);
                        cyanGlow.addColorStop(0, 'rgba(0, 210, 255, 0.15)');
                        cyanGlow.addColorStop(1, 'rgba(0, 210, 255, 0)');
                        ctx.fillStyle = cyanGlow;
                        ctx.fillRect(0, 0, width, height);

                        // Glass container card
                        const cardX = 80;
                        const cardY = 80;
                        const cardW = width - 160;
                        const cardH = height - 160;
                        const cardRadius = 36;

                        ctx.fillStyle = 'rgba(15, 15, 22, 0.85)';
                        ctx.beginPath();
                        ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
                        ctx.fill();

                        ctx.strokeStyle = 'rgba(0, 210, 255, 0.2)';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
                        ctx.stroke();

                        // Decorative corner brackets
                        const cornerSize = 24;
                        ctx.strokeStyle = '#00d2ff';
                        ctx.lineWidth = 2.5;
                        [[cardX + 6, cardY + 6, 1, 1], [cardX + cardW - 6, cardY + 6, -1, 1], [cardX + 6, cardY + cardH - 6, 1, -1], [cardX + cardW - 6, cardY + cardH - 6, -1, -1]]
                            .forEach(([cx, cy, dx, dy]) => {
                                ctx.beginPath();
                                ctx.moveTo(cx + dx * cornerSize, cy);
                                ctx.lineTo(cx, cy);
                                ctx.lineTo(cx, cy + dy * cornerSize);
                                ctx.stroke();
                            });

                        // Vinyl record disc behind thumbnail
                        const thumbSize = 330;
                        const thumbX = 130;
                        const thumbY = (height - thumbSize) / 2;
                        const discX = thumbX + 225;
                        const discY = thumbY + (thumbSize / 2);
                        const discRadius = (thumbSize / 2) - 10;

                        ctx.fillStyle = '#0d0d11';
                        ctx.beginPath();
                        ctx.arc(discX, discY, discRadius, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                        ctx.lineWidth = 1;
                        for (let r = discRadius - 15; r > 30; r -= 15) {
                            ctx.beginPath();
                            ctx.arc(discX, discY, r, 0, Math.PI * 2);
                            ctx.stroke();
                        }

                        ctx.fillStyle = '#00d2ff';
                        ctx.beginPath();
                        ctx.arc(discX, discY, 35, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillStyle = '#101015';
                        ctx.beginPath();
                        ctx.arc(discX, discY, 10, 0, Math.PI * 2);
                        ctx.fill();

                        // Thumbnail
                        if (trackThumbnail) {
                            try {
                                const thumbImg = await loadImage(trackThumbnail);
                                ctx.save();
                                ctx.beginPath();
                                ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 24);
                                ctx.closePath();
                                ctx.clip();
                                ctx.drawImage(thumbImg, thumbX, thumbY, thumbSize, thumbSize);
                                ctx.restore();
                            } catch (e) {
                                ctx.fillStyle = '#00d2ff';
                                ctx.beginPath();
                                ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 24);
                                ctx.fill();
                            }
                        }

                        // Text details
                        const textX = thumbX + thumbSize + 75;
                        let currentY = 205;

                        ctx.font = 'bold 12px Arial';
                        ctx.fillStyle = '#00d2ff';
                        ctx.textAlign = 'left';
                        ctx.fillText('✦  NOW PLAYING ON CHANNEL  ✦', textX, currentY);

                        currentY += 45;
                        let titleFontSize = 38;
                        if (trackTitle.length > 20) titleFontSize = 30;
                        if (trackTitle.length > 30) titleFontSize = 24;
                        ctx.font = `bold ${titleFontSize}px Arial`;
                        ctx.fillStyle = '#ffffff';
                        let displayTitle = trackTitle;
                        if (displayTitle.length > 35) displayTitle = displayTitle.slice(0, 32) + '...';
                        ctx.fillText(displayTitle, textX, currentY);

                        currentY += 40;
                        ctx.font = '22px Arial';
                        ctx.fillStyle = '#b0b0ba';
                        let displayArtist = trackArtist;
                        if (displayArtist.length > 35) displayArtist = displayArtist.slice(0, 32) + '...';
                        ctx.fillText(displayArtist, textX, currentY);

                        // Progress bar
                        currentY += 45;
                        const progressWidth = width - textX - 140;
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
                        ctx.beginPath();
                        ctx.roundRect(textX, currentY, progressWidth, 6, 3);
                        ctx.fill();

                        const activeWidth = progressWidth * 0.45;
                        ctx.fillStyle = '#00d2ff';
                        ctx.beginPath();
                        ctx.roundRect(textX, currentY, activeWidth, 6, 3);
                        ctx.fill();

                        ctx.fillStyle = '#a0a0ab';
                        ctx.font = '14px Arial';
                        ctx.fillText('0:00', textX, currentY + 25);
                        ctx.textAlign = 'right';
                        ctx.fillText(trackDuration, textX + progressWidth, currentY + 25);
                        ctx.textAlign = 'left';

                        const cardBuffer = canvas.toBuffer('image/png');
                        const infoCaption = `\`⌜ Play Channel ⌟\`
> ◦ *Judul :* ${trackTitle}
> ◦ *Artis :* ${trackArtist}
> ◦ *Durasi :* ${trackDuration}
> ◦ *Saluran :* ${channelInfo?.name || 'Saluran WhatsApp'}`;

                        await shorekeeper.sendMessage(CH_ID, {
                            image: cardBuffer,
                            caption: infoCaption
                        });
                    } catch (cardErr) {
                        console.error('[PLAYCH CARD ERROR]', cardErr);
                    }

                    setTimeout(() => {
                        try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch(e) {}
                        try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch(e) {}
                    }, 3000);

                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    Reply(
                        `\`⌜ Play Channel Berhasil ✅ ⌟\`\n> ◦ *Saluran :* ${channelInfo?.name || 'Saluran WhatsApp'}\n> ◦ *Judul :* ${trackTitle}\n> ◦ *Artis :* ${trackArtist}\n> ◦ *Durasi :* ${trackDuration}\n> ◦ *PTT :* True (Voice Note)`
                    );
                } catch (e) {
                    console.error('[PLAYCH ERROR]', e);
                    setTimeout(() => {
                        try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch(err) {}
                        try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch(err) {}
                    }, 2000);

                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal memutar musik ke channel: ${e?.message || e}`);
                }
            }
            break;

            case "aio":
            case "allinone":
            case "aiodl": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!targetUrl || !targetUrl.startsWith('http')) {
                    return Reply(`\`⌜ All In One Downloader ⌟\`\n> ◦ *Format :* ${command} url`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/download/aio?apikey=${apiKey}&url=${encodeURIComponent(targetUrl.trim())}`, { timeout: 45000 });
                    const data = res.data?.result;
                    if (!data || !data.medias || data.medias.length === 0) {
                        throw new Error("Media tidak ditemukan.");
                    }

                    const captionTxt = `\`⌜ All In One Downloader ⌟\`\n> ◦ *Sumber :* ${(data.source || 'Social Media').toUpperCase()}\n> ◦ *Judul :* ${data.title || 'Media Download'}`;

                    const firstMedia = data.medias[0];
                    if (firstMedia.type === 'video' || (firstMedia.url && firstMedia.url.includes('.mp4'))) {
                        await shorekeeper.sendMessage(m.chat, {
                            video: { url: firstMedia.url },
                            caption: captionTxt,
                            mimetype: 'video/mp4'
                        }, { quoted: m });
                    } else if (firstMedia.type === 'audio' || (firstMedia.url && firstMedia.url.includes('.mp3'))) {
                        await shorekeeper.sendMessage(m.chat, {
                            audio: { url: firstMedia.url },
                            mimetype: 'audio/mpeg',
                            fileName: `${data.title || 'audio'}.mp3`
                        }, { quoted: m });
                    } else {
                        await shorekeeper.sendMessage(m.chat, {
                            image: { url: firstMedia.url },
                            caption: captionTxt
                        }, { quoted: m });
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengunduh AIO: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "mediafire":
            case "mf": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!targetUrl || !targetUrl.includes('mediafire.com')) {
                    return Reply(`\`⌜ Mediafire ⌟\`\n> ◦ *Format :* ${command} url`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/download/mediafire?apikey=${apiKey}&url=${encodeURIComponent(targetUrl.trim())}`, { timeout: 35000 });
                    const data = res.data?.result;
                    if (!data || !data.url) throw new Error("Gagal mengambil link unduhan Mediafire.");

                    const captionTxt = `\`⌜ MediaFire Downloader ⌟\`
> ◦ *Nama File :* ${data.filename || 'File'}
> ◦ *Ukuran :* ${data.filesize || '-'}
> ◦ *Tipe :* ${data.filetype || '-'}`;

                    await shorekeeper.sendMessage(m.chat, {
                        document: { url: data.url },
                        fileName: data.filename || 'mediafire_file',
                        mimetype: 'application/octet-stream',
                        caption: captionTxt
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengunduh Mediafire: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "gdrive":
            case "gdrivedl": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!targetUrl || (!targetUrl.includes('drive.google.com') && !targetUrl.includes('docs.google.com'))) {
                    return Reply(`\`⌜ Google Drive ⌟\`\n> ◦ *Format :* ${command} url`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/download/gdrive?apikey=${apiKey}&url=${encodeURIComponent(targetUrl.trim())}`, { timeout: 35000 });
                    const data = res.data?.result;
                    if (!data || !data.downloadUrl) throw new Error("Gagal mengambil link unduhan Google Drive.");

                    const captionTxt = `\`⌜ Google Drive Downloader ⌟\`
> ◦ *Nama File :* ${data.fileName || 'GDrive File'}
> ◦ *Ukuran :* ${data.fileSize || '-'}`;

                    await shorekeeper.sendMessage(m.chat, {
                        document: { url: data.downloadUrl },
                        fileName: data.fileName || 'gdrive_file',
                        mimetype: 'application/octet-stream',
                        caption: captionTxt
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengunduh Google Drive: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "threads":
            case "threadsdl": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!targetUrl || !targetUrl.includes('threads.net')) {
                    return Reply(`\`⌜ Threads ⌟\`\n> ◦ *Format :* ${command} url`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/download/threads?apikey=${apiKey}&url=${encodeURIComponent(targetUrl.trim())}`, { timeout: 35000 });
                    const data = res.data?.result;
                    if (!data || (!data.video_urls?.length && !data.image_urls?.length && !data.download)) {
                        throw new Error("Konten Threads tidak ditemukan.");
                    }

                    const videoUrl = data.video_urls?.[0]?.download_url || (typeof data.download === 'string' && data.download.includes('.mp4') ? data.download : null);
                    const imageUrl = data.image_urls?.[0] || data.download;

                    if (videoUrl) {
                        await shorekeeper.sendMessage(m.chat, {
                            video: { url: videoUrl },
                            caption: `\`⌜ Threads Video ⌟\`\n> ◦ *Author :* ${data.user?.username || '-'}\n> ◦ *Caption :* ${data.caption || '-'}`,
                            mimetype: 'video/mp4'
                        }, { quoted: m });
                    } else if (imageUrl) {
                        await shorekeeper.sendMessage(m.chat, {
                            image: { url: imageUrl },
                            caption: `\`⌜ Threads Image ⌟\`\n> ◦ *Author :* ${data.user?.username || '-'}\n> ◦ *Caption :* ${data.caption || '-'}`
                        }, { quoted: m });
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengunduh Threads: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "twitter":
            case "twdl":
            case "x":
            case "xdl": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!targetUrl || (!targetUrl.includes('twitter.com') && !targetUrl.includes('x.com'))) {
                    return Reply(`\`⌜ Twitter / X ⌟\`\n> ◦ *Format :* ${command} url`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/download/twitter?apikey=${apiKey}&url=${encodeURIComponent(targetUrl.trim())}`, { timeout: 35000 });
                    const data = res.data?.result;
                    if (!data || (!data.video && !data.url && !data.media)) throw new Error("Media Twitter/X tidak ditemukan.");

                    const mediaUrl = data.video || data.url || data.media?.[0]?.url;
                    await shorekeeper.sendMessage(m.chat, {
                        video: { url: mediaUrl },
                        caption: `\`⌜ Twitter / X Video ⌟\`\n> ◦ *Judul :* ${data.title || data.caption || 'Twitter Media'}`,
                        mimetype: 'video/mp4'
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengunduh Twitter/X: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "snackvideo":
            case "snackdl": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!targetUrl || !targetUrl.includes('snackvideo.com')) {
                    return Reply(`\`⌜ SnackVideo ⌟\`\n> ◦ *Format :* ${command} url`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/download/snackvideo?apikey=${apiKey}&url=${encodeURIComponent(targetUrl.trim())}`, { timeout: 35000 });
                    const data = res.data?.result;
                    if (!data || !data.video) throw new Error("Video SnackVideo tidak ditemukan.");

                    await shorekeeper.sendMessage(m.chat, {
                        video: { url: data.video },
                        caption: `\`⌜ SnackVideo Downloader ⌟\`\n> ◦ *Judul :* ${data.title || 'Snack Video'}\n> ◦ *Author :* ${data.author || '-'}`,
                        mimetype: 'video/mp4'
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengunduh SnackVideo: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "videy": {
                if (!isPrem && !isCreator) return Reply(global.mess.prem);
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!targetUrl || !targetUrl.includes('videy.co')) {
                    return Reply(`\`⌜ Videy ⌟\`\n> ◦ *Format :* ${command} url`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/download/videy?apikey=${apiKey}&url=${encodeURIComponent(targetUrl.trim())}`, { timeout: 35000 });
                    const data = res.data?.result;
                    if (!data || !data.videoUrl) throw new Error("Video Videy tidak ditemukan.");

                    await shorekeeper.sendMessage(m.chat, {
                        video: { url: data.videoUrl },
                        caption: `\`⌜ Videy Downloader ⌟\`\n> ◦ *URL :* ${targetUrl.trim()}`,
                        mimetype: 'video/mp4'
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengunduh Videy: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "gitclone": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!targetUrl || !targetUrl.includes('github.com')) {
                    return Reply(`\`⌜ GitClone ⌟\`\n> ◦ *Format :* ${command} url_repo`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/download/github?apikey=${apiKey}&url=${encodeURIComponent(targetUrl.trim())}`, { timeout: 45000 });
                    const data = res.data?.result;
                    if (!data || !data.download) throw new Error("Gagal mengambil link repository GitHub.");

                    const captionTxt = `\`⌜ GitHub Repo Cloned ⌟\`
> ◦ *Repo :* ${data.repo || 'Repository'}
> ◦ *Author :* ${data.user || '-'}`;

                    await shorekeeper.sendMessage(m.chat, {
                        document: { url: data.download },
                        fileName: `${data.repo || 'repository'}.zip`,
                        mimetype: 'application/zip',
                        caption: captionTxt
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal clone repository: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "bstation":
            case "bilibili": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!targetUrl || (!targetUrl.includes('bilibili.tv') && !targetUrl.includes('bstar.tv'))) {
                    return Reply(`\`⌜ Bstation ⌟\`\n> ◦ *Format :* ${command} url`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/download/bstation?apikey=${apiKey}&url=${encodeURIComponent(targetUrl.trim())}`, { timeout: 45000 });
                    const data = res.data?.result;
                    if (!data || (!data.video && !data.download)) throw new Error("Video Bstation tidak ditemukan.");

                    const videoUrl = data.video || data.download;
                    await shorekeeper.sendMessage(m.chat, {
                        video: { url: videoUrl },
                        caption: `\`⌜ Bstation Anime ⌟\`\n> ◦ *Judul :* ${data.title || 'Bstation Video'}`,
                        mimetype: 'video/mp4'
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengunduh Bstation: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "soundcloud":
            case "scplay": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ SoundCloud ⌟\`\n> ◦ *Format :* ${command} judul_lagu`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🎧', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/download/soundcloudplay?apikey=${apiKey}&query=${encodeURIComponent(text.trim())}`, { timeout: 45000 });
                    const data = res.data?.result;
                    if (!data || (!data.audio && !data.download && !data.url)) throw new Error("Lagu SoundCloud tidak ditemukan.");

                    const audioUrl = data.audio || data.download || data.url;
                    const captionTxt = `\`⌜ SoundCloud Track ⌟\`
> ◦ *Judul :* ${data.title || text.trim()}
> ◦ *Artis :* ${data.artist || data.author || '-'}`;

                    if (data.thumbnail || data.image) {
                        try {
                            await shorekeeper.sendMessage(m.chat, { image: { url: data.thumbnail || data.image }, caption: captionTxt }, { quoted: m });
                        } catch (eImg) {}
                    }

                    const aRes = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 45000 });
                    await shorekeeper.sendMessage(m.chat, {
                        audio: Buffer.from(aRes.data),
                        mimetype: 'audio/mpeg',
                        fileName: `${data.title || 'soundcloud'}.mp3`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal memutar SoundCloud: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "yts":
            case "ytsearch": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                if (!text || text.trim().length === 0) {
                    return Reply(example("La la lost you"));
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔎', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    let videos = [];
                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;

                    // 1. Coba lewat API Clutch
                    try {
                        const ytRes = await axios.get(`${baseUrl}/search/youtube?apikey=${apiKey}&q=${encodeURIComponent(text.trim())}`, { timeout: 15000 });
                        if (ytRes.data?.status && Array.isArray(ytRes.data?.result)) {
                            videos = ytRes.data.result.filter(e => e.type === 'video' || e.url).slice(0, 5);
                        }
                    } catch (e) {
                        console.error('Clutch YT search error, fallback ke yt-search:', e?.message);
                    }

                    // 2. Fallback ke library yt-search lokal
                    if (videos.length === 0) {
                        try {
                            const yts = require('yt-search');
                            const searchResults = await yts(text.trim());
                            videos = (searchResults.videos || []).slice(0, 5);
                        } catch (e2) {
                            console.error('yt-search fallback error:', e2?.message);
                        }
                    }

                    if (videos.length === 0) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return Reply(`❌ Tidak ditemukan hasil pencarian YouTube untuk "${text.trim()}".`);
                    }

                    let teks = `\`⌜ YouTube Search ⌟\`\n> ◦ *Query :* ${text.trim()}\n> ◦ *Ditemukan :* ${videos.length} Video\n\n`;

                    for (let i = 0; i < videos.length; i++) {
                        const v = videos[i];
                        teks += `*${i + 1}. ${v.title || 'Video'}*\n`;
                        teks += `> ◦ *Channel :* ${v.author?.name || '-'}\n`;
                        teks += `> ◦ *Durasi :* ${v.timestamp || v.duration?.timestamp || '-'}\n`;
                        teks += `> ◦ *Views :* ${v.views ? Number(v.views).toLocaleString('id-ID') : '-'}\n`;
                        teks += `> ◦ *Diunggah :* ${v.ago || '-'}\n`;
                        teks += `> ◦ *Link :* ${v.url}\n\n`;
                    }

                    teks += `💡 *Ketik play <judul> untuk memutar dan mengunduh lagunya*`;

                    const topThumb = videos[0]?.thumbnail || videos[0]?.image;
                    if (topThumb) {
                        await shorekeeper.sendMessage(m.chat, {
                            image: { url: topThumb },
                            caption: teks
                        }, { quoted: m });
                    } else {
                        await Reply(teks);
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('yts error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Terjadi kesalahan saat mencari di YouTube: ${err?.message}`);
                }
            }
            break;

            case "tiktoksearch":
            case "ttsearch":
            case "tiks": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                if (!text || text.trim().length === 0) {
                    return Reply(example("jj elistis"));
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔎', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;
                    const apiUrl = `${baseUrl}/search/tiktok?apikey=${apiKey}&q=${encodeURIComponent(text.trim())}`;
                    const response = await axios.get(apiUrl, { timeout: 25000 });
                    const json = response.data;

                    if (!json.status || !Array.isArray(json.result) || json.result.length === 0) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return Reply(`❌ Tidak ditemukan hasil pencarian TikTok untuk "${text.trim()}".`);
                    }

                    const videos = json.result.slice(0, 5);
                    let teks = `\`⌜ TikTok Search ⌟\`\n> ◦ *Query :* ${text.trim()}\n> ◦ *Ditemukan :* ${videos.length} Video\n\n`;

                    for (let i = 0; i < videos.length; i++) {
                        const v = videos[i];
                        teks += `*${i + 1}. ${v.title || 'Video TikTok'}*\n`;
                        teks += `> ◦ *Author :* ${v.author?.nickname || v.author?.unique_id || '-'} (@${v.author?.unique_id || '-'})\n`;
                        teks += `> ◦ *Durasi :* ${v.duration ? v.duration + ' detik' : '-'}\n`;
                        teks += `> ◦ *Views :* ${v.stats?.views ? Number(v.stats.views).toLocaleString('id-ID') : '-'}\n`;
                        teks += `> ◦ *Likes :* ${v.stats?.likes ? Number(v.stats.likes).toLocaleString('id-ID') : '-'}\n`;
                        teks += `> ◦ *Komentar :* ${v.stats?.comment ? Number(v.stats.comment).toLocaleString('id-ID') : '-'}\n`;
                        teks += `> ◦ *Link :* ${v.url}\n\n`;
                    }

                    teks += `💡 *Ketik tiktok <link> untuk mengunduh video/fotonya*`;

                    const imageUrl = global.image?.menu || 'https://cdn-alip.clutch.web.id/api/u/mvnbdijm.jpg';
                    try {
                        await shorekeeper.sendMessage(m.chat, {
                            image: { url: imageUrl },
                            caption: teks
                        }, { quoted: m });
                    } catch (imgErr) {
                        await Reply(teks);
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('tiktoksearch error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Terjadi kesalahan saat mencari di TikTok: ${err?.message}`);
                }
            }
            break;

            case "pinterest":
            case "pin":
            case "pinterestsearch":
            case "pinsearch": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                if (!text || text.trim().length === 0) {
                    return Reply(example("anime aesthetic"));
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔎', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;
                    const apiUrl = `${baseUrl}/search/pinterest?apikey=${apiKey}&q=${encodeURIComponent(text.trim())}`;
                    const response = await axios.get(apiUrl, { timeout: 25000 });
                    const json = response.data;

                    if (!json.status || !Array.isArray(json.result) || json.result.length === 0) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return Reply(`❌ Tidak ditemukan gambar Pinterest untuk kata kunci "${text.trim()}".`);
                    }

                    const validImages = json.result.filter(u => typeof u === 'string' && u.startsWith('http'));
                    if (validImages.length === 0) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return Reply(`❌ Gagal memuat gambar dari Pinterest.`);
                    }

                    const selectedImages = validImages.slice(0, 5);
                    const captionText = `\`⌜ Pinterest Search ⌟\`\n> ◦ *Query :* ${text.trim()}\n> ◦ *Total Hasil :* ${selectedImages.length} Gambar`;

                    if (selectedImages.length > 1) {
                        const albumItems = selectedImages.map((imgUrl, idx) => ({
                            image: { url: imgUrl },
                            ...(idx === 0 ? { caption: captionText } : {})
                        }));

                        await shorekeeper.sendMessage(m.chat, {
                            albumMessage: albumItems
                        }, { quoted: m });
                    } else {
                        await shorekeeper.sendMessage(m.chat, {
                            image: { url: selectedImages[0] },
                            caption: captionText
                        }, { quoted: m });
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('pinterest error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Terjadi kesalahan saat mencari di Pinterest: ${err?.message}`);
                }
            }
            break;

            case "chord":
            case "kord": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Chord Gitar ⌟\`\n> ◦ *Format :* ${command} judul_lagu`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🎸', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/search/chord?apikey=${apiKey}&q=${encodeURIComponent(text.trim())}`, { timeout: 35000 });
                    const data = res.data?.result;
                    if (!data || !data.chord) throw new Error("Chord tidak ditemukan.");

                    const resultTxt = `\`⌜ Chord & Kunci Gitar ⌟\`
> ◦ *Lagu :* *${data.title || text.trim()}*
> ◦ *Artis :* ${data.artist || '-'}

${data.chord}`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Chord Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "lirik":
            case "lyrics": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Lirik Lagu ⌟\`\n> ◦ *Format :* ${command} judul_lagu`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🎵', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/search/lirik?apikey=${apiKey}&title=${encodeURIComponent(text.trim())}`, { timeout: 35000 });
                    const data = res.data?.result;
                    if (!data || !data.lyrics) throw new Error("Lirik lagu tidak ditemukan.");

                    const resultTxt = `\`⌜ Lirik Lagu ⌟\`
> ◦ *Judul :* *${data.title || text.trim()}*
> ◦ *Artis :* ${data.artist || '-'}

${data.lyrics}`;

                    if (data.image) {
                        try {
                            const imgRes = await axios.get(data.image, { responseType: 'arraybuffer', timeout: 25000 });
                            await shorekeeper.sendMessage(m.chat, { image: Buffer.from(imgRes.data), caption: resultTxt }, { quoted: m });
                        } catch (eImg) {
                            await Reply(resultTxt);
                        }
                    } else {
                        await Reply(resultTxt);
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Lirik Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "gimage":
            case "googleimage": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Google Image ⌟\`\n> ◦ *Format :* ${command} pencarian`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔎', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/search/gimage?apikey=${apiKey}&q=${encodeURIComponent(text.trim())}`, { timeout: 35000 });
                    const data = res.data?.result;
                    if (!data || !Array.isArray(data) || data.length === 0) throw new Error("Gambar tidak ditemukan.");

                    const randImg = data[Math.floor(Math.random() * Math.min(data.length, 10))];
                    const imgUrl = typeof randImg === 'string' ? randImg : randImg.url || randImg.image;

                    const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
                    await shorekeeper.sendMessage(m.chat, {
                        image: Buffer.from(imgRes.data),
                        caption: `\`⌜ Google Image ⌟\`\n> ◦ *Query :* ${text.trim()}`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ GImage Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "playstore":
            case "ps": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Play Store ⌟\`\n> ◦ *Format :* ${command} nama_aplikasi`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '📲', key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/search/playstore?apikey=${apiKey}&q=${encodeURIComponent(text.trim())}`, { timeout: 30000 });
                    const data = res.data?.result;
                    if (!data || !Array.isArray(data) || data.length === 0) throw new Error("Aplikasi tidak ditemukan.");

                    const app = data[0];
                    const captionTxt = `\`⌜ Google Play Store ⌟\`
> ◦ *Nama :* *${app.title || app.name}*
> ◦ *Developer :* ${app.developer || '-'}
> ◦ *Rating :* ⭐ ${app.rating || app.scoreText || '-'}
> ◦ *Link :* ${app.url || app.link || '-'}`;

                    if (app.icon || app.thumbnail) {
                        try {
                            const imgRes = await axios.get(app.icon || app.thumbnail, { responseType: 'arraybuffer', timeout: 25000 });
                            await shorekeeper.sendMessage(m.chat, { image: Buffer.from(imgRes.data), caption: captionTxt }, { quoted: m });
                        } catch (eImg) {
                            await Reply(captionTxt);
                        }
                    } else {
                        await Reply(captionTxt);
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ PlayStore Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "happymod": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ HappyMod ⌟\`\n> ◦ *Format :* ${command} nama_game`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '👾', key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/search/happymod?apikey=${apiKey}&q=${encodeURIComponent(text.trim())}`, { timeout: 30000 });
                    const data = res.data?.result;
                    if (!data || !Array.isArray(data) || data.length === 0) throw new Error("MOD tidak ditemukan.");

                    const mod = data[0];
                    const captionTxt = `\`⌜ HappyMod APK ⌟\`
> ◦ *Nama :* *${mod.title || mod.name}*
> ◦ *Rating :* ⭐ ${mod.rating || '-'}
> ◦ *Link :* ${mod.url || mod.link || '-'}`;

                    if (mod.icon || mod.thumbnail) {
                        try {
                            const imgRes = await axios.get(mod.icon || mod.thumbnail, { responseType: 'arraybuffer', timeout: 25000 });
                            await shorekeeper.sendMessage(m.chat, { image: Buffer.from(imgRes.data), caption: captionTxt }, { quoted: m });
                        } catch (eImg) {
                            await Reply(captionTxt);
                        }
                    } else {
                        await Reply(captionTxt);
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ HappyMod Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "sfile":
            case "sfilesearch": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Sfile ⌟\`\n> ◦ *Format :* ${command} query`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '📁', key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/search/sfile?apikey=${apiKey}&q=${encodeURIComponent(text.trim())}`, { timeout: 30000 });
                    const data = res.data?.result;
                    if (!data || !Array.isArray(data) || data.length === 0) throw new Error("File tidak ditemukan.");

                    let listTxt = data.slice(0, 5).map((f, i) => `> *${i + 1}. ${f.name || f.filename}*\n> ◦ Ukuran: ${f.size || '-'}\n> ◦ Link: ${f.url || f.link}`).join('\n\n');
                    const resultTxt = `\`⌜ Sfile.mobi Search ⌟\`
> ◦ *Query :* ${text.trim()}

${listTxt}`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Sfile Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "anime":
            case "animesearch": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Anime Search ⌟\`\n> ◦ *Format :* ${command} judul_anime`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🌸', key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/search/anime?apikey=${apiKey}&q=${encodeURIComponent(text.trim())}`, { timeout: 30000 });
                    const data = res.data?.result;
                    if (!data || !Array.isArray(data) || data.length === 0) throw new Error("Anime tidak ditemukan.");

                    const ani = data[0];
                    const captionTxt = `\`⌜ Anime Info ⌟\`
> ◦ *Judul :* *${ani.title || ani.name}*
> ◦ *Tipe :* ${ani.type || '-'}
> ◦ *Episode :* ${ani.episodes || '-'}
> ◦ *Score :* ⭐ ${ani.score || '-'}
> ◦ *Status :* ${ani.status || '-'}
> ◦ *Sinopsis :* ${ani.synopsis ? ani.synopsis.slice(0, 200) + '...' : '-'}`;

                    if (ani.image || ani.thumbnail) {
                        try {
                            const imgRes = await axios.get(ani.image || ani.thumbnail, { responseType: 'arraybuffer', timeout: 25000 });
                            await shorekeeper.sendMessage(m.chat, { image: Buffer.from(imgRes.data), caption: captionTxt }, { quoted: m });
                        } catch (eImg) {
                            await Reply(captionTxt);
                        }
                    } else {
                        await Reply(captionTxt);
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Anime Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "berita":
            case "news": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                await shorekeeper.sendMessage(m.chat, { react: { text: '📰', key: m.key } }).catch(() => {});

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/news/terkini?apikey=${apiKey}&category=terkini`, { timeout: 30000 });
                    const data = res.data?.result;
                    if (!data || !Array.isArray(data) || data.length === 0) throw new Error("Berita tidak ditemukan.");

                    let newsList = data.slice(0, 5).map((n, i) => `> *${i + 1}. ${n.title}*\n> ◦ ${n.snippet || n.description || ''}\n> ◦ _Link :_ ${n.link || n.url}`).join('\n\n');
                    const resultTxt = `\`⌜ Berita Terkini Indonesia ⌟\`

${newsList}`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Berita Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "waifu": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                await shorekeeper.sendMessage(m.chat, { react: { text: '🌸', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/random/waifu?apikey=${apiKey}`, { timeout: 35000 });
                    const data = res.data?.result || res.data;
                    const wUrl = data.url || data.image;
                    if (!wUrl) throw new Error("Gagal mengambil gambar waifu.");

                    const imgRes = await axios.get(wUrl, { responseType: 'arraybuffer', timeout: 30000 });
                    await shorekeeper.sendMessage(m.chat, {
                        image: Buffer.from(imgRes.data),
                        caption: `\`⌜ Random Anime Waifu ⌟\`\n> ◦ *Status :* Sukses`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Waifu Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "ai":
            case "gemini": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                if (!text || text.trim().length === 0) {
                    return Reply(example("siapa presiden pertama indonesia?"));
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🤖', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;
                    const apiUrl = `${baseUrl}/ai/gemini?apikey=${apiKey}&prompt=${encodeURIComponent(text.trim())}`;
                    const response = await axios.get(apiUrl, { timeout: 35000 });
                    const json = response.data;

                    if (!json.status || !json.result) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return Reply("❌ Maaf, AI sedang tidak dapat merespon pertanyaan saat ini.");
                    }

                    await Reply(json.result);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('AI Gemini error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Terjadi kesalahan saat memproses AI: ${err?.message}`);
                }
            }
            break;

            case "fluxai":
            case "flux":
            case "txt2img":
            case "aiimage":
            case "generateimage": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                let rawPrompt = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!rawPrompt || rawPrompt.trim().length === 0) {
                    return Reply(
                        `\`⌜ Ai Flux ⌟\`\n> ◦ *Format :* ${command} prompt`
                    );
                }

                let targetPrompt = rawPrompt.trim();
                let ratio = "1:1";

                if (targetPrompt.includes('|')) {
                    const parts = targetPrompt.split('|');
                    targetPrompt = parts[0].trim();
                    const reqRatio = parts[1].trim();
                    if (['1:1', '16:9', '9:16', '4:3', '3:4'].includes(reqRatio)) {
                        ratio = reqRatio;
                    }
                }

                if (!targetPrompt || targetPrompt.length === 0) {
                    return Reply(`\`⌜ Ai Flux ⌟\`\n> ◦ *Format :* ${command} prompt`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🎨', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/ai/flux?apikey=${apiKey}&prompt=${encodeURIComponent(targetPrompt)}&aspect_ratio=${ratio}`, {
                        timeout: 45000
                    });

                    const data = res.data?.result;
                    if (!data || (!data.image && !data.url)) {
                        throw new Error(res.data?.error || "Gagal menghasilkan gambar AI FLUX.");
                    }

                    const imgUrl = data.image || data.url;
                    const captionTxt = `\`⌜ Ai Flux ⌟\`\n> ◦ *Prompt :* ${targetPrompt}`;

                    try {
                        const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 45000 });
                        await shorekeeper.sendMessage(m.chat, {
                            image: Buffer.from(imgRes.data),
                            caption: captionTxt
                        }, { quoted: m });
                    } catch (eDl) {
                        await shorekeeper.sendMessage(m.chat, {
                            image: { url: imgUrl },
                            caption: captionTxt
                        }, { quoted: m });
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('Flux AI error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal menghasilkan gambar: ${err.response?.data?.error || err.message}`);
                }
            }
            break;

            case "deepseek": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let q = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!q || q.trim().length === 0) {
                    return Reply(`\`⌜ DeepSeek AI ⌟\`\n> ◦ *Format :* ${command} pertanyaan`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🤖', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/ai/deepseek?apikey=${apiKey}&text=${encodeURIComponent(q.trim())}`, { timeout: 45000 });
                    const result = res.data?.result;
                    if (!result) throw new Error("DeepSeek AI tidak memberikan respon.");

                    await Reply(result);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ DeepSeek Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "chatgpt":
            case "gpt": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let q = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!q || q.trim().length === 0) {
                    return Reply(`\`⌜ ChatGPT ⌟\`\n> ◦ *Format :* ${command} pertanyaan`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🤖', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/ai/chatgpt?apikey=${apiKey}&question=${encodeURIComponent(q.trim())}`, { timeout: 45000 });
                    const result = res.data?.result;
                    if (!result) throw new Error("ChatGPT tidak memberikan respon.");

                    await Reply(result);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ ChatGPT Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "grok": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let q = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!q || q.trim().length === 0) {
                    return Reply(`\`⌜ Grok xAI ⌟\`\n> ◦ *Format :* ${command} pertanyaan`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🤖', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/ai/grok?apikey=${apiKey}&question=${encodeURIComponent(q.trim())}`, { timeout: 45000 });
                    const result = res.data?.result;
                    if (!result) throw new Error("Grok AI tidak memberikan respon.");

                    await Reply(result);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Grok Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "translate":
            case "tr": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let raw = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!raw || raw.trim().length === 0) {
                    return Reply(`\`⌜ AI Translate ⌟\`\n> ◦ *Format :* ${command} teks`);
                }

                let targetLang = 'id';
                let trText = raw.trim();

                if (raw.includes('|')) {
                    const parts = raw.split('|');
                    targetLang = parts[0].trim().toLowerCase() || 'id';
                    trText = parts[1].trim();
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🌐', key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/ai/translate?apikey=${apiKey}&text=${encodeURIComponent(trText)}&to=${targetLang}&from=auto`, { timeout: 25000 });
                    const data = res.data?.result;
                    if (!data || !data.translated) throw new Error("Gagal menerjemahkan teks.");

                    const resultTxt = `\`⌜ AI Translator (${data.from.toUpperCase()} ➔ ${data.to.toUpperCase()}) ⌟\`

${data.translated}`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Translate Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "aivideo":
            case "videogen": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ AI Video ⌟\`\n> ◦ *Format :* ${command} prompt`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🎥', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/ai/video?apikey=${apiKey}&prompt=${encodeURIComponent(text.trim())}`, { timeout: 60000 });
                    const data = res.data?.result;
                    if (!data || (!data.videoUrl && !data.video && !data.url)) throw new Error("Video tidak berhasil digenerate.");

                    const vUrl = data.videoUrl || data.video || data.url;
                    await shorekeeper.sendMessage(m.chat, {
                        video: { url: vUrl },
                        caption: `\`⌜ AI Video Generated ⌟\`\n> ◦ *Prompt :* ${text.trim()}`,
                        mimetype: 'video/mp4'
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ AI Video Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "sunora":
            case "aimusic": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Sunora AI ⌟\`\n> ◦ *Format :* ${command} prompt`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🎵', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/ai/sunora?apikey=${apiKey}&prompt=${encodeURIComponent(text.trim())}`, { timeout: 60000 });
                    const data = res.data?.result;
                    if (!data || (!data.audioUrl && !data.audio && !data.url)) throw new Error("Musik AI tidak berhasil digenerate.");

                    const aUrl = data.audioUrl || data.audio || data.url;
                    const captionTxt = `\`⌜ Sunora AI Music ⌟\`\n> ◦ *Prompt :* ${text.trim()}\n> ◦ *Judul :* ${data.title || 'AI Music'}`;

                    await shorekeeper.sendMessage(m.chat, {
                        audio: { url: aUrl },
                        mimetype: 'audio/mpeg',
                        fileName: `${data.title || 'sunora_music'}.mp3`,
                        caption: captionTxt
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Sunora Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "nsfwcheck": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                const q = m.quoted ? m.quoted : m;
                const mime = (q.msg || q).mimetype || '';
                if (!/image/.test(mime)) {
                    return Reply(`\`⌜ AI NSFW Checker ⌟\`\n> ◦ Kirim/reply gambar dengan ketik *${command}*`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔞', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const imgBuf = await q.download();
                    if (!imgBuf) throw new Error("Gagal mengunduh gambar.");

                    const cdnUrl = await uploadToCDN(imgBuf, mime || 'image/jpeg');
                    if (!cdnUrl) throw new Error("Gagal upload gambar ke CDN.");

                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;
                    const res = await axios.get(`${baseUrl}/ai/nsfw-check?apikey=${apiKey}&url=${encodeURIComponent(cdnUrl)}`, { timeout: 35000 });
                    const data = res.data?.result || res.data;

                    const resultTxt = `\`⌜ AI NSFW Detection ⌟\`
> ◦ *Status :* ${data.is_nsfw ? '⚠️ Terdeteksi NSFW' : '✅ Aman (SFW)'}
> ◦ *Skor NSFW :* ${data.nsfw_score ? `${(data.nsfw_score * 100).toFixed(1)}%` : '-'}
> ◦ *Label :* ${data.label || 'Clean'}`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ NSFW Check Error: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "bananaai":
            case "banana":
            case "editfoto":
            case "imgai":
            case "editai": {
                if (!isPrem && !isCreator) return Reply(global.mess.prem);
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const q = m.quoted ? m.quoted : m;
                const mime = (q.msg || q).mimetype || '';
                const promptTeks = text ? text.trim() : (q.text ? q.text.trim() : '');

                if (!/image/.test(mime)) {
                    return Reply(`📌 *Kirim atau balas (reply) foto dengan caption:* ${command} <instruksi>\n> *Contoh:* ${command} ubah jadi anime 4k`);
                }

                if (!promptTeks) {
                    return Reply(`📌 Masukkan instruksi edit foto!\n> *Contoh:* ${command} ubah jadi hd 4k`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🎨', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const userImageBuffer = await q.download();
                    if (!userImageBuffer) throw new Error("Gagal mengunduh gambar.");

                    const userImageUrl = await uploadToCDN(userImageBuffer, mime);
                    if (!userImageUrl) throw new Error("Gagal mengunggah gambar ke server CDN.");

                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;
                    const apiUrl = `${baseUrl}/imagecreator/bananaai?apikey=${apiKey}&url=${encodeURIComponent(userImageUrl)}&prompt=${encodeURIComponent(promptTeks)}`;

                    const response = await axios.get(apiUrl, {
                        responseType: 'arraybuffer',
                        timeout: 180000,
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                    });

                    const hasilBuffer = Buffer.from(response.data);

                    await shorekeeper.sendMessage(m.chat, {
                        image: hasilBuffer,
                        caption: `\`⌜ Banana AI Edit Foto ⌟\`\n> ◦ *Prompt :* ${promptTeks}\n> ◦ *Status :* Sukses diedit`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('Banana AI error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Terjadi kesalahan saat mengedit foto dengan AI: ${err?.message}`);
                }
            }
            break;

            case "hyperai":
            case "webpilot":
            case "venice":
            case "powerbrain":
            case "publicai": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                if (!text || text.trim().length === 0) {
                    return Reply(example("siapa kamu?"));
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🤖', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;
                    const apiUrl = `${baseUrl}/ai/${command}?apikey=${apiKey}&prompt=${encodeURIComponent(text.trim())}`;
                    const response = await axios.get(apiUrl, { timeout: 35000 });
                    const json = response.data;

                    if (!json.status || !json.result) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return Reply("❌ Maaf, AI sedang tidak dapat merespon pertanyaan saat ini.");
                    }

                    await Reply(json.result);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error(`${command} error:`, err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Terjadi kesalahan saat memproses ${command}: ${err?.message}`);
                }
            }
            break;

            case "hd":
            case "remini":
            case "upscale": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const q = m.quoted ? m.quoted : m;
                const mime = (q.msg || q).mimetype || "";

                if (!/image/i.test(mime)) {
                    return Reply("📸 Balas / kirim foto dengan caption *hd* atau *remini* untuk meningkatkan kualitas gambar menjadi HD.");
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const userImageBuffer = await q.download();
                    if (!userImageBuffer) throw new Error("Gagal mengunduh gambar Anda.");

                    const multiplier = (args[0] === '4' || args[0] === '4x') ? 4 : 2;
                    const upscaledBuffer = await upscaleImage(userImageBuffer, multiplier);

                    await shorekeeper.sendMessage(m.chat, {
                        image: upscaledBuffer,
                        caption: `\`⌜ AI Image Upscaler (HD) ⌟\`\n> ◦ *Status :* Sukses Ditingkatkan\n> ◦ *Skala :* ${multiplier}x AI Super Resolution`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('HD Upscale Error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal meningkatkan kualitas gambar: ${err?.message || err}`);
                }
            }
            break;

            case "removebg":
            case "nobg":
            case "hapusbg":
            case "rbg": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const q = m.quoted ? m.quoted : m;
                const mime = (q.msg || q).mimetype || "";

                if (!/image/i.test(mime)) {
                    return Reply("📸 Balas / kirim foto dengan caption *removebg* untuk menghapus latar belakang (background) gambar.");
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const userImageBuffer = await q.download();
                    if (!userImageBuffer) throw new Error("Gagal mengunduh gambar Anda.");

                    const noBgBuffer = await removeBackground(userImageBuffer);

                    await shorekeeper.sendMessage(m.chat, {
                        image: noBgBuffer,
                        caption: `\`⌜ AI Background Remover ⌟\`\n> ◦ *Status :* Background Berhasil Dihapus\n> ◦ *Format :* Transparent PNG`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('RemoveBG Error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal menghapus background gambar: ${err?.message || err}`);
                }
            }
            break;

            case "iqc":
            case "iphonequoted":
            case "qciphone":
            case "fakeiphone": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                let quoteText = text || m.quoted?.text || m.quoted?.conversation || m.quoted?.caption || '';
                if (!quoteText || quoteText.trim().length === 0) {
                    return Reply(example("Halo ini pesan iPhone Quoted"));
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    let attachImageUrl = '';
                    const q = m.quoted ? m.quoted : m;
                    const mime = (q.msg || q).mimetype || '';

                    // Hanya jika me-reply/mengirim gambar, lampirkan imageUrl
                    if (/image/.test(mime)) {
                        try {
                            const imgBuf = await q.download();
                            const uploaded = await uploadToCDN(imgBuf, mime);
                            if (uploaded) attachImageUrl = uploaded;
                        } catch (e) {}
                    }

                    const timeStr = moment().tz('Asia/Jakarta').format('HH:mm');
                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;

                    let apiUrl = `${baseUrl}/imagecreator/iqc?apikey=${apiKey}&time=${encodeURIComponent(timeStr)}&text=${encodeURIComponent(quoteText.trim())}`;
                    if (attachImageUrl) {
                        apiUrl += `&imageUrl=${encodeURIComponent(attachImageUrl)}`;
                    }

                    const res = await axios.get(apiUrl, {
                        responseType: 'arraybuffer',
                        timeout: 45000,
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                    });

                    const resultBuffer = Buffer.from(res.data);
                    const hexHeader = resultBuffer.slice(0, 4).toString('hex');

                    if (!hexHeader.startsWith('89504e47') && !hexHeader.startsWith('ffd8')) {
                        try {
                            const jsonErr = JSON.parse(resultBuffer.toString('utf8'));
                            throw new Error(jsonErr.error || jsonErr.message || "Gagal generate gambar");
                        } catch (parseErr) {
                            throw new Error("Server mengembalikan gambar tidak valid.");
                        }
                    }

                    await shorekeeper.sendMessage(m.chat, {
                        image: resultBuffer,
                        caption: `\`⌜ iPhone Quoted Maker ⌟\`\n> ◦ *Status :* Sukses Dibuat\n> ◦ *Waktu :* ${timeStr} WIB`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('IQC Error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal membuat iPhone Quoted: ${err?.message || err}`);
                }
            }
            break;

            case "tofigure": {
                if (!isPrem && !isCreator) return Reply(global.mess.prem);
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const q = m.quoted ? m.quoted : m;
                const mime = (q.msg || q).mimetype || "";

                if (!/image/i.test(mime)) return Reply(example("dengan reply gambar"));

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏰", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const PROMPT_FIGURE = `Using the nano-banana model, a commercial 1/7 scale figurine of the character in the picture was created, depicting a realistic style and a realistic environment. The figurine is placed on a computer desk with a round transparent acrylic base. There is no text on the base. The computer screen shows the Zbrush modeling process of the figurine. Next to the computer screen is a BANDAI-style toy box with the original painting printed on it.`;

                try {
                    const userImageBuffer = await q.download();
                    if (!userImageBuffer) throw new Error("Gagal mengunduh gambar Anda.");

                    const userImageUrl = await uploadToCDN(userImageBuffer, mime);
                    if (!userImageUrl) throw new Error("Gagal upload gambar ke server");

                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;
                    const apiUrl = `${baseUrl}/imagecreator/bananaai?apikey=${apiKey}&url=${encodeURIComponent(userImageUrl)}&prompt=${encodeURIComponent(PROMPT_FIGURE)}`;

                    const response = await axios.get(apiUrl, {
                        responseType: "arraybuffer",
                        timeout: 180000,
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                    });

                    const hasilBuffer = Buffer.from(response.data);

                    await shorekeeper.sendMessage(m.chat, {
                        image: hasilBuffer,
                        caption: `\`⌜ 3D Action Figure Maker ⌟\`\n> ◦ *Status :* Sukses Dibuat\n> ◦ *Model :* 1/7 Scale PVC Figurine`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});

                } catch (e) {
                    console.error('[TOFIGURE ERROR]', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal membuat figure: ${e.message}`);
                }
            }
            break;

            case "tobotak":
            case "botak": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const q = m.quoted ? m.quoted : m;
                const mime = (q.msg || q).mimetype || "";

                if (!/image/i.test(mime)) return Reply(example("dengan reply gambar"));

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏰", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const PROMPT_BOTAK = `Make the person completely bald, smooth shaved clean scalp, realistic head shape, keep original face, facial features, and expression identical, photorealistic portrait.`;

                try {
                    const userImageBuffer = await q.download();
                    if (!userImageBuffer) throw new Error("Gagal mengunduh gambar Anda.");

                    const userImageUrl = await uploadToCDN(userImageBuffer, mime);
                    if (!userImageUrl) throw new Error("Gagal upload gambar ke server");

                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;
                    const apiUrl = `${baseUrl}/imagecreator/bananaai?apikey=${apiKey}&url=${encodeURIComponent(userImageUrl)}&prompt=${encodeURIComponent(PROMPT_BOTAK)}`;

                    const response = await axios.get(apiUrl, {
                        responseType: "arraybuffer",
                        timeout: 180000,
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                    });

                    const hasilBuffer = Buffer.from(response.data);

                    await shorekeeper.sendMessage(m.chat, {
                        image: hasilBuffer,
                        caption: `\`⌜ To Botak AI ⌟\`\n> ◦ *Status :* Sukses Dibuat\n> ◦ *Efek :* Kepala Botak Realistis`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});

                } catch (e) {
                    console.error('[TOBOTAK ERROR]', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengedit foto: ${e.message}`);
                }
            }
            break;

            case "tohitam":
            case "hitamin":
            case "hitamkan": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const q = m.quoted ? m.quoted : m;
                const mime = (q.msg || q).mimetype || "";

                if (!/image/i.test(mime)) return Reply(example("dengan reply gambar"));

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏰", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const PROMPT_HITAM = `Make the person skin tone darker and tanned, rich deep dark skin complexion, natural lighting, high quality portrait, keep original facial features, face, hair, and head shape identical.`;

                try {
                    const userImageBuffer = await q.download();
                    if (!userImageBuffer) throw new Error("Gagal mengunduh gambar Anda.");

                    const userImageUrl = await uploadToCDN(userImageBuffer, mime);
                    if (!userImageUrl) throw new Error("Gagal upload gambar ke server");

                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;
                    const apiUrl = `${baseUrl}/imagecreator/bananaai?apikey=${apiKey}&url=${encodeURIComponent(userImageUrl)}&prompt=${encodeURIComponent(PROMPT_HITAM)}`;

                    const response = await axios.get(apiUrl, {
                        responseType: "arraybuffer",
                        timeout: 180000,
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                    });

                    const hasilBuffer = Buffer.from(response.data);

                    await shorekeeper.sendMessage(m.chat, {
                        image: hasilBuffer,
                        caption: `\`⌜ To Hitam AI ⌟\`\n> ◦ *Status :* Sukses Dibuat\n> ◦ *Efek :* Kulit Hitam / Tanned Realistis`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});

                } catch (e) {
                    console.error('[TOHITAM ERROR]', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengedit foto: ${e.message}`);
                }
            }
            break;

            case "fakeff": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                if (!text || text.trim().length === 0) {
                    return Reply(`📌 *Contoh Penggunaan:*\n> ◦ ${command} Alipp|18\n> ◦ ${command} Alipp`);
                }

                let [name, number] = text.split('|').map(s => s.trim());
                if (!name) {
                    return Reply(`📌 *Format salah!*\n> ◦ Contoh: ${command} Alipp|18`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const paramNomor = number ? encodeURIComponent(number) : '';
                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;
                    const apiUrl = `${baseUrl}/imagecreator/fakeff?apikey=${apiKey}&nama=${encodeURIComponent(name)}&nomor=${paramNomor}`;

                    const response = await axios.get(apiUrl, {
                        responseType: 'arraybuffer',
                        timeout: 45000,
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                    });

                    const contentType = response.headers['content-type'];
                    if (contentType && contentType.includes('application/json')) {
                        const errData = JSON.parse(Buffer.from(response.data).toString('utf-8'));
                        await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                        return Reply(`❌ Gagal: ${errData.error || 'Terjadi kesalahan pada API'}`);
                    }

                    const imageBuffer = Buffer.from(response.data);
                    let captionTxt = `\`⌜ Fake Lobby Free Fire ⌟\`\n> ◦ *Nama :* ${name}`;
                    if (number) captionTxt += `\n> ◦ *Nomor :* ${number}`;
                    else captionTxt += `\n> ◦ *Nomor :* Random`;

                    await shorekeeper.sendMessage(m.chat, {
                        image: imageBuffer,
                        caption: captionTxt
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    console.error('[fakeff-error]', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal membuat fake lobby Free Fire: ${e.message}`);
                }
            }
            break;

            case "fakeml":
            case "fakeffml": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const q = m.quoted ? m.quoted : m;
                const mimeType = (q.msg || q).mimetype || '';
                const isImage = /image/.test(mimeType) || q.type === 'imageMessage';

                if (!isImage) {
                    return Reply(`\`⌜ Fake MLBB ⌟\`\n> ◦ *Format :* reply foto dengan caption ${command} username|rank|border`);
                }

                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Fake MLBB ⌟\`\n> ◦ *Format :* reply foto dengan caption ${command} username|rank|border`);
                }

                let username = '';
                let rank = 'imo';
                let border = '0';

                if (text.includes('|')) {
                    const parts = text.split('|').map(s => s.trim());
                    username = parts[0] || m.pushName || 'Player';
                    rank = parts[1] || rank;
                    border = parts[2] || border;
                } else {
                    username = text.trim();
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const imgBuf = await q.download();
                    if (!imgBuf || imgBuf.length === 0) throw new Error("Gagal mengunduh foto yang di-reply.");

                    const avatarUrl = await uploadToCDN(imgBuf, mimeType || 'image/jpeg');
                    if (!avatarUrl) throw new Error("Gagal mengunggah foto ke server CDN.");

                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;
                    const apiUrl = `${baseUrl}/imagecreator/fakeml?apikey=${apiKey}&username=${encodeURIComponent(username)}&avatar=${encodeURIComponent(avatarUrl)}&rank=${encodeURIComponent(rank)}&border=${encodeURIComponent(border)}`;

                    const res = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 45000 });
                    await shorekeeper.sendMessage(m.chat, {
                        image: Buffer.from(res.data),
                        caption: `\`⌜ Fake Lobby Mobile Legends ⌟\`\n> ◦ *Username :* ${username}\n> ◦ *Rank :* ${rank.toUpperCase()}\n> ◦ *Border :* ${border}`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    console.error('[FAKEML ERROR]', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal membuat fake ML: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "fakewa":
            case "qwa": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const q = m.quoted ? m.quoted : m;
                const mimeType = (q.msg || q).mimetype || '';
                const isImage = /image/.test(mimeType) || q.type === 'imageMessage';

                if (!isImage) {
                    return Reply(`\`⌜ Fake WhatsApp ⌟\`\n> ◦ *Format :* reply foto dengan caption ${command} teks|nomor wa|nama`);
                }

                let defaultPhone = `+${(m.sender || '6281234567890').split('@')[0]}`;
                let username = m.pushName || 'User';
                let phone = defaultPhone;
                let chatText = 'Halo semuanya!';
                let replyUser = '';
                let replyText = '';
                let replyPhone = '';

                if (m.quoted && m.quoted.text && m.quoted.text !== text) {
                    replyUser = m.quoted.pushName || m.quoted.sender?.split('@')[0] || 'User';
                    replyText = m.quoted.text || m.quoted.caption || m.quoted.conversation || '';
                    replyPhone = `+${(m.quoted.sender || '6281234567890').split('@')[0]}`;
                }

                if (text && text.trim().length > 0) {
                    if (text.includes('|')) {
                        const parts = text.split('|').map(s => s.trim());
                        if (parts.length >= 3) {
                            username = parts[0];
                            phone = parts[1];
                            chatText = parts.slice(2).join('|');
                        } else if (parts.length === 2) {
                            username = parts[0];
                            chatText = parts[1];
                        }
                    } else {
                        chatText = text.trim();
                    }
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const imgBuf = await q.download();
                    if (!imgBuf || imgBuf.length === 0) throw new Error("Gagal mengunduh foto yang di-reply.");

                    const avatarUrl = await uploadToCDN(imgBuf, mimeType || 'image/jpeg');
                    if (!avatarUrl) throw new Error("Gagal mengunggah foto ke server CDN.");

                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;

                    const params = {
                        apikey: apiKey,
                        image: avatarUrl,
                        text: chatText,
                        username: username,
                        phone: phone
                    };

                    if (replyUser && replyText) {
                        params.reply_user = replyUser;
                        params.reply_text = replyText;
                        params.reply_phone = replyPhone;
                    }

                    const res = await axios.get(`${baseUrl}/imagecreator/fakewa`, {
                        params,
                        responseType: 'arraybuffer',
                        timeout: 45000
                    });

                    await shorekeeper.sendMessage(m.chat, {
                        image: Buffer.from(res.data),
                        caption: `\`⌜ Fake WhatsApp Chat ⌟\`\n> ◦ *User :* ${username}\n> ◦ *Nomor :* ${phone}\n> ◦ *Pesan :* ${chatText}`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    console.error('[FAKEWA ERROR]', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal membuat fake WA: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "bananagen": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Banana AI ⌟\`\n> ◦ *Format :* ${command} prompt`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "🎨", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/imagecreator/bananagen?apikey=${apiKey}&prompt=${encodeURIComponent(text.trim())}`, {
                        responseType: 'arraybuffer',
                        timeout: 60000
                    });

                    await shorekeeper.sendMessage(m.chat, {
                        image: Buffer.from(res.data),
                        caption: `\`⌜ Banana AI Generator ⌟\`\n> ◦ *Prompt :* ${text.trim()}`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    console.error('[BANANAGEN ERROR]', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal menghasilkan gambar: ${e.message}`);
                }
            }
            break;

            // ==================== TOOLS COMMANDS ====================
            // ─── RVO V2 — Cache-first + Auto-fallback ───────────────
            case "rvo2":
            case "rvo":
            case "readviewonce":
            case "readvo":
            case "openvo": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                // ── Init global cache (sekali aja) ──
                if (!global.rvoCache)       global.rvoCache       = new Map();
                if (!global.rvoCacheMeta)   global.rvoCacheMeta   = new Map();

                if (!m.quoted) {
                    return Reply(
                        `\`⌜ Read View Once V2 ⌟\`\n` +
                        `> ◦ *Format :* reply pesan view once dengan *${command}*\n` +
                        `> ◦ *Mode   :* Cache-first + Auto-fallback\n` +
                        `> ◦ *Cache  :* ${global.rvoCache.size} pesan tersimpan`
                    );
                }

                // ── Helper: lepas semua wrapper viewOnce / ephemeral ──
                const _rvoUnwrap = (msg) => {
                    let m2 = msg;
                    for (let i = 0; i < 6 && m2; i++) {
                        const next =
                            m2.viewOnceMessageV2?.message         ||
                            m2.viewOnceMessageV2Extension?.message ||
                            m2.viewOnceMessage?.message            ||
                            m2.ephemeralMessage?.message           ||
                            m2.documentWithCaptionMessage?.message;
                        if (!next) break;
                        m2 = next;
                    }
                    return m2;
                };

                // ── Helper: download stream → Buffer ──
                const _rvoDownload = async (content, type) => {
                    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
                    const mediaType = type.replace('Message', '').toLowerCase();
                    const stream    = await downloadContentFromMessage(content, mediaType);
                    const chunks    = [];
                    for await (const chunk of stream) chunks.push(chunk);
                    return Buffer.concat(chunks);
                };

                // ── Helper: kirim media ──
                const _rvoSend = async (data, senderTag) => {
                    const { type, buffer, mimetype, caption, ptt } = data;
                    const infoCaption =
                        `\`⌜ Read View Once V2 ⌟\`\n` +
                        `> ◦ *Dari :* ${senderTag}` +
                        (caption ? `\n> ◦ *Caption :* ${caption}` : '');
                    const opts = { quoted: m };

                    if (type === 'videoMessage' || /video/i.test(mimetype)) {
                        await shorekeeper.sendMessage(m.chat, {
                            video    : buffer,
                            caption  : infoCaption,
                            mimetype : mimetype || 'video/mp4',
                            mentions : m.quoted?.sender ? [m.quoted.sender] : []
                        }, opts);
                    } else if (type === 'audioMessage' || /audio/i.test(mimetype)) {
                        await shorekeeper.sendMessage(m.chat, {
                            audio    : buffer,
                            mimetype : mimetype || 'audio/mp4',
                            ptt      : ptt || false,
                        }, opts);
                    } else {
                        await shorekeeper.sendMessage(m.chat, {
                            image    : buffer,
                            caption  : infoCaption,
                            mimetype : mimetype || 'image/jpeg',
                            mentions : m.quoted?.sender ? [m.quoted.sender] : []
                        }, opts);
                    }
                };

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});

                try {
                    const ctx       = m.message?.extendedTextMessage?.contextInfo;
                    const stanzaId  = ctx?.stanzaId;
                    const MEDIA_T   = ['imageMessage', 'videoMessage', 'audioMessage'];

                    // ── Path 1: Ambil dari cache (paling reliable) ──
                    const _num = (j) => String(j || '').split('@')[0].split(':')[0];
                    let cachedId = stanzaId && global.rvoCache.has(stanzaId) ? stanzaId : null;

                    // Fallback ID: cache terbaru dari pengirim yg sama di chat yg sama (maks 30 menit)
                    if (!cachedId) {
                        const qNum = _num(ctx?.participant || m.quoted?.sender);
                        let best = null;
                        for (const [id, e] of global.rvoCache) {
                            if (e.chat !== m.chat) continue;
                            if (Date.now() - e.cachedAt > 30 * 60 * 1000) continue;
                            if (qNum && _num(e.sender) !== qNum) continue;
                            if (!best || e.cachedAt > best.cachedAt) best = { id, cachedAt: e.cachedAt };
                        }
                        if (best) cachedId = best.id;
                    }

                    const cached = cachedId && global.rvoCache.get(cachedId);
                    if (cached) {
                        // Buffer belum ada (download saat masuk gagal) → coba download sekarang
                        if (!cached.buffer && cached.content?.mediaKey?.length) {
                            cached.buffer = await _rvoDownload(cached.content, cached.type).catch(() => null);
                        }
                        if (cached.buffer && cached.buffer.length) {
                            const meta      = global.rvoCacheMeta.get(cachedId) || {};
                            const senderTag = meta.sender ? `@${meta.sender.split('@')[0]}` : 'Pengirim';
                            await _rvoSend(cached, senderTag);
                            addLimit(m.sender, isCreator);
                            await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                            break;
                        }
                    }
                    console.log('[RVO V2] cache miss. stanzaId:', stanzaId, 'cacheSize:', global.rvoCache.size, 'terakhir:', [...global.rvoCache.keys()].slice(-3).join(','));

                    // ── Path 2: Fallback — download dari quoted ──
                    const rawQuoted = ctx?.quotedMessage || m.quoted?.message || {};
                    const inner     = _rvoUnwrap(rawQuoted);
                    const type      = MEDIA_T.find(t => inner?.[t]);

                    if (!type) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return Reply('❌ Tidak ada foto/video/audio di pesan yang di-reply.');
                    }

                    const content = inner[type];

                    if (!content.mediaKey || content.mediaKey.length === 0) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '😔', key: m.key } }).catch(() => {});
                        return Reply(
                            '❌ *Media key tidak tersedia.*\n\n' +
                            '> Bot tidak online saat pesan dikirim atau cache sudah bersih.\n' +
                            '> Minta pengirim kirim ulang, lalu langsung .rvo sebelum dibuka.'
                        );
                    }

                    const buffer = await _rvoDownload(content, type);
                    if (!buffer || buffer.length === 0) throw new Error('Buffer kosong setelah download.');

                    const senderTag = m.quoted?.sender
                        ? `@${m.quoted.sender.split('@')[0]}`
                        : 'Pengirim';

                    await _rvoSend({
                        type,
                        buffer,
                        mimetype : content.mimetype || '',
                        caption  : content.caption  || m.quoted?.text || '',
                        ptt      : content.ptt      || false,
                    }, senderTag);

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});

                } catch (err) {
                    console.error('[RVO V2 error]', err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal membaca View Once: ${err.message}`);
                }
            }
            break;

            // ─── RVO LAST — ambil view-once terbaru dari cache, tanpa reply ───
            // Pakai: .rvolast [jumlah 1-5]
            case "rvolast":
            case "lastvo":
            case "rvoa": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const _maxAge = 60 * 60 * 1000; // hanya yang masuk <= 60 menit terakhir
                const _count  = Math.min(Math.max(parseInt(args?.[0]) || 1, 1), 5);
                const _list   = [...(global.rvoCache || new Map()).entries()]
                    .filter(([, e]) => e.vo && e.chat === m.chat && (Date.now() - e.cachedAt) <= _maxAge)
                    .sort((a, b) => b[1].cachedAt - a[1].cachedAt)
                    .slice(0, _count)
                    .reverse();

                if (!_list.length) {
                    return Reply(
                        '❌ Belum ada view once yang diterima bot di chat ini (60 menit terakhir).\n' +
                        'Catatan: view once yang dikirim dari akun yang sama dengan bot tidak dikirim WhatsApp ke bot.'
                    );
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
                let _sent = 0;

                for (const [id, e] of _list) {
                    try {
                        if (!e.buffer && e.content?.mediaKey?.length) {
                            const stream = await downloadContentFromMessage(e.content, e.type.replace('Message', '').toLowerCase());
                            const chunks = [];
                            for await (const c of stream) chunks.push(c);
                            e.buffer = Buffer.concat(chunks);
                        }
                        if (!e.buffer || !e.buffer.length) {
                            console.log('[RVO LAST] buffer kosong, lewati. id:', id);
                            continue;
                        }

                        const tag  = `@${String(e.sender).split('@')[0].split(':')[0]}`;
                        const info = `\`⌜ Read View Once ⌟\`\n> ◦ *Dari :* ${tag}` + (e.caption ? `\n> ◦ *Caption :* ${e.caption}` : '');
                        const opts = { quoted: m };

                        if (e.type === 'videoMessage' || /video/i.test(e.mimetype)) {
                            await shorekeeper.sendMessage(m.chat, { video: e.buffer, caption: info, mimetype: e.mimetype || 'video/mp4', mentions: [e.sender] }, opts);
                        } else if (e.type === 'audioMessage' || /audio/i.test(e.mimetype)) {
                            await shorekeeper.sendMessage(m.chat, { audio: e.buffer, mimetype: e.mimetype || 'audio/mp4', ptt: e.ptt || false }, opts);
                        } else {
                            await shorekeeper.sendMessage(m.chat, { image: e.buffer, caption: info, mimetype: e.mimetype || 'image/jpeg', mentions: [e.sender] }, opts);
                        }
                        _sent++;
                    } catch (err) {
                        console.error('[RVO LAST] gagal. id:', id, err?.message || err);
                    }
                }

                if (_sent) {
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } else {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    Reply('❌ View once ada di cache, tapi media gagal diunduh. Cek console: [RVO LAST].');
                }
            }
            break;

            case "ocr":
            case "imagetotext":
            case "itt": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const isImage = /image/i.test(mime) || m.type === 'imageMessage' || (m.quoted && m.quoted.type === 'imageMessage');
                if (!isImage) {
                    return Reply(`\`⌜ Scan OCR ⌟\`\n> ◦ *Format :* reply foto dengan ${command}`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    let mediaBuffer = null;
                    if (typeof qmsg.download === 'function') {
                        mediaBuffer = await qmsg.download();
                    } else if (typeof quoted.download === 'function') {
                        mediaBuffer = await quoted.download();
                    } else if (typeof m.download === 'function') {
                        mediaBuffer = await m.download();
                    } else {
                        mediaBuffer = await shorekeeper.downloadMediaMessage(quoted || m);
                    }

                    if (!mediaBuffer || mediaBuffer.length === 0) {
                        throw new Error("Gagal mengunduh gambar.");
                    }

                    const cdnUrl = await uploadToCDN(mediaBuffer, mime || 'image/jpeg');
                    if (!cdnUrl) throw new Error("Gagal mengupload gambar ke CDN");

                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;

                    const res = await axios.get(`${baseUrl}/tools/ocr?apikey=${apiKey}&url=${encodeURIComponent(cdnUrl)}`, {
                        timeout: 35000
                    });

                    const ocrResult = res.data?.result;
                    if (!ocrResult || ocrResult.trim().length === 0) {
                        throw new Error("Teks tidak dapat dideteksi pada gambar.");
                    }

                    const replyMsg = `\`⌜ Hasil Scan OCR ⌟\`\n\n${ocrResult.trim()}`;
                    await Reply(replyMsg);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('OCR Error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal OCR: ${err.response?.data?.error || err.message}`);
                }
            }
            break;

            case "toprompt":
            case "img2prompt":
            case "image2prompt":
            case "promptimg": {
                if (!isPrem && !isCreator) return Reply(global.mess.prem);
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const isImage = /image/i.test(mime) || m.type === 'imageMessage' || (m.quoted && m.quoted.type === 'imageMessage');
                if (!isImage) {
                    return Reply(`\`⌜ Image to Prompt ⌟\`\n> ◦ *Format :* reply foto dengan ${command}`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const allowedModels = ['general', 'midjourney', 'flux', 'stablediffusion'];
                let chosenModel = 'general';
                if (text && text.trim().length > 0) {
                    const argModel = text.trim().toLowerCase();
                    if (allowedModels.includes(argModel)) {
                        chosenModel = argModel;
                    }
                }

                try {
                    let mediaBuffer = null;
                    if (typeof qmsg.download === 'function') {
                        mediaBuffer = await qmsg.download();
                    } else if (typeof quoted.download === 'function') {
                        mediaBuffer = await quoted.download();
                    } else if (typeof m.download === 'function') {
                        mediaBuffer = await m.download();
                    } else {
                        mediaBuffer = await shorekeeper.downloadMediaMessage(quoted || m);
                    }

                    if (!mediaBuffer || mediaBuffer.length === 0) {
                        throw new Error("Gagal mengunduh gambar.");
                    }

                    const cdnUrl = await uploadToCDN(mediaBuffer, mime || 'image/jpeg');
                    if (!cdnUrl) throw new Error("Gagal mengupload gambar ke CDN");

                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;

                    const res = await axios.get(`${baseUrl}/ai/toprompt?apikey=${apiKey}&url=${encodeURIComponent(cdnUrl)}&model=${chosenModel}`, {
                        timeout: 45000
                    });

                    const data = res.data?.result;
                    if (!data || !data.prompt) {
                        throw new Error(res.data?.error || "Gagal membuat prompt dari gambar.");
                    }

                    const outputTxt = `\`⌜ AI Image To Prompt ⌟\`
> ◦ *Model AI :* ${data.model.toUpperCase()}
> ◦ *Bahasa :* ${data.language.toUpperCase()}

*Prompt :*
${data.prompt}`;

                    await Reply(outputTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('Toprompt Error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengonversi gambar menjadi prompt: ${err.response?.data?.error || err.message}`);
                }
            }
            break;

            case "tts":
            case "text2sound":
            case "texttospeech":
            case "gtts": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const rawText = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!rawText || rawText.trim().length === 0) {
                    return Reply(`\`⌜ Text To Speech ⌟\`\n> ◦ *Format :* ${command} teks`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});

                let targetText = rawText.trim();
                let volPercent = 100;
                let lang = 'id';

                if (targetText.includes('|')) {
                    const parts = targetText.split('|');
                    targetText = parts[0].trim();
                    const rawVol = parts[1].replace(/[^0-9]/g, '');
                    if (rawVol) {
                        volPercent = Math.min(500, Math.max(100, parseInt(rawVol, 10)));
                    }
                }

                const firstWord = targetText.split(/\s+/)[0].toLowerCase();
                const supportedLangs = ['id', 'en', 'ja', 'ko', 'ar', 'jv', 'su', 'es', 'fr', 'de', 'ru', 'zh', 'pt', 'it'];
                if (supportedLangs.includes(firstWord) && targetText.split(/\s+/).length > 1) {
                    lang = firstWord;
                    targetText = targetText.substring(firstWord.length).trim();
                }

                if (!targetText || targetText.length === 0) {
                    return Reply("❌ Teks untuk TTS tidak boleh kosong.");
                }

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/tools/text-to-speech?apikey=${apiKey}&text=${encodeURIComponent(targetText)}&lang=${lang}`, {
                        responseType: 'arraybuffer',
                        timeout: 30000
                    });

                    let audioBuffer = Buffer.from(res.data);
                    if (!audioBuffer || audioBuffer.length === 0) {
                        throw new Error("Gagal mengambil audio TTS");
                    }

                    if (volPercent > 100) {
                        const volFactor = (volPercent / 100).toFixed(2);
                        const tmpIn = path.join(__dirname, 'tmp', `tts_in_${Date.now()}.mp3`);
                        const tmpOut = path.join(__dirname, 'tmp', `tts_out_${Date.now()}.mp3`);
                        if (!fs.existsSync(path.join(__dirname, 'tmp'))) fs.mkdirSync(path.join(__dirname, 'tmp'), { recursive: true });
                        fs.writeFileSync(tmpIn, audioBuffer);
                        const { execSync } = require('child_process');
                        execSync(`ffmpeg -y -i "${tmpIn}" -filter:a "volume=${volFactor}" -c:a libmp3lame "${tmpOut}"`);
                        if (fs.existsSync(tmpOut)) {
                            audioBuffer = fs.readFileSync(tmpOut);
                            try { fs.unlinkSync(tmpOut); } catch(e) {}
                        }
                        try { fs.unlinkSync(tmpIn); } catch(e) {}
                    }

                    await shorekeeper.sendMessage(m.chat, {
                        audio: audioBuffer,
                        mimetype: 'audio/mp4',
                        ptt: true
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('TTS error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal TTS: ${err.message}`);
                }
            }
            break;

            case "volume":
            case "vol":
            case "volumeboost":
            case "boostvol": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const isAudio = /audio/i.test(mime) || m.type === 'audioMessage' || (m.quoted && m.quoted.type === 'audioMessage');
                const isVideo = /video/i.test(mime) || m.type === 'videoMessage' || (m.quoted && m.quoted.type === 'videoMessage');

                if (!isAudio && !isVideo) {
                    return Reply(`\`⌜ Volume ⌟\`\n> ◦ *Format :* reply audio/video dengan caption ${command} 100% dst`);
                }

                let volPercent = 200;
                if (text && text.trim().length > 0) {
                    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
                    if (!isNaN(parsed)) {
                        volPercent = Math.min(500, Math.max(100, parsed));
                    }
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    let mediaBuffer = null;
                    if (typeof qmsg.download === 'function') {
                        mediaBuffer = await qmsg.download();
                    } else if (typeof quoted.download === 'function') {
                        mediaBuffer = await quoted.download();
                    } else if (typeof m.download === 'function') {
                        mediaBuffer = await m.download();
                    } else {
                        mediaBuffer = await shorekeeper.downloadMediaMessage(quoted || m);
                    }

                    if (!mediaBuffer || mediaBuffer.length === 0) {
                        throw new Error("Gagal mengunduh media dari pesan.");
                    }

                    const volFactor = (volPercent / 100).toFixed(2);
                    const tmpDir = path.join(__dirname, 'tmp');
                    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
                    const fileId = Date.now();
                    const { execSync } = require('child_process');

                    if (isVideo) {
                        const tmpIn = path.join(tmpDir, `vol_in_${fileId}.mp4`);
                        const tmpOut = path.join(tmpDir, `vol_out_${fileId}.mp4`);
                        fs.writeFileSync(tmpIn, mediaBuffer);
                        execSync(`ffmpeg -y -i "${tmpIn}" -c:v copy -filter:a "volume=${volFactor}" -c:a aac -b:a 128k -movflags +faststart "${tmpOut}"`);
                        const boostedBuf = fs.readFileSync(tmpOut);
                        await shorekeeper.sendMessage(m.chat, {
                            video: boostedBuf,
                            caption: `\`⌜ Volume Boosted ⌟\`\n> ◦ *Tingkat Volume :* ${volPercent}%\n> ◦ *Tipe :* Video`,
                            mimetype: 'video/mp4'
                        }, { quoted: m });
                        try { fs.unlinkSync(tmpIn); } catch(e) {}
                        try { fs.unlinkSync(tmpOut); } catch(e) {}
                    } else {
                        const tmpIn = path.join(tmpDir, `vol_in_${fileId}.mp3`);
                        const tmpOut = path.join(tmpDir, `vol_out_${fileId}.mp3`);
                        fs.writeFileSync(tmpIn, mediaBuffer);
                        execSync(`ffmpeg -y -i "${tmpIn}" -filter:a "volume=${volFactor}" -c:a libmp3lame -b:a 128k "${tmpOut}"`);
                        const boostedBuf = fs.readFileSync(tmpOut);
                        const isPtt = Boolean(qmsg.ptt || (quoted.msg && quoted.msg.ptt));
                        await shorekeeper.sendMessage(m.chat, {
                            audio: boostedBuf,
                            mimetype: 'audio/mp4',
                            ptt: isPtt
                        }, { quoted: m });
                        try { fs.unlinkSync(tmpIn); } catch(e) {}
                        try { fs.unlinkSync(tmpOut); } catch(e) {}
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('Volume boost error:', err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal memperbesar volume: ${err.message}`);
                }
            }
            break;

            case "tempo":
            case "speed":
            case "setspeed": {
                if (!isPrem && !isCreator) return Reply(global.mess.prem);
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const q = m.quoted ? m.quoted : m;
                const mimeType = (q.msg || q).mimetype || '';
                const isAudio = /audio/.test(mimeType) || q.type === 'audioMessage';

                const speed = parseFloat(text);
                if (isNaN(speed) || !text || !isAudio) {
                    return Reply(`\`⌜ Tempo Audio ⌟\`\n> ◦ *Format :* reply audio dengan caption ${command} 0.8 / 1.5`);
                }

                if (speed < 0.5 || speed > 2.0) {
                    return Reply("❌ Kecepatan harus antara 0.5 dan 2.0 untuk menjaga kualitas audio!");
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const tempDir = path.join(__dirname, 'tmp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                const fileId = Date.now();
                const inputPath = path.join(tempDir, `tempo_in_${fileId}.mp3`);
                const outputPath = path.join(tempDir, `tempo_out_${fileId}.mp3`);

                try {
                    let buffer = null;
                    if (typeof q.download === 'function') {
                        buffer = await q.download();
                    } else if (typeof qmsg.download === 'function') {
                        buffer = await qmsg.download();
                    } else {
                        buffer = await shorekeeper.downloadMediaMessage(q);
                    }

                    if (!buffer || buffer.length === 0) {
                        throw new Error("Gagal mengambil file audio.");
                    }

                    fs.writeFileSync(inputPath, buffer);
                    const { execSync } = require('child_process');
                    execSync(`ffmpeg -y -i "${inputPath}" -filter:a "asetrate=48000*${speed},aresample=48000" -c:a libmp3lame -b:a 128k "${outputPath}"`);

                    const isPtt = Boolean(q.msg?.ptt || (q.quoted && q.quoted.msg?.ptt));
                    await shorekeeper.sendMessage(m.chat, {
                        audio: fs.readFileSync(outputPath),
                        mimetype: 'audio/mpeg',
                        fileName: `tempo_${speed}x.mp3`,
                        ptt: isPtt
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (error) {
                    console.error('Tempo Error:', error);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengubah tempo audio: ${error.message}`);
                } finally {
                    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch (e) {}
                    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
                }
            }
            break;

            case "ssweb":
            case "screenshotweb":
            case "ss": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                let targetUrl = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!targetUrl || targetUrl.trim().length === 0) {
                    return Reply(`\`⌜ Screenshot Web ⌟\`\n> ◦ *Format :* ${command} url`);
                }

                targetUrl = targetUrl.trim();
                if (!/^https?:\/\//i.test(targetUrl)) {
                    targetUrl = `https://${targetUrl}`;
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/tools/ssweb?apikey=${apiKey}&url=${encodeURIComponent(targetUrl)}`, {
                        timeout: 35000
                    });

                    const imgUrl = res.data?.result;
                    if (!imgUrl) {
                        throw new Error(res.data?.error || "Gagal mengambil screenshot website.");
                    }

                    const captionTxt = `\`⌜ Screenshot Website ⌟\`\n> ◦ *URL :* ${targetUrl}`;
                    try {
                        const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
                        await shorekeeper.sendMessage(m.chat, {
                            image: Buffer.from(imgRes.data),
                            caption: captionTxt
                        }, { quoted: m });
                    } catch (eDl) {
                        await shorekeeper.sendMessage(m.chat, {
                            image: { url: imgUrl },
                            caption: captionTxt
                        }, { quoted: m });
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('SSWeb error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengambil screenshot website: ${err.response?.data?.error || err.message}`);
                }
            }
            break;

            case "idch":
            case "cekidch":
            case "inspectch":
            case "inspect":
            case "idsaluran": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                let rawInput = (text || m.quoted?.text || m.quoted?.conversation || '').trim();
                let inviteCode = '';
                let jid = '';

                if (m.quoted?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterJid) {
                    jid = m.quoted.contextInfo.forwardedNewsletterMessageInfo.newsletterJid;
                }

                const channelMatch = rawInput.match(/whatsapp\.com\/channel\/([a-zA-Z0-9_-]+)/i);
                if (channelMatch) {
                    inviteCode = channelMatch[1].split(/[?&]/)[0];
                } else if (/^[a-zA-Z0-9_-]{20,32}$/.test(rawInput)) {
                    inviteCode = rawInput;
                } else if (rawInput.endsWith('@newsletter')) {
                    jid = rawInput;
                }

                if (!inviteCode && !jid) {
                    return Reply(`╔─╼═[ ᴘᴀɴᴅᴜᴀɴ ɪᴅᴄʜ ]═─፨፦⋆\n│ ❈ ꜰᴏʀᴍᴀᴛ : .${command} <link saluran>\n│ ❈ ᴄᴏɴᴛᴏʜ : .${command} https://whatsapp.com/channel/0029VaBOlsv002TEjlntTE2D\n│ ❈ ᴛɪᴘs   : Bisa juga reply pesan yang diteruskan dari saluran WhatsApp\n╙────────···`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});

                try {
                    let res = null;
                    if (inviteCode) {
                        res = await shorekeeper.newsletterMetadata("invite", inviteCode).catch(() => null);
                    } else if (jid) {
                        res = await shorekeeper.newsletterMetadata("jid", jid).catch(() => null);
                    }

                    if (!res) {
                        if (jid) {
                            res = {
                                id: jid,
                                name: m.quoted?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterName || 'Saluran WhatsApp',
                                subscribers: 0,
                                state: 'ACTIVE',
                                verification: 'UNVERIFIED',
                                description: '-'
                            };
                        } else {
                            await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                            return Reply(`╔─╼═[ ɢᴀɢᴀʟ ]═─፨፦⋆\n│ ❈ ɪɴꜰᴏ : Gagal mengambil data saluran!\n│ ❈ ᴛɪᴘs : Pastikan link/kode saluran publik dan masih aktif.\n╙────────···`);
                        }
                    }

                    const followers = res.subscribers ? Number(res.subscribers).toLocaleString('id-ID') : '-';
                    const verified = res.verification === 'VERIFIED' ? '✅ Terverifikasi' : '❌ Belum';
                    const status = res.state || 'ACTIVE';
                    const channelId = res.id || jid;
                    const channelName = res.name || '-';
                    const channelDesc = res.description ? res.description.trim().slice(0, 150) : '-';
                    const channelLink = inviteCode ? `https://whatsapp.com/channel/${inviteCode}` : (global.linkSaluran || '');

                    let caption = `╔─╼═[ ɪɴꜰᴏ sᴀʟᴜʀᴀɴ ]═─፨፦⋆\n`;
                    caption += `│ ❈ ɴᴀᴍᴀ      : ${channelName}\n`;
                    caption += `│ ❈ ɪᴅ        : ${channelId}\n`;
                    caption += `│ ❈ ꜰᴏʟʟᴏᴡᴇʀ  : ${followers}\n`;
                    caption += `│ ❈ sᴛᴀᴛᴜs    : ${status}\n`;
                    caption += `│ ❈ ᴠᴇʀɪꜰɪᴇᴅ  : ${verified}\n`;
                    caption += `│ ❈ ᴅᴇsᴋʀɪᴘsɪ : ${channelDesc}\n`;
                    caption += `╙────────···`;

                    let buttonSent = false;
                    try {
                        const { Button } = require('./library/baileys-mbuilder/index');
                        const btn = new Button(shorekeeper);
                        btn.setBody(caption)
                           .setFooter(`© ${global.botname || 'Hitoshi MD V1'} • Channel Info`)
                           .addCopy('📋 Salin ID', channelId);

                        if (channelLink) {
                            btn.addUrl('📢 Buka Saluran', channelLink);
                        }

                        if (res.picture?.url || res.preview?.url) {
                            btn.setImage(res.picture?.url || res.preview?.url);
                        } else if (global.image?.menu) {
                            btn.setImage(global.image.menu);
                        }

                        await btn.send(m.chat, { quoted: m });
                        buttonSent = true;
                    } catch (eBtn) {
                        buttonSent = false;
                    }

                    if (!buttonSent) {
                        await Reply(caption);
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    console.error('IDCH Error:', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`╔─╼═[ ɢᴀɢᴀʟ ]═─፨፦⋆\n│ ❈ ɪɴꜰᴏ : Terjadi kesalahan saat memeriksa channel: ${e.message}\n╙────────···`);
                }
            }
            break;

            case "shortlink":
            case "shorturl":
            case "tinyurl":
            case "isgd": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                let raw = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!raw || raw.trim().length === 0) {
                    return Reply(`\`⌜ Shortlink ⌟\`\n> ◦ *Format :* ${command} url`);
                }

                let targetUrl = raw.trim();
                let provider = command === 'isgd' ? 'isgd' : command === 'tinyurl' ? 'tinyurl' : 'tinyurl';

                if (targetUrl.includes('|')) {
                    const parts = targetUrl.split('|');
                    targetUrl = parts[0].trim();
                    provider = parts[1].trim().toLowerCase() || provider;
                }

                if (!/^https?:\/\//i.test(targetUrl)) {
                    targetUrl = `https://${targetUrl}`;
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/tools/shortlink?apikey=${apiKey}&url=${encodeURIComponent(targetUrl)}&provider=${provider}`, {
                        timeout: 20000
                    });

                    const data = res.data?.result;
                    if (!data || !data.shortUrl) {
                        throw new Error(res.data?.error || "Gagal memendekkan URL.");
                    }

                    const resultTxt = `\`⌜ Shortlink Generator ⌟\`
> ◦ *Original :* ${data.originalUrl}
> ◦ *Short URL :* ${data.shortUrl}
> ◦ *Provider :* ${data.provider.toUpperCase()}`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('Shortlink error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal membuat shortlink: ${err.response?.data?.error || err.message}`);
                }
            }
            break;

            // ==================== FUN & JOKE COMMANDS ====================
            case "cekkhodam":
            case "khodam": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let targetName = text || m.quoted?.pushName || (m.quoted?.sender ? `@${m.quoted.sender.split('@')[0]}` : m.pushName) || 'Kamu';

                await shorekeeper.sendMessage(m.chat, { react: { text: "🔮", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/tools/cek-khodam?apikey=${apiKey}&nama=${encodeURIComponent(targetName.trim())}`);
                    const data = res.data?.result;
                    if (!data || !data.khodam) throw new Error("Gagal mengecek khodam.");

                    const resultTxt = `\`⌜ Cek Khodam ⌟\`
> ◦ *Nama :* ${data.nama}
> ◦ *Khodam :* *${data.khodam}*
> ◦ *Karakter :* ${data.sifat || 'Misterius dan kuat'}
> ◦ *Arti :* ${data.arti || 'Selalu mendampingi kemanapun pergi'}`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal cek khodam: ${e.message}`);
                }
            }
            break;

            case "cekcantik":
            case "cantikcek": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let target = text || m.quoted?.pushName || (m.quoted?.sender ? `@${m.quoted.sender.split('@')[0]}` : m.pushName) || 'Kamu';
                const percent = Math.floor(Math.random() * 101);
                const comments = [
                    "Bidadari tak bersayap turun ke bumi 😍",
                    "Manisnya kelewatan sampai bikin diabetes! ✨",
                    "Cakep standar internasional! 💖",
                    "Cantik natural tanpa filter ✨",
                    "Masih butuh sedikit bedak dan wudhu biar makin glowing 💄",
                    "Cantik dari dalam hati... kalau dari luar ya lumayan lah 🗿",
                    "Buram banget, kayak masa depan mantan 😭"
                ];
                const comment = comments[Math.floor(Math.random() * comments.length)];

                const resultTxt = `\`⌜ Cek Kecantikan ⌟\`
> ◦ *Target :* ${target}
> ◦ *Persentase :* *${percent}%*
> ◦ *Catatan :* ${comment}`;

                await Reply(resultTxt);
                addLimit(m.sender, isCreator);
            }
            break;

            case "cekganteng":
            case "gantengcek": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let target = text || m.quoted?.pushName || (m.quoted?.sender ? `@${m.quoted.sender.split('@')[0]}` : m.pushName) || 'Kamu';
                const percent = Math.floor(Math.random() * 101);
                const comments = [
                    "Ketampanan mutlak tak tertandingi! 😎",
                    "Ganteng maksimal, idaman para cewek ✨",
                    "Ganteng kalem ala CEO drama korea 👔",
                    "Lumayan lah, minimal punya wajah 🗿",
                    "Muka pas-pasan tapi rezeki insyaAllah lancar 🤲",
                    "Ganteng kalau dilihat dari sedotan sambil merem 😭",
                    "Pria dengan pesona misterius 🕶️"
                ];
                const comment = comments[Math.floor(Math.random() * comments.length)];

                const resultTxt = `\`⌜ Cek Kegantengan ⌟\`
> ◦ *Target :* ${target}
> ◦ *Persentase :* *${percent}%*
> ◦ *Catatan :* ${comment}`;

                await Reply(resultTxt);
                addLimit(m.sender, isCreator);
            }
            break;

            case "cekbirahi":
            case "birahicek": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let target = text || m.quoted?.pushName || (m.quoted?.sender ? `@${m.quoted.sender.split('@')[0]}` : m.pushName) || 'Kamu';
                const percent = Math.floor(Math.random() * 101);
                const comments = [
                    "Bahaya! Harap segera ambil wudhu atau nikah sekarang juga! 🚨",
                    "Lagi membara, butuh pendingin ruangan! 🔥",
                    "Tingkat tinggi! Jangan biarkan dia sendirian di kamar! 🔞",
                    "Sedang-sedang saja, masih bisa ditahan dengan nonton ceramah 😇",
                    "Tenang dan suci, terbebas dari godaan duniawi 🧘‍♂️",
                    "Hati adem ayem seperti es kutub ❄️"
                ];
                const comment = comments[Math.floor(Math.random() * comments.length)];

                const resultTxt = `\`⌜ Cek Tingkat Birahi ⌟\`
> ◦ *Target :* ${target}
> ◦ *Persentase :* *${percent}%*
> ◦ *Catatan :* ${comment}`;

                await Reply(resultTxt);
                addLimit(m.sender, isCreator);
            }
            break;

            case "cekwibu":
            case "wibucek": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let target = text || m.quoted?.pushName || (m.quoted?.sender ? `@${m.quoted.sender.split('@')[0]}` : m.pushName) || 'Kamu';
                const percent = Math.floor(Math.random() * 101);
                const comments = [
                    "Bau bawang terdeteksi dari jarak 500 meter! 🧅",
                    "Wibu akut! Waifunya ada di 10 dimensi berbeda ⛩️",
                    "Sering teriak 'Yamete Kudasai' tengah malam 🗿",
                    "Penikmat anime musiman dan waifu sejuta umat 🍙",
                    "Wibu santai, cuma nonton anime pas gabut 🍥",
                    "Normal, masih kenal dunia nyata dan rumput hijau 🌱"
                ];
                const comment = comments[Math.floor(Math.random() * comments.length)];

                const resultTxt = `\`⌜ Cek Tingkat Wibu ⌟\`
> ◦ *Target :* ${target}
> ◦ *Persentase :* *${percent}%*
> ◦ *Catatan :* ${comment}`;

                await Reply(resultTxt);
                addLimit(m.sender, isCreator);
            }
            break;

            case "cektolol":
            case "cekbego":
            case "tololcek": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let target = text || m.quoted?.pushName || (m.quoted?.sender ? `@${m.quoted.sender.split('@')[0]}` : m.pushName) || 'Kamu';
                const percent = Math.floor(Math.random() * 101);
                const comments = [
                    "Sangat jenius dalam hal-hal yang tidak berguna 🗿",
                    "Otak 4G tapi sinyalnya sering Edge 📶",
                    "Kadang loading lama kayak modem jaman purba ⏳",
                    "Pintar tapi pura-pura bego biar gak disuruh-suruh 🧠",
                    "Aman, masih bisa bedain mana garam mana micin 🧂",
                    "Jenius tak tertandingi, Einstein pun sungkem! 🎓"
                ];
                const comment = comments[Math.floor(Math.random() * comments.length)];

                const resultTxt = `\`⌜ Cek Tingkat Ketololan ⌟\`
> ◦ *Target :* ${target}
> ◦ *Persentase :* *${percent}%*
> ◦ *Catatan :* ${comment}`;

                await Reply(resultTxt);
                addLimit(m.sender, isCreator);
            }
            break;

            case "cekbaper":
            case "bapercek": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let target = text || m.quoted?.pushName || (m.quoted?.sender ? `@${m.quoted.sender.split('@')[0]}` : m.pushName) || 'Kamu';
                const percent = Math.floor(Math.random() * 101);
                const comments = [
                    "Dibalas 'wkwk' aja langsung kepikiran sampai 3 purnama 😭",
                    "Hati terbuat dari kerupuk basah, rapuh banget! 💔",
                    "Gampang tersentuh, dengar lagu galau dikit langsung nangis 🥺",
                    "Cukup peka terhadap kode-kode tipis 👀",
                    "Hati sekeras batu karang, anti baper baper club! 🗿",
                    "Hati sedingin kulkas dua pintu 🧊"
                ];
                const comment = comments[Math.floor(Math.random() * comments.length)];

                const resultTxt = `\`⌜ Cek Tingkat Baper ⌟\`
> ◦ *Target :* ${target}
> ◦ *Persentase :* *${percent}%*
> ◦ *Catatan :* ${comment}`;

                await Reply(resultTxt);
                addLimit(m.sender, isCreator);
            }
            break;

            case "cekpintar":
            case "pintarcek": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let target = text || m.quoted?.pushName || (m.quoted?.sender ? `@${m.quoted.sender.split('@')[0]}` : m.pushName) || 'Kamu';
                const percent = Math.floor(Math.random() * 101);
                const comments = [
                    "Otak berkecepatan 1000 IQ, super jenius! 🚀",
                    "Pintar mencari alasan saat ditagih utang 🗿",
                    "Pintar dalam memanfaatkan situasi dan diskon 🛍️",
                    "Cerdas di bidang gosip dan stalking mantan 🕵️",
                    "Pintar standar anak sekolahan 📚",
                    "Masih dalam tahap pengembangan kecerdasan buatan ⚙️"
                ];
                const comment = comments[Math.floor(Math.random() * comments.length)];

                const resultTxt = `\`⌜ Cek Tingkat Kepintaran ⌟\`
> ◦ *Target :* ${target}
> ◦ *Persentase :* *${percent}%*
> ◦ *Catatan :* ${comment}`;

                await Reply(resultTxt);
                addLimit(m.sender, isCreator);
            }
            break;

            case "ceksange":
            case "sangecek": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let target = text || m.quoted?.pushName || (m.quoted?.sender ? `@${m.quoted.sender.split('@')[0]}` : m.pushName) || 'Kamu';
                const percent = Math.floor(Math.random() * 101);
                const comments = [
                    "Pikiran traveling sampai ke galaxy lain! 🚀🔞",
                    "Matanya suka auto fokus ke tempat terlarang 👀",
                    "Harap segera disiram air es biar adem! 🧊",
                    "Masih batas wajar anak muda 😌",
                    "Pikiran suci bersih tanpa noda 😇",
                    "Alim tiada tara, malaikat pun tersenyum 🕊️"
                ];
                const comment = comments[Math.floor(Math.random() * comments.length)];

                const resultTxt = `\`⌜ Cek Tingkat Sange ⌟\`
> ◦ *Target :* ${target}
> ◦ *Persentase :* *${percent}%*
> ◦ *Catatan :* ${comment}`;

                await Reply(resultTxt);
                addLimit(m.sender, isCreator);
            }
            break;

            case "cekjodoh":
            case "jodohcek": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let target = text || m.quoted?.pushName || 'Kamu dan Dia';
                const percent = Math.floor(Math.random() * 101);
                const comments = [
                    "Cocok banget! Tinggal nunggu restu orang tua dan gedung 💍",
                    "99% jodoh, 1% terhalang restu calon mertua 🥲",
                    "Cocok jadi teman hidup, minimal teman mengeluh bareng 🤝",
                    "Jodoh ada di tangan Tuhan, tapi kalau gak usaha ya jomblo terus 🗿",
                    "Masih ambigu, mending saling mengenal dulu daripada nyesel 🍵",
                    "Kurang cocok, mending cari yang lain daripada makan hati 💔"
                ];
                const comment = comments[Math.floor(Math.random() * comments.length)];

                const resultTxt = `\`⌜ Cek Kecocokan Jodoh ⌟\`
> ◦ *Pasangan :* ${target}
> ◦ *Kecocokan :* *${percent}%*
> ◦ *Prediksi :* ${comment}`;

                await Reply(resultTxt);
                addLimit(m.sender, isCreator);
            }
            break;

            // ==================== TOOLS TAMBAHAN ====================

            case "gempa":
            case "gempabmkg":
            case "bmkg": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/tools/gempa-bmkg?apikey=${apiKey}`);
                    const data = res.data?.result;
                    if (!data || !data.wilayah) throw new Error("Gagal mengambil data BMKG.");

                    const captionTxt = `\`⌜ BMKG Gempa Terkini ⌟\`
> ◦ *Wilayah :* ${data.wilayah}
> ◦ *Magnitude :* ${data.magnitude || '-'}
> ◦ *Kedalaman :* ${data.kedalaman || '-'}
> ◦ *Waktu :* ${data.tanggal || ''} - ${data.jam || ''}
> ◦ *Koordinat :* ${data.lintang || ''}, ${data.bujur || ''}
> ◦ *Potensi :* ${data.potensi || 'Tidak berpotensi tsunami'}`;

                    if (data.shakemap) {
                        try {
                            const imgRes = await axios.get(data.shakemap, { responseType: 'arraybuffer', timeout: 25000 });
                            await shorekeeper.sendMessage(m.chat, {
                                image: Buffer.from(imgRes.data),
                                caption: captionTxt
                            }, { quoted: m });
                        } catch (eImg) {
                            await Reply(captionTxt);
                        }
                    } else {
                        await Reply(captionTxt);
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengambil info gempa: ${e.message}`);
                }
            }
            break;

            case "kbbi": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ KBBI Online ⌟\`\n> ◦ *Format :* ${command} <kata>\n> ◦ *Contoh :* ${command} integritas`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "📖", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/tools/kbbi?apikey=${apiKey}&kata=${encodeURIComponent(text.trim())}`);
                    const data = res.data?.result;
                    if (!data || !data.arti) throw new Error(`Kata '${text.trim()}' tidak ditemukan di KBBI.`);

                    const artiList = Array.isArray(data.arti) ? data.arti.map((a, i) => `> ${i + 1}. ${a}`).join('\n') : `> ${data.arti}`;
                    const resultTxt = `\`⌜ Kamus Besar Bahasa Indonesia ⌟\`
> ◦ *Kata :* *${data.kata || text.trim()}*

${artiList}`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "qrcustom":
            case "qrcode":
            case "qr": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ QR Code Generator ⌟\`\n> ◦ *Format :* ${command} <teks> | <hex_color>\n> ◦ *Contoh 1 :* ${command} https://google.com\n> ◦ *Contoh 2 :* ${command} Halo Dunia | #00ff00`);
                }

                let [qrText, qrColor] = text.split('|').map(s => s.trim());
                qrColor = qrColor || '#000000';

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/tools/qr-custom?apikey=${apiKey}&text=${encodeURIComponent(qrText)}&color=${encodeURIComponent(qrColor)}&size=512`, {
                        responseType: 'arraybuffer',
                        timeout: 30000
                    });

                    await shorekeeper.sendMessage(m.chat, {
                        image: Buffer.from(res.data),
                        caption: `\`⌜ QR Code Generated ⌟\`\n> ◦ *Konten :* ${qrText}\n> ◦ *Warna :* ${qrColor}`
                    }, { quoted: m });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal membuat QR Code: ${e.message}`);
                }
            }
            break;

            case "tod":
            case "truth":
            case "dare": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                const reqType = command === 'truth' ? 'truth' : command === 'dare' ? 'dare' : (text && text.trim().toLowerCase() === 'dare' ? 'dare' : 'truth');

                await shorekeeper.sendMessage(m.chat, { react: { text: "🎲", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/tools/truth-or-dare?apikey=${apiKey}&type=${reqType}`);
                    const data = res.data?.result;
                    if (!data || !data.challenge) throw new Error("Gagal mengambil tantangan ToD.");

                    const resultTxt = `\`⌜ Truth or Dare ⌟\`
> ◦ *Tipe :* *${reqType.toUpperCase()}*
> ◦ *Tantangan :*
> 
> ${data.challenge}`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal: ${e.message}`);
                }
            }
            break;

            case "whatmusic":
            case "shazam": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                const q = m.quoted ? m.quoted : m;
                const mime = (q.msg || q).mimetype || '';
                if (!/audio|video/.test(mime)) {
                    return Reply(`\`⌜ WhatMusic (Shazam) ⌟\`\n> ◦ Kirim/reply cuplikan lagu (Audio/Video/VN) dengan ketik *${command}*`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "🎵", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const audioBuffer = await q.download();
                    if (!audioBuffer) throw new Error("Gagal mengunduh audio.");

                    const cdnUrl = await uploadToCDN(audioBuffer, mime || 'audio/mp3');
                    if (!cdnUrl) throw new Error("Gagal mengunggah audio ke CDN");

                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;
                    const res = await axios.get(`${baseUrl}/tools/whatmusik?apikey=${apiKey}&url=${encodeURIComponent(cdnUrl)}`, { timeout: 45000 });
                    const data = res.data?.result;
                    if (!data || !data.title) throw new Error("Musik tidak berhasil diidentifikasi.");

                    const resultTxt = `\`⌜ WhatMusic Identified ⌟\`
> ◦ *Judul :* ${data.title}
> ◦ *Artis :* ${data.artist || '-'}
> ◦ *Album :* ${data.album || '-'}
> ◦ *Genre :* ${data.genre || '-'}
> ◦ *Rilis :* ${data.release_date || '-'}`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "spamngl":
            case "ngl": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || !text.includes('|')) {
                    return Reply(`\`⌜ Spam NGL Link ⌟\`\n> ◦ *Format :* ${command} <link_ngl> | <pesan> | <jumlah>\n> ◦ *Contoh :* ${command} https://ngl.link/diezy | Halo bang | 5`);
                }

                let [nglLink, nglMsg, nglCount] = text.split('|').map(s => s.trim());
                if (!nglLink || !nglMsg) return Reply(`📌 Format salah! Contoh: ${command} https://ngl.link/user | pesan | 5`);
                let count = Math.min(20, Math.max(1, parseInt(nglCount || '3', 10)));

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/tools/spamngl?apikey=${apiKey}&link=${encodeURIComponent(nglLink)}&message=${encodeURIComponent(nglMsg)}&count=${count}`, { timeout: 35000 });
                    await Reply(`\`⌜ Spam NGL Berhasil ⌟\`\n> ◦ *Target :* ${nglLink}\n> ◦ *Pesan :* ${nglMsg}\n> ◦ *Terkirim :* ${count} pesan`);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal spam NGL: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            // ==================== STALKER COMMANDS ====================
            case "mlbbstalk":
            case "stalkml":
            case "mlstalk": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Mobile Legends Stalk ⌟\`\n> ◦ *Format :* ${command} <id> | <zone>\n> ◦ *Contoh :* ${command} 84437096 | 2163`);
                }

                let [idML, zoneML] = text.split(/[\s|]+/).map(s => s.trim());
                if (!idML || !zoneML) return Reply(`📌 Masukkan ID dan Zone! Contoh: ${command} 84437096 | 2163`);

                await shorekeeper.sendMessage(m.chat, { react: { text: "🔍", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/stalk/mlbb?apikey=${apiKey}&id=${encodeURIComponent(idML)}&zone=${encodeURIComponent(zoneML)}`);
                    const data = res.data?.result;
                    if (!data || !data.nickname) throw new Error("Akun MLBB tidak ditemukan.");

                    const resultTxt = `\`⌜ MLBB Player Info ⌟\`
> ◦ *Nickname :* *${data.nickname}*
> ◦ *User ID :* ${data.id}
> ◦ *Zone ID :* (${data.zone})
> ◦ *Game :* ${data.game || 'Mobile Legends'}
> ◦ *Status :* ${data.status || 'Verified'}`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "ffstalk":
            case "stalkff": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Free Fire Stalk ⌟\`\n> ◦ *Format :* ${command} <id_ff>\n> ◦ *Contoh :* ${command} 12345678`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "🔍", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/stalk/ff?apikey=${apiKey}&id=${encodeURIComponent(text.trim())}`);
                    const data = res.data?.result;
                    if (!data) throw new Error("Akun Free Fire tidak ditemukan.");

                    const acc = data.accountInfo || {};
                    const guild = data.guildInfo || {};
                    const pet = data.petInfo || {};

                    const resultTxt = `\`⌜ Free Fire Player Info ⌟\`
> ◦ *Nama :* *${acc['Account Name'] || '-'}*
> ◦ *UID :* ${acc['Account UID'] || text.trim()}
> ◦ *Level :* ${acc['Account Level'] || '-'} (EXP: ${acc['Account EXP'] || '-'})
> ◦ *Region :* ${acc['Account Region'] || '-'}
> ◦ *Likes :* ${acc['Account Likes'] || '-'}
> ◦ *Honor Score :* ${acc['Honor Score'] || '-'}
> ◦ *Bio :* ${acc['Signature'] || '-'}
> ◦ *Guild :* ${guild['Guild Name'] || '-'} (Lvl ${guild['Guild Level'] || '-'})
> ◦ *Pet Aktif :* ${pet['Selected Pet'] || '-'}`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "robloxstalk":
            case "stalkroblox": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Roblox Stalk ⌟\`\n> ◦ *Format :* ${command} <username>\n> ◦ *Contoh :* ${command} Roblox`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "🔍", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/stalk/roblox?apikey=${apiKey}&username=${encodeURIComponent(text.trim())}`);
                    const data = res.data?.result;
                    if (!data || !data.username) throw new Error("Akun Roblox tidak ditemukan.");

                    const captionTxt = `\`⌜ Roblox Profile Info ⌟\`
> ◦ *Username :* *${data.username}*
> ◦ *Display Name :* ${data.displayName || '-'}
> ◦ *User ID :* ${data.id || '-'}
> ◦ *Dibuat :* ${data.createdAt || '-'}
> ◦ *Verified :* ${data.hasVerifiedBadge ? 'Ya ✓' : 'Tidak'}
> ◦ *Bio :* ${data.description || 'Tidak ada deskripsi'}`;

                    if (data.avatar) {
                        try {
                            const imgRes = await axios.get(data.avatar, { responseType: 'arraybuffer', timeout: 25000 });
                            await shorekeeper.sendMessage(m.chat, { image: Buffer.from(imgRes.data), caption: captionTxt }, { quoted: m });
                        } catch (eImg) {
                            await Reply(captionTxt);
                        }
                    } else {
                        await Reply(captionTxt);
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "githubstalk":
            case "stalkgithub": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ GitHub Stalk ⌟\`\n> ◦ *Format :* ${command} <username>\n> ◦ *Contoh :* ${command} torvalds`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "🔍", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/stalk/github?apikey=${apiKey}&username=${encodeURIComponent(text.trim())}`);
                    const data = res.data?.result || res.data;
                    if (!data || !data.username) throw new Error("Akun GitHub tidak ditemukan.");

                    const captionTxt = `\`⌜ GitHub User Info ⌟\`
> ◦ *Username :* *${data.username}*
> ◦ *Nama :* ${data.nickname || '-'}
> ◦ *Bio :* ${data.bio || '-'}
> ◦ *Lokasi :* ${data.location || '-'}
> ◦ *Repo Publik :* ${data.public_repo || '0'}
> ◦ *Followers :* ${data.followers || '0'}
> ◦ *Following :* ${data.following || '0'}
> ◦ *Profil :* ${data.url || `https://github.com/${data.username}`}`;

                    if (data.profile_pic) {
                        try {
                            const imgRes = await axios.get(data.profile_pic, { responseType: 'arraybuffer', timeout: 25000 });
                            await shorekeeper.sendMessage(m.chat, { image: Buffer.from(imgRes.data), caption: captionTxt }, { quoted: m });
                        } catch (eImg) {
                            await Reply(captionTxt);
                        }
                    } else {
                        await Reply(captionTxt);
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "telegramstalk":
            case "stalktelegram":
            case "stalktg": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Telegram Stalk ⌟\`\n> ◦ *Format :* ${command} <username>\n> ◦ *Contoh :* ${command} durov`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "🔍", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/stalk/telegram?apikey=${apiKey}&username=${encodeURIComponent(text.trim().replace(/^@/, ''))}`);
                    const data = res.data?.result;
                    if (!data || !data.username) throw new Error("Akun Telegram tidak ditemukan.");

                    const captionTxt = `\`⌜ Telegram Info ⌟\`
> ◦ *Title :* *${data.title || data.username}*
> ◦ *Username :* @${data.username}
> ◦ *Member :* ${data.members || '-'}
> ◦ *Verified :* ${data.isVerified ? 'Ya ✓' : 'Tidak'}
> ◦ *Bio :* ${data.description || 'Tidak ada bio'}
> ◦ *Link :* ${data.url || `https://t.me/${data.username}`}`;

                    if (data.avatar) {
                        try {
                            const imgRes = await axios.get(data.avatar, { responseType: 'arraybuffer', timeout: 25000 });
                            await shorekeeper.sendMessage(m.chat, { image: Buffer.from(imgRes.data), caption: captionTxt }, { quoted: m });
                        } catch (eImg) {
                            await Reply(captionTxt);
                        }
                    } else {
                        await Reply(captionTxt);
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "npmstalk":
            case "stalknpm": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ NPM Package Stalk ⌟\`\n> ◦ *Format :* ${command} <nama_package>\n> ◦ *Contoh :* ${command} axios`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "🔍", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/stalk/npm?apikey=${apiKey}&name=${encodeURIComponent(text.trim())}`);
                    const data = res.data?.result;
                    if (!data || !data.name) throw new Error("Package NPM tidak ditemukan.");

                    const resultTxt = `\`⌜ NPM Package Info ⌟\`
> ◦ *Package :* *${data.name}*
> ◦ *Versi Terbaru :* ${data.versionLatest || '-'}
> ◦ *Versi Rilis Awal :* ${data.versionPublish || '-'}
> ◦ *Total Versi :* ${data.totalVersions || '1'}
> ◦ *Lisensi :* ${data.license || 'ISC'}
> ◦ *Author :* ${data.author || '-'}
> ◦ *Deskripsi :* ${data.description || '-'}
> ◦ *Dependencies :* ${data.latestDependencies || '0'}
> ◦ *Link NPM :* ${data.link || `https://npmjs.com/package/${data.name}`}`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "igstalk":
            case "stalkig": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Instagram Stalk ⌟\`\n> ◦ *Format :* ${command} <username>\n> ◦ *Contoh :* ${command} alifalfrl__`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "🔍", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/stalk/instagram?apikey=${apiKey}&username=${encodeURIComponent(text.trim().replace(/^@/, ''))}`);
                    const data = res.data?.result;
                    if (!data || !data.username) throw new Error("Akun Instagram tidak ditemukan.");

                    const captionTxt = `\`⌜ Instagram Profile Info ⌟\`
> ◦ *Username :* *${data.username}*
> ◦ *Nama Lengkap :* ${data.fullName || data.fullname || '-'}
> ◦ *Followers :* ${data.followers || '0'}
> ◦ *Following :* ${data.following || '0'}
> ◦ *Total Post :* ${data.postsCount || data.posts || '0'}
> ◦ *Bio :* ${data.bio || 'Tidak ada bio'}`;

                    if (data.photoUrlHd || data.photoUrl || data.avatar) {
                        try {
                            const imgRes = await axios.get(data.photoUrlHd || data.photoUrl || data.avatar, { responseType: 'arraybuffer', timeout: 25000 });
                            await shorekeeper.sendMessage(m.chat, { image: Buffer.from(imgRes.data), caption: captionTxt }, { quoted: m });
                        } catch (eImg) {
                            await Reply(captionTxt);
                        }
                    } else {
                        await Reply(captionTxt);
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "tiktokstalk":
            case "stalktiktok":
            case "stalktt": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ TikTok Stalk ⌟\`\n> ◦ *Format :* ${command} <username>\n> ◦ *Contoh :* ${command} tiktok`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "🔍", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/stalk/tiktok?apikey=${apiKey}&username=${encodeURIComponent(text.trim().replace(/^@/, ''))}`);
                    const data = res.data?.result;
                    if (!data || !data.username) throw new Error("Akun TikTok tidak ditemukan.");

                    const captionTxt = `\`⌜ TikTok Profile Info ⌟\`
> ◦ *Username :* *${data.username}*
> ◦ *Nickname :* ${data.nickname || '-'}
> ◦ *Followers :* ${data.followers || data.follower || '0'}
> ◦ *Following :* ${data.following || '0'}
> ◦ *Total Likes :* ${data.likes || data.heart || '0'}
> ◦ *Bio :* ${data.bio || 'Tidak ada bio'}`;

                    if (data.avatar || data.avatarLarger) {
                        try {
                            const imgRes = await axios.get(data.avatarLarger || data.avatar, { responseType: 'arraybuffer', timeout: 25000 });
                            await shorekeeper.sendMessage(m.chat, { image: Buffer.from(imgRes.data), caption: captionTxt }, { quoted: m });
                        } catch (eImg) {
                            await Reply(captionTxt);
                        }
                    } else {
                        await Reply(captionTxt);
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            // ==================== ISLAMIC COMMANDS ====================
            case "quran":
            case "alquran": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(`\`⌜ Al-Qur'an ⌟\`\n> ◦ *Format :* ${command} nomor_surah`);
                }

                let [surahNum, ayahNum] = text.trim().split(/[\s:]+/).map(s => parseInt(s, 10));
                if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
                    return Reply("❌ Nomor Surah harus antara 1 sampai 114.");
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "📖", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const ayahParam = (ayahNum && !isNaN(ayahNum)) ? `&ayah=${ayahNum}` : '';
                    const res = await axios.get(`${baseUrl}/islamic/quran?apikey=${apiKey}&surah=${surahNum}${ayahParam}`);
                    const data = res.data?.result;
                    if (!data) throw new Error("Gagal mengambil data Al-Qur'an.");

                    if (data.ayah) {
                        const surahInfo = data.surah || {};
                        const ayahInfo = data.ayah || {};
                        const resultTxt = `\`⌜ QS. ${surahInfo.name} [${surahInfo.number}:${ayahInfo.number}] ⌟\`

${ayahInfo.arabic}

*Latin :*
_${ayahInfo.latin}_

*Artinya :*
"${ayahInfo.translation}"`;

                        await Reply(resultTxt);

                        if (ayahInfo.audio) {
                            try {
                                const aRes = await axios.get(ayahInfo.audio, { responseType: 'arraybuffer', timeout: 30000 });
                                await shorekeeper.sendMessage(m.chat, {
                                    audio: Buffer.from(aRes.data),
                                    mimetype: 'audio/mp4',
                                    ptt: true
                                }, { quoted: m });
                            } catch (eAud) {}
                        }
                    } else if (data.ayat && Array.isArray(data.ayat)) {
                        const maxAyat = data.ayat.slice(0, 10);
                        let ayatList = maxAyat.map(a => `*Ayat ${a.nomorAyat}:*\n${a.teksArab}\n_${a.teksLatin}_\n"${a.teksIndonesia}"`).join('\n\n');
                        const resultTxt = `\`⌜ QS. ${data.namaLatin} (${data.nama}) ⌟\`
> ◦ *Arti :* ${data.arti}
> ◦ *Jumlah Ayat :* ${data.jumlahAyat}
> ◦ *Turun :* ${data.tempatTurun}

${ayatList}${data.ayat.length > 10 ? '\n\n> ◦ _Tampilkan ayat spesifik dengan format: quran ' + surahNum + ' <ayat>_' : ''}`;

                        await Reply(resultTxt);
                    } else {
                        throw new Error("Format surah tidak sesuai.");
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "jadwalsholat":
            case "sholat": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let city = text ? text.trim() : 'jakarta';

                await shorekeeper.sendMessage(m.chat, { react: { text: "🕌", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/islamic/jadwal-sholat?apikey=${apiKey}&kota=${encodeURIComponent(city)}`);
                    const data = res.data?.result || res.data;
                    const j = data.jadwal || {};

                    const resultTxt = `\`⌜ Jadwal Sholat: ${data.city || data.lokasi || city.toUpperCase()} ⌟\`
> ◦ *Tanggal :* ${j.tanggal || 'Hari ini'}
> 
> ◦ *Imsak :* ${j.imsak || '-'} WIB
> ◦ *Subuh :* ${j.subuh || '-'} WIB
> ◦ *Terbit :* ${j.terbit || '-'} WIB
> ◦ *Dhuha :* ${j.dhuha || '-'} WIB
> ◦ *Dzuhur :* ${j.dzuhur || '-'} WIB
> ◦ *Ashar :* ${j.ashar || '-'} WIB
> ◦ *Maghrib :* ${j.maghrib || '-'} WIB
> ◦ *Isya :* ${j.isya || '-'} WIB`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "doaharian":
            case "doa": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let query = text ? text.trim() : '';

                await shorekeeper.sendMessage(m.chat, { react: { text: "🤲", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/islamic/doa-harian?apikey=${apiKey}&q=${encodeURIComponent(query)}`);
                    const data = res.data?.result;
                    if (!data) throw new Error("Doa tidak ditemukan.");

                    let doaObj = Array.isArray(data) ? data[0] : data;
                    if (!doaObj || !doaObj.title) throw new Error("Doa tidak ditemukan.");

                    const resultTxt = `\`⌜ ${doaObj.title} ⌟\`

${doaObj.arabic || ''}

*Latin :*
_${doaObj.latin || ''}_

*Artinya :*
"${doaObj.translation || ''}"`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "asmaulhusna": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                let idx = text ? parseInt(text.trim(), 10) : '';

                await shorekeeper.sendMessage(m.chat, { react: { text: "✨", key: m.key } }).catch(() => {});
                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const paramIdx = (idx && !isNaN(idx)) ? `&index=${idx}` : '';
                    const res = await axios.get(`${baseUrl}/islamic/asmaul-husna?apikey=${apiKey}${paramIdx}`);
                    const data = res.data?.result;
                    if (!data) throw new Error("Gagal mengambil data Asmaul Husna.");

                    const resultTxt = `\`⌜ Asmaul Husna #${data.index || idx || '1'} ⌟\`

*${data.arabic || ''}*
*${data.latin || ''}*

*Artinya :*
"${data.meaning || data.translation || ''}"`;

                    await Reply(resultTxt);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            // ==================== BRAT & STICKER COMMANDS ====================
            case "s":
            case "stiker":
            case "sticker":
            case "sgif": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const isImage = /image/i.test(mime) || m.type === 'imageMessage' || (m.quoted && m.quoted.type === 'imageMessage');
                const isVideo = /video/i.test(mime) || m.type === 'videoMessage' || (m.quoted && m.quoted.type === 'videoMessage');

                if (!isImage && !isVideo) {
                    return Reply(`\`⌜ Stiker Maker ⌟\`\n> ◦ *Format :* reply foto/video dengan ${command}`);
                }

                if (isVideo) {
                    const duration = (qmsg.seconds || qmsg.duration || (quoted.msg && quoted.msg.seconds) || (m.msg && m.msg.seconds) || 0);
                    if (duration > 15) {
                        return Reply("❌ Durasi video terlalu panjang! Maksimal durasi stiker video adalah 10 detik.");
                    }
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});

                try {
                    let mediaBuffer = null;
                    if (typeof qmsg.download === 'function') {
                        mediaBuffer = await qmsg.download();
                    } else if (typeof quoted.download === 'function') {
                        mediaBuffer = await quoted.download();
                    } else if (typeof m.download === 'function') {
                        mediaBuffer = await m.download();
                    } else {
                        mediaBuffer = await shorekeeper.downloadMediaMessage(quoted || m);
                    }

                    if (!mediaBuffer || mediaBuffer.length === 0) {
                        throw new Error("Gagal mengunduh media dari pesan.");
                    }

                    await shorekeeper.sendAsSticker(m.chat, mediaBuffer, m, { packname: global.packname, author: global.namaOwner });
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('sticker maker error:', err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal membuat stiker: ${err.message}`);
                }
            }
            break;

            case "swm":
            case "wm":
            case "take":
            case "colong": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const isSticker = /webp/i.test(mime) || m.type === 'stickerMessage' || (m.quoted && m.quoted.type === 'stickerMessage');
                const isImage = /image/i.test(mime) || m.type === 'imageMessage' || (m.quoted && m.quoted.type === 'imageMessage');
                const isVideo = /video/i.test(mime) || m.type === 'videoMessage' || (m.quoted && m.quoted.type === 'videoMessage');

                if (!isSticker && !isImage && !isVideo) {
                    return Reply(`\`⌜ Stiker Watermark ⌟\`\n> ◦ *Format :* reply stiker dengan ${command} pack|author`);
                }

                if (isVideo) {
                    const duration = (qmsg.seconds || qmsg.duration || (quoted.msg && quoted.msg.seconds) || (m.msg && m.msg.seconds) || 0);
                    if (duration > 15) {
                        return Reply("❌ Durasi video terlalu panjang! Maksimal durasi stiker video adalah 10 detik.");
                    }
                }

                let pack = global.packname;
                let aut = global.namaOwner;

                if (text && text.trim().length > 0) {
                    if (text.includes('|')) {
                        const parts = text.split('|');
                        pack = parts[0].trim() || global.packname;
                        aut = parts[1].trim() || global.namaOwner;
                    } else {
                        pack = text.trim();
                        aut = text.trim();
                    }
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});

                try {
                    let mediaBuffer = null;
                    if (typeof qmsg.download === 'function') {
                        mediaBuffer = await qmsg.download();
                    } else if (typeof quoted.download === 'function') {
                        mediaBuffer = await quoted.download();
                    } else if (typeof m.download === 'function') {
                        mediaBuffer = await m.download();
                    } else {
                        mediaBuffer = await shorekeeper.downloadMediaMessage(quoted || m);
                    }

                    if (!mediaBuffer || mediaBuffer.length === 0) {
                        throw new Error("Gagal mengunduh media dari pesan.");
                    }

                    await shorekeeper.sendAsSticker(m.chat, mediaBuffer, m, { packname: pack, author: aut });
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('swm error:', err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengubah watermark stiker: ${err.message}`);
                }
            }
            break;

            case "qc":
            case "quoted":
            case "qcpink":
            case "qchitam":
            case "qcputih": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                let raw = text || m.quoted?.text || m.quoted?.conversation || m.quoted?.caption || '';
                if (!raw || raw.trim().length === 0) {
                    return Reply(`\`⌜ Quoted Chat ⌟\`\n> ◦ *Format :* ${command} teks`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});

                let bgColor = "%23292232";
                if (command === 'qcpink') bgColor = "%23ffb6c1";
                else if (command === 'qchitam') bgColor = "%23000000";
                else if (command === 'qcputih') bgColor = "%23ffffff";

                let uName = m.pushName || 'User';
                let qText = raw.trim();
                let avatarTarget = m.sender;

                if (m.quoted) {
                    uName = m.quoted.pushName || (m.quoted.sender ? m.quoted.sender.split('@')[0] : uName);
                    avatarTarget = m.quoted.sender || m.sender;
                    qText = text || m.quoted.text || m.quoted.conversation || m.quoted.caption || raw.trim();
                } else if (raw.includes('|')) {
                    const parts = raw.split('|');
                    uName = parts[0].trim() || uName;
                    qText = parts.slice(1).join('|').trim() || qText;
                }

                try {
                    let avatarUrl = '';
                    try {
                        avatarUrl = await shorekeeper.profilePictureUrl(avatarTarget, 'image');
                    } catch (e) {
                        avatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde';
                    }

                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;
                    const apiUrl = `${baseUrl}/imagecreator/quoted?apikey=${apiKey}&username=${encodeURIComponent(uName)}&profile=${encodeURIComponent(avatarUrl)}&text=${encodeURIComponent(qText)}&bg=${bgColor}`;

                    const res = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 30000 });
                    await shorekeeper.sendAsSticker(m.chat, Buffer.from(res.data), m, { packname: global.packname, author: global.namaOwner });

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    console.error('[QC ERROR]', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal membuat quoted sticker: ${e.response?.data?.error || e.message}`);
                }
            }
            break;

            case "brat": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(example("Hai kak Saya " + global.botname));
                }

                const safeText = typeof text === 'string' ? text.trim() : String(text || '').trim();
                if (safeText.length > 100) return Reply("Maksimal 100 karakter.");

                try {
                    let bratThumb = null;
                    try { bratThumb = await shorekeeper.profilePictureUrl(m.sender, 'image'); } catch (e) { bratThumb = null; }
                    if (!bratThumb) bratThumb = global.image?.menu || 'https://cdn-alip.clutch.web.id/api/u/mvnbdijm.jpg';

                    const pfx = (typeof prefix !== 'undefined' ? prefix : '.');
                    const btnBrat = new ButtonV2(shorekeeper);
                    btnBrat.setThumbnail(bratThumb)
                        .setBody(`╔─╼═[ ʙʀᴀᴛ sᴛᴜᴅɪᴏ ]═─፨፦⋆\n│ ❈ ᴛᴇᴋs    : ${safeText}\n│ ❈ sᴛᴀᴛᴜs  : Siap Diproses\n│ ❈ ᴄʀᴇᴀᴛᴏʀ : ${global.botname}\n│ ❈ ᴛᴏᴛᴀʟ   : 15 Varian Style\n╰┈┈┈┈┈┈┈┈┈⬡\n\nPilih style stiker brat yang kamu inginkan pada tombol di bawah.`)
                        .setFooter(`© ${global.botname} • Brat Generator`)
                        .addRawButton({
                            buttonText: { displayText: '𔕬 ᴘɪʟɪʜ sᴛʏʟᴇ ʙʀᴀᴛ' },
                            buttonId: 'brat_pilihan',
                            type: 1,
                            nativeFlowInfo: {
                                name: 'single_select',
                                paramsJson: JSON.stringify({
                                    title: 'Pilih Varian Style Brat',
                                    sections: [
                                        {
                                            title: '◈ Style Format Gambar',
                                            highlight_label: 'Populer',
                                            rows: [
                                                { title: 'ʙʀᴀᴛ ɢᴀᴍʙᴀʀ', id: `${pfx}bratgambar ${safeText}`, description: 'Format stiker brat standar' },
                                                { title: 'ʙʀᴀᴛ ɢᴀᴍʙᴀʀ ʜᴅ', id: `${pfx}bratgambarhd ${safeText}`, description: 'Resolusi tinggi dan lebih tajam' },
                                                { title: 'ʙʀᴀᴛ ɪᴍɢ 3', id: `${pfx}bratimg3 ${safeText}`, description: 'Varian alternatif tema warna' },
                                                { title: 'ʙʀᴀᴛ ᴘɪɴᴋ', id: `${pfx}bratpink ${safeText}`, description: 'Tema warna pink pastel' },
                                                { title: 'ʙʀᴀᴛ ᴡɪɴᴅᴏᴡs', id: `${pfx}bratwindows ${safeText}`, description: 'Tema retro Windows Media Player' },
                                                { title: 'ʙʀᴀᴛ ᴛɪᴍᴏᴛʏ', id: `${pfx}brattimoty ${safeText}`, description: 'Varian gaya tema Timoty' }
                                            ]
                                        },
                                        {
                                            title: '◈ Style Karakter & Anime',
                                            rows: [
                                                { title: 'ʙʀᴀᴛ ᴀɴɪᴍᴇ', id: `${pfx}bratanime ${safeText}`, description: 'Versi gaya anime jepang' },
                                                { title: 'ʙʀᴀᴛ ɢᴜʀᴀ', id: `${pfx}bratgura ${safeText}`, description: 'Tema karakter Gawr Gura' },
                                                { title: 'ʙʀᴀᴛ ɢᴏᴊᴏ', id: `${pfx}bratgojo ${safeText}`, description: 'Background karakter Gojo Satoru' },
                                                { title: 'ʙʀᴀᴛ ᴠᴇʀᴍᴇɪʟ', id: `${pfx}bratvermeil ${safeText}`, description: 'Background karakter Vermeil' }
                                            ]
                                        },
                                        {
                                            title: '◈ Style Video & Animasi',
                                            rows: [
                                                { title: 'ʙʀᴀᴛ ᴠɪᴅᴇᴏ', id: `${pfx}bratvid ${safeText}`, description: 'Animasi teks video bergerak' },
                                                { title: 'ʙʀᴀᴛ ᴄʟᴀssɪᴄ', id: `${pfx}bratclassic ${safeText}`, description: 'Animasi klasik bounce' },
                                                { title: 'ʙʀᴀᴛ ᴄʟᴀssɪᴄ ᴠɪᴅᴇᴏ', id: `${pfx}bratclassicvid ${safeText}`, description: 'Versi video animasi klasik' },
                                                { title: 'ʙʀᴀᴛ ɢᴏᴊᴏ ᴠɪᴅᴇᴏ', id: `${pfx}bratgojovid ${safeText}`, description: 'Background Gojo versi animasi bergerak' },
                                                { title: 'ʙʀᴀᴛ ᴠɪʀᴀʟ', id: `${pfx}bratviral ${safeText}`, description: 'Gaya viral bold zoom dan shine' }
                                            ]
                                        }
                                    ]
                                })
                            }
                        });

                    await btnBrat.send(m.chat);
                } catch (error) {
                    console.error('[BRAT ERROR]', error);
                    Reply(global.mess?.error || 'Gagal menampilkan menu brat.');
                }
            }
            break;

            case 'bratimg3':
            case 'bratgambar3': {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) {
                    return Reply(example("Biyu|black\n\nTema: white, black, green, blue, strike"));
                }

                let [teks, tema] = text.split('|');
                teks = teks?.trim();
                tema = tema?.trim()?.toLowerCase();

                let temaValid = ['white', 'black', 'green', 'blue', 'strike'];
                if (!temaValid.includes(tema)) tema = 'white';
                if (!teks) return Reply(example("halo dunia|black"));

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    let url = `https://api.nekorinn.my.id/maker/brat?text=${encodeURIComponent(teks)}&theme=${tema}`;
                    let response = await axios.get(url, { responseType: "arraybuffer", timeout: 30000 });
                    await shorekeeper.sendAsSticker(m.chat, Buffer.from(response.data), m, { packname: global.packname, author: global.namaOwner });
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    console.error('bratgambar3 error:', e);
                    try {
                        const bgMap = { white: '#ffffff', black: '#000000', green: '#8ace00', blue: '#0099ff', strike: '#ffffff' };
                        const fgMap = { white: '#000000', black: '#ffffff', green: '#000000', blue: '#ffffff', strike: '#000000' };
                        const buffer = renderBratCanvas(teks, bgMap[tema] || '#ffffff', fgMap[tema] || '#000000');
                        await shorekeeper.sendAsSticker(m.chat, buffer, m, { packname: global.packname, author: global.namaOwner });
                        addLimit(m.sender, isCreator);
                        await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                    } catch (err2) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                        Reply(global.mess?.error || `Gagal membuat brat: ${e.message}`);
                    }
                }
            }
            break;

            case "bratgambarhd":
            case "brathd": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("halo"));

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    let buffer;
                    try {
                        const encodedText = encodeURIComponent(text.trim());
                        const apiUrl = `https://api.nexray.eu.cc/maker/brathd?text=${encodedText}`;
                        const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 25000 });
                        if (response.data && response.data.length > 500) {
                            buffer = Buffer.from(response.data);
                        }
                    } catch (apiErr) {
                        buffer = null;
                    }

                    if (!buffer) {
                        buffer = renderBratHD(text.trim());
                    }

                    await shorekeeper.sendAsSticker(m.chat, buffer, m, { packname: global.packname, author: global.namaOwner });
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    console.error('brathd error:', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`Gagal membuat brat HD: ${e.message}`);
                }
            }
            break;

            case "bratgambar":
            case "bratimg": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("halo"));

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const isImage = /--(img|gambar)/i.test(text);
                    const cleanText = text.replace(/--(img|gambar)/gi, '').trim() || text;

                    let buffer = await getBratBuffer(cleanText);
                    if (!buffer) throw new Error("Gagal generate brat");

                    if (isImage) {
                        await shorekeeper.sendMessage(m.chat, { image: buffer, caption: `*Brat Generator*\n> Teks: ${cleanText}` }, { quoted: m });
                    } else {
                        await shorekeeper.sendAsSticker(m.chat, buffer, m, { packname: global.packname, author: global.namaOwner });
                    }
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    console.error('bratgambar error:', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`Gagal membuat brat: ${e.message}`);
                }
            }
            break;

            case "bratwindows":
            case "bratwindowns": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("halo"));

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const isImage = /--(img|gambar)/i.test(text);
                    const cleanText = text.replace(/--(img|gambar)/gi, '').trim() || text;
                    const apiKey = global.apikeydiezy || global.apikeyalip || "alipaiapikeybaru";
                    const baseUrl = global.apidiezy || global.apialip || "https://api-shorekeeper.clutch.ai.id";

                    let response;
                    try {
                        const url = `${baseUrl}/canvas/bratwindows?apikey=${apiKey}&text=${encodeURIComponent(cleanText)}`;
                        response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
                    } catch (apiErr) {
                        const fallbackUrl = `${baseUrl}/api/bratwindows?apikey=${apiKey}&text=${encodeURIComponent(cleanText)}`;
                        response = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 30000 });
                    }

                    const buffer = Buffer.from(response.data);
                    if (isImage) {
                        await shorekeeper.sendMessage(m.chat, { image: buffer, caption: `*Brat Windows Generator*\n> Teks: ${cleanText}` }, { quoted: m });
                    } else {
                        const tmpImage = path.join(os.tmpdir(), `bratwin-${Date.now()}.png`);
                        fs.writeFileSync(tmpImage, buffer);
                        await shorekeeper.sendAsSticker(m.chat, tmpImage, m, { packname: global.packname, author: global.namaOwner });
                        try { fs.unlinkSync(tmpImage); } catch (_) {}
                    }
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e) {
                    console.error('Bratwindows Error:', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(global.mess?.error || `Gagal membuat brat windows: ${e.message}`);
                }
            }
            break;

            case "brattimoty":
            case "brattimothy": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("halo"));

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const isImage = /--(img|gambar)/i.test(text);
                    const cleanText = text.replace(/--(img|gambar)/gi, '').trim() || text;
                    const apiKey = global.apikeydiezy || global.apikeyalip || "alipaiapikeybaru";
                    const baseUrl = global.apidiezy || global.apialip || "https://api-shorekeeper.clutch.ai.id";

                    let response;
                    try {
                        const url = `${baseUrl}/canvas/brattimoty?apikey=${apiKey}&text=${encodeURIComponent(cleanText)}`;
                        response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
                    } catch (apiErr) {
                        const fallbackUrl = `${baseUrl}/api/brattimoty?apikey=${apiKey}&text=${encodeURIComponent(cleanText)}`;
                        response = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 30000 });
                    }

                    const buffer = Buffer.from(response.data);
                    if (isImage) {
                        await shorekeeper.sendMessage(m.chat, { image: buffer, caption: `*Brat Timoty Generator*\n> Teks: ${cleanText}` }, { quoted: m });
                    } else {
                        const tmpImage = path.join(os.tmpdir(), `brattimoty-${Date.now()}.png`);
                        fs.writeFileSync(tmpImage, buffer);
                        await shorekeeper.sendAsSticker(m.chat, tmpImage, m, { packname: global.packname, author: global.namaOwner });
                        try { fs.unlinkSync(tmpImage); } catch (_) {}
                    }
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    console.error('Brattimoty Error:', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(global.mess?.error || `Gagal membuat brat timoty: ${e.message}`);
                }
            }
            break;

            case "bratvid":
            case "bratvideo": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("halo"));

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const buffer = await getBratVidBuffer(text.trim());
                    if (!buffer) throw new Error("Gagal generate brat animasi");
                    await shorekeeper.sendAsSticker(m.chat, buffer, m, { packname: global.packname, author: global.namaOwner });
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error("Bratvid error:", err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`Gagal membuat brat video: ${err.message}`);
                }
            }
            break;

            case "bratpink": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("halo"));

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const buffer = renderBratCanvas(text.trim(), '#ffb6c1', '#000000');
                    await shorekeeper.sendAsSticker(m.chat, buffer, m, { packname: global.packname, author: global.namaOwner });
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    console.error('bratpink error:', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`Gagal membuat brat pink: ${e.message}`);
                }
            }
            break;

            case "bratgura": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("halo gura"));

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const buffer = await renderBratGura(text.trim());
                    await shorekeeper.sendAsSticker(m.chat, buffer, m, { packname: global.packname, author: global.namaOwner });
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    console.error('bratgura error:', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`Gagal membuat brat gura: ${e.message}`);
                }
            }
            break;

            case "bratanime": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("halo anime"));

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const buffer = await renderBratAnime(text.trim());
                    await shorekeeper.sendAsSticker(m.chat, buffer, m, { packname: global.packname, author: global.namaOwner });
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    console.error('bratanime error:', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`Gagal membuat brat anime: ${e.message}`);
                }
            }
            break;

            case 'bratclassic':
            case 'bratclassicvid':
            case 'bratgojo':
            case 'bratgojovid':
            case 'bratvermeil':
            case 'bratviral': {
                try {
                    const bratPlugin = require('./plugins/ephoto/brat');
                    await bratPlugin(m, {
                        shorekeeper,
                        command,
                        text,
                        isRegistered: () => true,
                        isCreator,
                        isPremium: (typeof isPrem !== 'undefined' ? isPrem : false),
                        checkLimit,
                        addLimit,
                        Reply
                    });
                } catch (e) {
                    console.error('Brat plugin error:', e);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(global.mess?.error || `Gagal memproses brat: ${e.message}`);
                }
            }
            break;

            case "emojimix":
            case "mixemoji":
            case "emix": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const rawInput = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!rawInput || rawInput.trim().length === 0) {
                    return Reply(
                        `\`⌜ Contoh Penggunaan ⌟\`\n> ◦ *Format :* emojimix <emoji1>+<emoji2>\n> ◦ *Contoh :* emojimix 😎+😂\n> ◦ *Contoh 2 :* emojimix 🥺👉`
                    );
                }

                let emoji1 = null;
                let emoji2 = null;
                const trimmed = rawInput.trim();

                if (trimmed.includes('+')) {
                    const parts = trimmed.split('+').map(s => s.trim()).filter(Boolean);
                    if (parts.length >= 2) {
                        emoji1 = parts[0];
                        emoji2 = parts[1];
                    }
                } else if (trimmed.includes('|')) {
                    const parts = trimmed.split('|').map(s => s.trim()).filter(Boolean);
                    if (parts.length >= 2) {
                        emoji1 = parts[0];
                        emoji2 = parts[1];
                    }
                } else if (trimmed.includes(' ')) {
                    const parts = trimmed.split(/\s+/).map(s => s.trim()).filter(Boolean);
                    if (parts.length >= 2) {
                        emoji1 = parts[0];
                        emoji2 = parts[1];
                    }
                } else {
                    const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/gu;
                    const matches = trimmed.match(emojiRegex);
                    if (matches && matches.length >= 2) {
                        emoji1 = matches[0];
                        emoji2 = matches[1];
                    }
                }

                if (!emoji1 || !emoji2) {
                    return Reply(`❌ Masukkan minimal 2 emoji yang ingin digabungkan!\nContoh: *emojimix 😎+😂*`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/tools/emojimix?apikey=${apiKey}&emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`, {
                        responseType: 'arraybuffer',
                        timeout: 30000
                    });

                    const imgBuffer = Buffer.from(res.data);
                    if (!imgBuffer || imgBuffer.length === 0) {
                        throw new Error("Gagal membuat sticker emojimix");
                    }

                    await shorekeeper.sendAsSticker(m.chat, imgBuffer, m, { packname: global.packname, author: global.namaOwner });
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('emojimix error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal menggabungkan emoji: Kombinasi *${emoji1}* + *${emoji2}* tidak didukung oleh database emoji.`);
                }
            }
            break;

            case "emojigif":
            case "emojitogif":
            case "egif": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const rawInput = text || m.quoted?.text || m.quoted?.conversation || '';
                if (!rawInput || rawInput.trim().length === 0) {
                    return Reply(
                        `\`⌜ Contoh Penggunaan ⌟\`\n> ◦ *Format :* emojigif <emoji>\n> ◦ *Contoh :* emojigif 😂\n> ◦ *Contoh 2 :* emojigif ❤️`
                    );
                }

                const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/gu;
                const matches = rawInput.match(emojiRegex);
                const targetEmoji = (matches && matches.length > 0) ? matches[0] : rawInput.trim();

                if (!targetEmoji) {
                    return Reply(`❌ Masukkan emoji yang ingin diubah menjadi stiker animasi!\nContoh: *emojigif 😂*`);
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                const baseUrl = global.apiClutch;
                const apiKey = global.Apikeyclutch;

                try {
                    const res = await axios.get(`${baseUrl}/tools/emojigif?apikey=${apiKey}&emoji=${encodeURIComponent(targetEmoji)}`, {
                        responseType: 'arraybuffer',
                        timeout: 30000
                    });

                    const webpBuffer = Buffer.from(res.data);
                    if (!webpBuffer || webpBuffer.length === 0) {
                        throw new Error("Gagal mengambil stiker animasi emoji");
                    }

                    await shorekeeper.sendAsSticker(m.chat, webpBuffer, m, { packname: global.packname, author: global.namaOwner });
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('emojigif error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal membuat animasi emoji: Emoji *${targetEmoji}* tidak tersedia dalam format animasi Google Noto.`);
                }
            }
            break;

            case "playtiktok":
            case "tiktokplay":
            case "playtt":
            case "ttplay":
            case "ptv":
            case "ptvtiktok":
            case "tiktokptv": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                if (!text || text.trim().length === 0) {
                    return Reply(example("jj elistis"));
                }

                const isPTVMode = command === 'ptv' || command === 'ptvtiktok' || command === 'tiktokptv';
                const query = text.trim();
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const baseUrl = global.apiClutch;
                    const apiKey = global.Apikeyclutch;

                    // 1. Cari video teratas lewat API TikTok Search
                    const searchUrl = `${baseUrl}/search/tiktok?apikey=${apiKey}&q=${encodeURIComponent(query)}`;
                    const searchRes = await axios.get(searchUrl, { timeout: 25000 });
                    const topVideo = searchRes.data?.result?.[0];

                    if (!searchRes.data?.status || !topVideo || !topVideo.url) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return Reply(`❌ Tidak ditemukan video TikTok untuk query "${query}".`);
                    }

                    // 2. Ambil data video / download URL lewat API TikTok Downloader
                    let dlData = null;
                    try {
                        const dlUrl = `${baseUrl}/download/tiktok?apikey=${apiKey}&url=${encodeURIComponent(topVideo.url)}`;
                        const dlRes = await axios.get(dlUrl, { timeout: 25000 });
                        if (dlRes.data?.status && dlRes.data?.result) {
                            dlData = dlRes.data.result;
                        }
                    } catch (dlErr) {
                        console.error('playtiktok dl API error, mencoba TikWM:', dlErr?.message);
                    }

                    // Fallback ke TikWM API jika download API diezy gagal
                    if (!dlData || !dlData.data) {
                        try {
                            const tikwmRes = await axios.post("https://www.tikwm.com/api/", {}, {
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                                },
                                params: { url: topVideo.url, count: 12, cursor: 0, web: 1, hd: 1 },
                                timeout: 20000
                            });
                            const d = tikwmRes.data?.data;
                            if (d) {
                                let dataItems = [];
                                if (d.duration == 0 && Array.isArray(d.images)) {
                                    dataItems = d.images.map(img => ({ type: "photo", url: img }));
                                } else {
                                    if (d.hdplay) dataItems.push({ type: "nowatermark_hd", url: "https://www.tikwm.com" + d.hdplay });
                                    if (d.play) dataItems.push({ type: "nowatermark", url: "https://www.tikwm.com" + d.play });
                                    if (d.wmplay) dataItems.push({ type: "watermark", url: "https://www.tikwm.com" + d.wmplay });
                                }
                                dlData = {
                                    title: d.title || topVideo.title,
                                    durations: d.duration,
                                    duration: `${d.duration} Seconds`,
                                    data: dataItems,
                                    stats: {
                                        views: d.play_count,
                                        likes: d.digg_count,
                                        comment: d.comment_count,
                                        share: d.share_count
                                    },
                                    author: {
                                        nickname: d.author?.nickname,
                                        fullname: d.author?.unique_id
                                    }
                                };
                            }
                        } catch (e2) {}
                    }

                    const title = dlData?.title || topVideo.title || query;
                    const authorName = dlData?.author?.nickname || topVideo.author?.nickname || '-';
                    const authorUser = dlData?.author?.fullname || topVideo.author?.unique_id || '-';
                    const views = dlData?.stats?.views || topVideo.stats?.views || '-';
                    const likes = dlData?.stats?.likes || topVideo.stats?.likes || '-';
                    const comments = dlData?.stats?.comment || topVideo.stats?.comment || '-';
                    const shares = dlData?.stats?.share || topVideo.stats?.share || '-';
                    const duration = dlData?.durations || topVideo.duration ? `${dlData?.durations || topVideo.duration} detik` : '-';

                    const captionText = `\`⌜ Play TikTok ⌟\`
> ◦ *Judul :* ${title}
> ◦ *Author :* ${authorName} (@${authorUser})
> ◦ *Durasi :* ${duration}
> ◦ *Views :* ${typeof views === 'number' ? Number(views).toLocaleString('id-ID') : views}
> ◦ *Likes :* ${typeof likes === 'number' ? Number(likes).toLocaleString('id-ID') : likes}
> ◦ *Komentar :* ${typeof comments === 'number' ? Number(comments).toLocaleString('id-ID') : comments}
> ◦ *Share :* ${typeof shares === 'number' ? Number(shares).toLocaleString('id-ID') : shares}`;

                    const isPhotoSlide = dlData?.durations === 0 || dlData?.duration === "0 Seconds" || dlData?.data?.some(e => e.type === 'photo');

                    if (isPhotoSlide && dlData?.data) {
                        const photos = dlData.data.filter(e => e.type === 'photo' || e.url);
                        if (photos.length > 1) {
                            const albumItems = photos.map((p, idx) => ({
                                image: { url: p.url },
                                ...(idx === 0 ? { caption: captionText } : {})
                            }));
                            await shorekeeper.sendMessage(m.chat, {
                                albumMessage: albumItems
                            }, { quoted: m });
                        } else if (photos.length === 1) {
                            await shorekeeper.sendMessage(m.chat, {
                                image: { url: photos[0].url },
                                caption: captionText
                            }, { quoted: m });
                        }
                    } else {
                        const videoObj = dlData?.data?.find(e => e.type === "nowatermark_hd") || 
                                         dlData?.data?.find(e => e.type === "nowatermark") || 
                                         dlData?.data?.find(e => e.type === "watermark") || 
                                         dlData?.data?.[0];
                        const videoUrl = videoObj?.url || topVideo.play;

                        if (videoUrl) {
                            // Coba unduh buffer video terlebih dahulu untuk bypass Cloudflare
                            let videoBuf = null;
                            try {
                                const vRes = await axios.get(videoUrl, {
                                    responseType: 'arraybuffer',
                                    timeout: 30000,
                                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                                });
                                if (vRes.data && vRes.data.length > 10000) {
                                    videoBuf = Buffer.from(vRes.data);
                                }
                            } catch (vErr) {}

                            if (isPTVMode) {
                                await shorekeeper.sendMessage(m.chat, {
                                    video: videoBuf ? videoBuf : { url: videoUrl },
                                    ptv: true,
                                    mimetype: 'video/mp4'
                                }, { quoted: m });
                            } else {
                                await shorekeeper.sendMessage(m.chat, {
                                    video: videoBuf ? videoBuf : { url: videoUrl },
                                    caption: captionText
                                }, { quoted: m });
                            }
                        } else {
                            await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                            return Reply("❌ Gagal mengunduh video TikTok.");
                        }
                    }

                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (err) {
                    console.error('playtiktok error:', err?.message || err);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Terjadi kesalahan saat memutar TikTok: ${err?.message}`);
                }
            }
            break;

            // ==================== PRIMBON FEATURES (https://primbon.com) ====================
            case "artinama": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("Alif"));

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔮', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await primbon.artiNama(text.trim());
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    if (result.card) {
                        return await shorekeeper.sendMessage(m.chat, { image: result.card, caption: result.text }, { quoted: m });
                    } else {
                        return Reply(result.text || result);
                    }
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal mengambil arti nama: ${e.message}`);
                }
            }
            break;

            case "artimimpi":
            case "tafsirmimpi": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("Ular"));

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔮', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await primbon.artiMimpi(text.trim());
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    if (result.card) {
                        return await shorekeeper.sendMessage(m.chat, { image: result.card, caption: result.text }, { quoted: m });
                    } else {
                        return Reply(result.text || result);
                    }
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal mengambil tafsir mimpi: ${e.message}`);
                }
            }
            break;

            case "simbolmimpi":
            case "kodealam": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("ular"));

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔮', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await primbon.simbolMimpi(text.trim());
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    if (result.card) {
                        return await shorekeeper.sendMessage(m.chat, { image: result.card, caption: result.text }, { quoted: m });
                    } else {
                        return Reply(result.text || result);
                    }
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal mengambil simbol mimpi: ${e.message}`);
                }
            }
            break;

            case "jodohnama":
            case "kecocokannama": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || !text.includes('|')) return Reply(example("Alif | Siti"));

                const parts = text.split('|').map(s => s.trim());
                if (parts.length < 2 || !parts[0] || !parts[1]) return Reply(example("Alif | Siti"));

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔮', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await primbon.kecocokanNama(parts[0], parts[1]);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    if (result.card) {
                        return await shorekeeper.sendMessage(m.chat, { image: result.card, caption: result.text }, { quoted: m });
                    } else {
                        return Reply(result.text || result);
                    }
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal meramal kecocokan nama: ${e.message}`);
                }
            }
            break;

            case "ramalanjodoh": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || !text.includes('|')) {
                    return Reply(
                        `\`⌜ Format Ramalan Jodoh ⌟\`\n> ◦ *Format :* ramalanjodoh nama1 | tgl1-bln1-thn1 | nama2 | tgl2-bln2-thn2\n> ◦ *Contoh :* ramalanjodoh Alif | 12-05-2000 | Siti | 15-08-2002`
                    );
                }

                const parts = text.split('|').map(s => s.trim());
                if (parts.length < 4) {
                    return Reply(
                        `\`⌜ Format Ramalan Jodoh ⌟\`\n> ◦ *Format :* ramalanjodoh nama1 | tgl1-bln1-thn1 | nama2 | tgl2-bln2-thn2\n> ◦ *Contoh :* ramalanjodoh Alif | 12-05-2000 | Siti | 15-08-2002`
                    );
                }

                const nama1 = parts[0];
                const date1 = parts[1].split(/[-/.]/);
                const nama2 = parts[2];
                const date2 = parts[3].split(/[-/.]/);

                if (date1.length < 3 || date2.length < 3) {
                    return Reply(
                        `\`⌜ Format Ramalan Jodoh ⌟\`\n> ◦ *Format :* ramalanjodoh nama1 | tgl1-bln1-thn1 | nama2 | tgl2-bln2-thn2\n> ◦ *Contoh :* ramalanjodoh Alif | 12-05-2000 | Siti | 15-08-2002`
                    );
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔮', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await primbon.ramalanJodoh(nama1, Number(date1[0]), Number(date1[1]), Number(date1[2]), nama2, Number(date2[0]), Number(date2[1]), Number(date2[2]));
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    if (result.card) {
                        return await shorekeeper.sendMessage(m.chat, { image: result.card, caption: result.text }, { quoted: m });
                    } else {
                        return Reply(result.text || result);
                    }
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal mengambil ramalan jodoh: ${e.message}`);
                }
            }
            break;

            case "weton":
            case "wetonjawa": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("12-05-2002"));

                const parts = text.trim().split(/[-/.\s]+/);
                if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
                    return Reply(
                        `\`⌜ Format Cek Weton ⌟\`\n> ◦ *Format :* weton <tgl>-<bln>-<thn>\n> ◦ *Contoh :* weton 12-05-2002`
                    );
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔮', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await primbon.wetonJawa(Number(parts[0]), Number(parts[1]), Number(parts[2]));
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    if (result.card) {
                        return await shorekeeper.sendMessage(m.chat, { image: result.card, caption: result.text }, { quoted: m });
                    } else {
                        return Reply(result.text || result);
                    }
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal menghitung weton: ${e.message}`);
                }
            }
            break;

            case "haribaik":
            case "petunghari": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("12-05-2002"));

                const parts = text.trim().split(/[-/.\s]+/);
                if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
                    return Reply(
                        `\`⌜ Format Petung Hari Baik ⌟\`\n> ◦ *Format :* haribaik <tgl>-<bln>-<thn>\n> ◦ *Contoh :* haribaik 12-05-2002`
                    );
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔮', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await primbon.hariBaik(Number(parts[0]), Number(parts[1]), Number(parts[2]));
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    if (result.card) {
                        return await shorekeeper.sendMessage(m.chat, { image: result.card, caption: result.text }, { quoted: m });
                    } else {
                        return Reply(result.text || result);
                    }
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal mengambil petung hari baik: ${e.message}`);
                }
            }
            break;

            case "rejeki":
            case "rejekiweton":
            case "hoki": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("12-05-2002"));

                const parts = text.trim().split(/[-/.\s]+/);
                if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
                    return Reply(
                        `\`⌜ Format Ramalan Rejeki ⌟\`\n> ◦ *Format :* rejeki <tgl>-<bln>-<thn>\n> ◦ *Contoh :* rejeki 12-05-2002`
                    );
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔮', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await primbon.rejekiWeton(Number(parts[0]), Number(parts[1]), Number(parts[2]));
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    if (result.card) {
                        return await shorekeeper.sendMessage(m.chat, { image: result.card, caption: result.text }, { quoted: m });
                    } else {
                        return Reply(result.text || result);
                    }
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal mengambil ramalan rejeki: ${e.message}`);
                }
            }
            break;

            case "zodiak":
            case "ramalanzodiak": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("aries / taurus / gemini / cancer / leo / virgo / libra / scorpio / sagittarius / capricorn / aquarius / pisces"));

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔮', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await primbon.ramalanZodiak(text.trim());
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    if (result.card) {
                        return await shorekeeper.sendMessage(m.chat, { image: result.card, caption: result.text }, { quoted: m });
                    } else {
                        return Reply(result.text || result);
                    }
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal mengambil ramalan zodiak: ${e.message}`);
                }
            }
            break;

            case "shio":
            case "ramalanshio": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("2000"));

                const year = text.trim().replace(/[^0-9]/g, '');
                if (!year || isNaN(year)) return Reply(example("2000"));

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔮', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await primbon.ramalanShio(year);
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    if (result.card) {
                        return await shorekeeper.sendMessage(m.chat, { image: result.card, caption: result.text }, { quoted: m });
                    } else {
                        return Reply(result.text || result);
                    }
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal mengambil ramalan shio: ${e.message}`);
                }
            }
            break;

            case "angkatakdir":
            case "lifenumber":
            case "nomortakdir": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);
                if (!text || text.trim().length === 0) return Reply(example("12-05-2000"));

                const parts = text.trim().split(/[-/.\s]+/);
                if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
                    return Reply(example("12-05-2000"));
                }

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔮', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await primbon.angkaTakdir(Number(parts[0]), Number(parts[1]), Number(parts[2]));
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    if (result.card) {
                        return await shorekeeper.sendMessage(m.chat, { image: result.card, caption: result.text }, { quoted: m });
                    } else {
                        return Reply(result.text || result);
                    }
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal menghitung angka takdir: ${e.message}`);
                }
            }
            break;

            case "tarot":
            case "kartutarot": {
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                await shorekeeper.sendMessage(m.chat, { react: { text: '🔮', key: m.key } }).catch(() => {});
                Reply(global.mess.wait);

                try {
                    const result = await primbon.tarotReading();
                    addLimit(m.sender, isCreator);
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    if (result.card) {
                        return await shorekeeper.sendMessage(m.chat, { image: result.card, caption: result.text }, { quoted: m });
                    } else {
                        return Reply(result.text || result);
                    }
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return Reply(`❌ Gagal membaca kartu tarot: ${e.message}`);
                }
            }
            break;

            case "totalfitur":
            case "totalfiturs":
            case "totalcommand":
            case "totalcase": {
                const totalFitur = validCommandsList.length || 0;
                await shorekeeper.sendMessage(m.chat, { react: { text: '📊', key: m.key } }).catch(() => {});
                return Reply(`\`⌜ Total Fitur Bot ⌟\`
> ◦ *Bot Name :* ${global.botname || 'Hitoshi MD V1'}
> ◦ *Versi :* ${global.versi || '1.0.0'}
> ◦ *Total Fitur :* *${totalFitur} Fitur*
> ◦ *Status :* 🟢 *Aktif & Siap Digunakan*`);
            }
            break;

            // ==================== LIMIT & USER MANAGEMENT ====================
            case "limit":
            case "ceklimit": {
                const targetJid = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : m.sender);
                const isTargetOwner = isCreator || targetJid === botNumber || targetJid === global.owner + '@s.whatsapp.net';
                const info = getUserLimitInfo(targetJid, isTargetOwner);

                if (info.isOwner) {
                    return Reply(`\`⌜ Info Limit User ⌟\`
> ◦ *User :* @${targetJid.split('@')[0]}
> ◦ *Status :* *Owner*
> ◦ *Limit :* *∞ Unlimited*
> ◦ *Progress :* [${info.progressBar}]`, [targetJid]);
                }

                return Reply(`\`⌜ Info Limit User ⌟\`
> ◦ *User :* @${targetJid.split('@')[0]}
> ◦ *Status :* *User*
> ◦ *Limit Terpakai :* *${info.userUsage} / ${info.maxLimit}*
> ◦ *Sisa Limit :* *${info.remaining}*
> ◦ *Progress :* [${info.progressBar}]
> ◦ *Claim Hari Ini :* *${info.claimStatus}*

💡 *Catatan:*
> ◦ Limit di-reset setiap jam 00:00 WIB
> ◦ Ketik *claim* untuk mendapatkan bonus +5 limit gratis hari ini`, [targetJid]);
            }
            break;

            case "claim": {
                if (isCreator) {
                    return Reply("❌ Owner bot memiliki akses *Unlimited Limit*, tidak perlu claim.");
                }

                const res = claimLimit(m.sender);
                if (res.success) {
                    return Reply(`🎉 *Claim Berhasil!* \n> ◦ ${res.message}\n> ◦ Ketik *limit* untuk memeriksa sisa kuotamu.`);
                } else {
                    return Reply(`⚠️ *Claim Gagal*\n> ◦ ${res.message}`);
                }
            }
            break;

            case "addlimit": {
                if (!isCreator) return Reply(global.mess.owner);

                let target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null);
                let amount = parseInt(args.find(arg => !arg.includes('@')));

                if (!target && args[0] && !isNaN(parseInt(args[0]))) {
                    amount = parseInt(args[0]);
                    target = m.sender;
                } else if (!target && args[0]) {
                    target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                }

                if (!target || isNaN(amount) || amount <= 0) {
                    return Reply(`📌 *Contoh Penggunaan:*\n> ◦ addlimit @user 20\n> ◦ addlimit 628123456789 20`);
                }

                addBonusLimit(target, amount);
                return Reply(`\`⌜ Bonus Limit Ditambahkan ⌟\`\n> ◦ *Target :* @${target.split('@')[0]}\n> ◦ *Jumlah :* +${amount} Limit\n> ◦ *Info :* Bonus limit berlaku untuk hari ini`, [target]);
            }
            break;

            case "setlimit": {
                if (!isCreator) return Reply(global.mess.owner);

                let target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null);
                let amount = parseInt(args.find(arg => !arg.includes('@')));

                if (!target && args[0] && !args[0].includes('@') && args[1]) {
                    target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                    amount = parseInt(args[1]);
                }

                if (!target || isNaN(amount)) {
                    return Reply(`📌 *Contoh Penggunaan:*\n> ◦ setlimit @user 50 (mengatur limit kustom permanen)\n> ◦ setlimit @user 0 (menghapus limit kustom & kembali ke default)`);
                }

                setUserCustomLimit(target, amount);
                if (amount > 0) {
                    return Reply(`\`⌜ Limit Kustom Diatur ⌟\`\n> ◦ *Target :* @${target.split('@')[0]}\n> ◦ *Limit Harian :* ${amount} limit/hari\n> ◦ *Status :* Disimpan Permanen`, [target]);
                } else {
                    return Reply(`\`⌜ Limit Kustom Dihapus ⌟\`\n> ◦ *Target :* @${target.split('@')[0]}\n> ◦ *Status :* Kembali ke limit default`, [target]);
                }
            }
            break;

            case "setlimitharian":
            case "setlimitdefault": {
                if (!isCreator) return Reply(global.mess.owner);

                const amount = parseInt(text);
                if (!text || isNaN(amount) || amount < 1) {
                    const currentConfig = getLimitConfig();
                    return Reply(`\`⌜ Set Limit Harian Default ⌟\`
> ◦ *Limit Default Saat Ini :* ${currentConfig.defaultLimit || 25} limit/hari
> ◦ *Cara Penggunaan:* setlimitharian <jumlah>
> ◦ *Contoh:* setlimitharian 30`);
                }

                const updatedLimit = setDefaultDailyLimit(amount);
                return Reply(`\`⌜ Limit Harian Diubah ⌟\`\n> ◦ *Limit Default Baru :* ${updatedLimit} limit/hari\n> ◦ *Status :* Berlaku permanen untuk semua pengguna`);
            }
            break;

            case "dellimit": {
                if (!isCreator) return Reply(global.mess.owner);

                let target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null) || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
                if (!target) return Reply(`📌 *Contoh Penggunaan:*\n> ◦ dellimit @user`);

                setUserCustomLimit(target, 0);
                return Reply(`\`⌜ Limit Kustom Dihapus ⌟\`\n> ◦ *Target :* @${target.split('@')[0]}\n> ◦ *Status :* Kembali ke limit default`, [target]);
            }
            break;

            case "resetlimitall": {
                if (!isCreator) return Reply(global.mess.owner);
                resetAllLimitUsage();
                return Reply(`\`⌜ Reset Limit Harian ⌟\`\n> ◦ *Status :* Berhasil\n> ◦ *Info :* Penggunaan limit seluruh user hari ini telah di-reset ke 0.`);
            }
            break;

            // ==================== PREMIUM USER MANAGEMENT ====================
            case "addprem":
            case "tambahprem": {
                if (!isCreator) return Reply(global.mess.owner);

                let target = null;
                let days = 30;

                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    target = m.mentionedJid[0];
                    const rawDays = args.find(a => !a.includes('@') && /^\d+$/.test(a));
                    if (rawDays) days = parseInt(rawDays, 10);
                } else if (m.quoted && m.quoted.sender) {
                    target = m.quoted.sender;
                    const rawDays = args[0] && /^\d+$/.test(args[0]) ? args[0] : '30';
                    days = parseInt(rawDays, 10);
                } else if (args[0]) {
                    const rawNum = args[0].replace(/[^0-9]/g, '');
                    if (rawNum.length >= 6) {
                        target = rawNum + '@s.whatsapp.net';
                        if (args[1] && /^\d+$/.test(args[1])) {
                            days = parseInt(args[1], 10);
                        }
                    }
                }

                if (!target) {
                    return Reply(`\`⌜ Tambah User Premium ⌟\`\n> ◦ *Format :* ${command} <nomor/tag> <hari>\n> ◦ *Contoh 1 :* ${command} 6281249703469 30\n> ◦ *Contoh 2 :* ${command} @user 30\n> ◦ *Contoh 3 :* reply chat user dengan ketik ${command} 30`);
                }

                const result = addPremiumUser(target, days);
                if (!result) return Reply("❌ Gagal menambahkan user premium.");

                const targetPhone = target.split('@')[0];
                return Reply(
                    `\`⌜ Sukses Tambah Premium ⌟\`\n> ◦ *User :* @${targetPhone}\n> ◦ *Durasi :* ${days} Hari\n> ◦ *Masa Aktif :* ${formatRemainingTime(result.expired)}\n> ◦ *Status :* Akses fitur VIP aktif ✓`,
                    [target]
                );
            }
            break;

            case "delprem":
            case "hapusprem": {
                if (!isCreator) return Reply(global.mess.owner);

                let target = null;
                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    target = m.mentionedJid[0];
                } else if (m.quoted && m.quoted.sender) {
                    target = m.quoted.sender;
                } else if (args[0]) {
                    const rawNum = args[0].replace(/[^0-9]/g, '');
                    if (rawNum.length >= 6) target = rawNum + '@s.whatsapp.net';
                }

                if (!target) {
                    return Reply(`\`⌜ Hapus User Premium ⌟\`\n> ◦ *Format :* ${command} <nomor/tag>\n> ◦ *Contoh :* ${command} 6281249703469\n> ◦ *Contoh 2 :* ${command} @user`);
                }

                const removed = delPremiumUser(target);
                const targetPhone = target.split('@')[0];
                if (!removed) {
                    return Reply(`⚠️ User @${targetPhone} tidak terdaftar di daftar premium.`, [target]);
                }

                return Reply(`\`⌜ Sukses Hapus Premium ⌟\`\n> ◦ *User :* @${targetPhone}\n> ◦ *Status :* Status VIP dicabut`, [target]);
            }
            break;

            case "listprem":
            case "premlist": {
                if (!isCreator) return Reply(global.mess.owner);

                const list = getPremiumList();
                if (list.length === 0) {
                    return Reply(`\`⌜ Daftar User Premium ⌟\`\n> ◦ Belum ada pengguna premium terdaftar.`);
                }

                let listTxt = list.map((u, i) => `> *${i + 1}.* @${u.id}\n> ◦ *Sisa Waktu :* ${u.remaining}`).join('\n\n');
                const mentions = list.map(u => u.id + '@s.whatsapp.net');

                return Reply(`\`⌜ Daftar User Premium (${list.length}) ⌟\`\n\n${listTxt}`, mentions);
            }
            break;

            // ==================== ALIGHT MOTION PREMIUM ====================
            case "amprem":
            case "verif":
            case "amverif": {
                const safeReply = async (teks, mentions = [m.sender]) => {
                    try {
                        const res = await Reply(teks, mentions);
                        if (res && res.key) return res;
                    } catch (e) {}
                    return await shorekeeper.sendMessage(m.chat, { text: teks, contextInfo: { mentionedJid: mentions } }, { quoted: m }).catch(() => {});
                };

                const isResellerUser = checkResellerAccess(m.sender, isCreator);
                if (!isCreator && !isResellerUser && !isPrem) {
                    return await safeReply(
`\`⌜ ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ ⌟\`
> ◦ ᴀᴋsᴇs : *Khusus Reseller / Premium*
> ◦ ᴘᴇsᴀɴ : *Fitur Alight Motion Premium ini khusus untuk Reseller, Premium & Owner!*
> ◦ ɪɴғᴏ : *Silakan hubungi Owner untuk mendaftar sebagai Reseller.*`
                    );
                }

                if (checkLimit(m.sender, isPrem, isCreator)) {
                    return await safeReply(global.mess?.limit || '❌ Limit harian kamu habis!');
                }

                const cleanInput = (text || '').trim();

                if (!cleanInput) {
                    return await safeReply(
`\`⌜ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ᴘʀᴇᴍɪᴜᴍ ⌟\`
> ◦ ᴄʀᴇᴀᴛᴏʀ : *Kureza*
> ◦ ᴀᴋsᴇs : *Reseller / Premium / Owner*

\`⌜ ᴄᴀʀᴀ ᴘᴇɴɢɢᴜɴᴀᴀɴ ⌟\`
> ◦ *Langkah 1 (Kirim Link):*
> ◦ ➢ *${prefix}amprem <email_target>*
> ◦ ➢ Contoh: *${prefix}amprem user@gmail.com*

> ◦ *Langkah 2 (Aktivasi Pro):*
> ◦ ➢ *${prefix}amprem verif|<link_dari_email>*
> ◦ ➢ Atau: *${prefix}verif <link_dari_email>*
> ◦ ➢ Atau: *${prefix}amprem verif|<email>|<link>*
> ◦ ➢ Atau kirim link langsung ke chat (Auto Verif)

> ◦ *Bulk Account Generator:*
> ◦ ➢ *${prefix}amprem bulk <jumlah>* atau *${prefix}bulkam <jumlah>*`
                    );
                }

                global.ampremSessions = global.ampremSessions || {};
                const apiKey = global.apikeydiezy || global.apikeyalip || "alipaiapikeybaru";
                const baseUrl = (global.apidiezy || "https://api-shorekeeper.clutch.ai.id").replace(/\/$/, "");

                // 1. CEK JIKA USER MENGGUNAKAN FITUR BULK
                if (cleanInput.toLowerCase().startsWith("bulk")) {
                    const countArg = cleanInput.replace(/^bulk\s*/i, '').trim();
                    let count = 5;
                    if (countArg && !isNaN(parseInt(countArg, 10))) {
                        count = Math.max(1, Math.min(parseInt(countArg, 10), 25));
                    }

                    await safeReply(global.mess?.wait || '⏳ Sedang memproses bulk akun Alight Motion...');
                    await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});

                    try {
                        const apiUrl = `${baseUrl}/apkprem/alightmotion/bulk?apikey=${encodeURIComponent(apiKey)}&count=${count}`;
                        const res = await axios.get(apiUrl, { timeout: 180000 });
                        const data = res.data;

                        if (!data || data.status !== true || !Array.isArray(data.results)) {
                            await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                            return await safeReply(`\`⌜ ʙᴜʟᴋ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ⌟\`\n> ◦ ɢᴀɢᴀʟ : *${data?.error || 'Gagal menghasilkan akun massal Alight Motion.'}*`);
                        }

                        const successList = data.results.filter(r => r.status);
                        if (successList.length === 0) {
                            await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                            return await safeReply(`\`⌜ ʙᴜʟᴋ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ⌟\`\n> ◦ ɢᴀɢᴀʟ : *Semua pembuatan akun gagal, silakan coba sesaat lagi.*`);
                        }

                        let fileText = `==================================================\n` +
                                       `           ALIGHT MOTION PRO (BULK)\n` +
                                       `               Creator: Kureza\n` +
                                       `==================================================\n` +
                                       `Total Akun  : ${successList.length} Akun\n` +
                                       `Waktu Buat  : ${new Date().toLocaleString('id-ID')}\n` +
                                       `Plan        : Alight Motion VIP Pro (1 Tahun)\n` +
                                       `Status      : AKTIF / PRO BERHASIL\n` +
                                       `==================================================\n\n`;

                        successList.forEach((acc, i) => {
                            fileText += `[AKUN ${i + 1}]\n` +
                                        `Email       : ${acc.email}\n` +
                                        `Inbox Login : ${acc.inbox}\n` +
                                        `Masa Aktif  : 1 Tahun\n` +
                                        `Status      : PRO ACTIVE\n` +
                                        `--------------------------------------------------\n\n`;
                        });

                        fileText += `==================================================\n` +
                                    `PANDUAN LOGIN ALIGHT MOTION:\n` +
                                    `1. Buka aplikasi Alight Motion di HP / Tablet.\n` +
                                    `2. Pilih tombol Masuk / Sign In dengan Email.\n` +
                                    `3. Masukkan salah satu email di atas.\n` +
                                    `4. Buka link Inbox Login di browser.\n` +
                                    `5. Klik link konfirmasi/magic link dari Alight Creative.\n` +
                                    `6. Akun langsung otomatis login & menjadi Pro!\n` +
                                    `==================================================\n`;

                        const caption = `\`⌜ ʙᴜʟᴋ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ⌟\`\n` +
                                        `> ◦ ᴄʀᴇᴀᴛᴏʀ : *Kureza*\n` +
                                        `> ◦ sᴛᴀᴛᴜs : *✅ Berhasil (${successList.length}/${data.totalRequested || count})*\n` +
                                        `> ◦ ᴘʟᴀɴ : *Alight Motion Pro 1 Tahun*\n` +
                                        `> ◦ ᴛɪᴘᴇ : *File Dokumen (.txt)*\n\n` +
                                        `\`⌜ ᴅᴀғᴛᴀʀ sɪɴɢᴋᴀᴛ ⌟\`\n` +
                                        successList.slice(0, 5).map((a, i) => `> ◦ *Akun ${i + 1}:* ${a.email}`).join('\n') +
                                        (successList.length > 5 ? `\n> ◦ ... dan ${successList.length - 5} akun lainnya di dalam file .txt` : '') +
                                        `\n\n> 📄 Seluruh email & link inbox telah disimpan lengkap di dalam file .txt di atas!`;

                        await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                        addLimit(m.sender, isPrem, isCreator);

                        return await shorekeeper.sendMessage(m.chat, {
                            document: Buffer.from(fileText, 'utf-8'),
                            fileName: `AlightMotion_Bulk_${successList.length}_Akun.txt`,
                            mimetype: 'text/plain',
                            caption: caption
                        }, { quoted: m });
                    } catch (e) {
                        console.error('[BULKAM ERROR]', e.message);
                        await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                        return await safeReply(`\`⌜ ʙᴜʟᴋ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ⌟\`\n> ◦ ɢᴀɢᴀʟ : *${e.response?.data?.error || e.message || global.mess?.error || 'Terjadi kesalahan sistem'}*`);
                    }
                }

                // 2. CEK JIKA INPUT ADALAH VERIFIKASI LINK
                const isVerifCmd = command === 'verif' || command === 'amverif' || /^verif\b/i.test(cleanInput) || /^amverif\b/i.test(cleanInput);
                const isUrl = /^https?:\/\//i.test(cleanInput);
                const isB64 = cleanInput.startsWith('b64:');

                if (isVerifCmd || isUrl || isB64) {
                    let rawLink = "";
                    let targetEmail = "";

                    let remain = cleanInput;
                    if (/^verif\b/i.test(remain)) {
                        remain = remain.replace(/^verif\s*[:|]?\s*/i, '').trim();
                    } else if (/^amverif\b/i.test(remain)) {
                        remain = remain.replace(/^amverif\s*[:|]?\s*/i, '').trim();
                    }

                    if (remain.includes('|')) {
                        const parts = remain.split('|').map(s => s.trim()).filter(Boolean);
                        if (parts.length >= 2) {
                            if (parts[0].includes('@') && !/^https?:\/\//i.test(parts[0])) {
                                targetEmail = parts[0];
                                rawLink = parts.slice(1).join('|');
                            } else if (parts[1].includes('@') && !/^https?:\/\//i.test(parts[1])) {
                                targetEmail = parts[1];
                                rawLink = parts[0];
                            } else {
                                rawLink = parts.join('|');
                            }
                        } else if (parts.length === 1) {
                            rawLink = parts[0];
                        }
                    } else {
                        const tokens = remain.split(/\s+/).map(s => s.trim()).filter(Boolean);
                        for (const t of tokens) {
                            if (!targetEmail && t.includes('@') && !/^https?:\/\//i.test(t)) {
                                targetEmail = t;
                            } else if (!rawLink && (/^https?:\/\//i.test(t) || t.startsWith('b64:'))) {
                                rawLink = t;
                            }
                        }
                        if (!rawLink && remain) {
                            rawLink = remain;
                        }
                    }

                    if (rawLink.startsWith('b64:')) {
                        try { rawLink = Buffer.from(rawLink.slice(4), 'base64').toString('utf-8').trim(); }
                        catch (e) { return await safeReply(`❌ Gagal decode base64: ${e.message}`); }
                    }

                    rawLink = unwrapAlightLink(rawLink);

                    // 1. Ekstrak email otomatis jika tertulis di dalam URL
                    if (!targetEmail) {
                        targetEmail = extractEmailFromUrl(rawLink) || extractEmailFromUrl(cleanInput) || "";
                    }

                    // 2. Ambil dari database sesi pengirim jika belum ada
                    if (!targetEmail) {
                        const sess = (typeof amSessionGet === 'function') ? amSessionGet(m.sender) : null;
                        targetEmail = (sess && sess.email) ||
                                      global.ampremSessions?.[m.sender] ||
                                      global.ampremSessions?.[normalizeAmJid(m.sender)] ||
                                      global.ampremEmail || "";
                    }

                    if (!rawLink || !/^https?:\/\//i.test(rawLink)) {
                        return await safeReply(
`\`⌜ ғᴏʀᴍᴀᴛ sᴀʟᴀʜ ⌟\`
> ◦ Masukkan link verifikasi yang valid dari Alight Creative.
> ◦ *Contoh:* *${prefix}amprem verif|<link>*
> ◦ *Atau:* *${prefix}amprem verif|<email>|<link>*
> ◦ *Atau:* *${prefix}verif <link>*`
                        );
                    }

                    if (!targetEmail || !targetEmail.includes('@')) {
                        return await safeReply(
`\`⌜ ᴇᴍᴀɪʟ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ ⌟\`
> ◦ Link verifikasi terdeteksi, tapi email akun belum terdaftar di bot.
> ◦ *Kirim email dulu dengan:* *${prefix}amprem nama@gmail.com*
> ◦ *Atau masukkan email langsung:* *${prefix}amprem verif|<email>|<link>*`
                        );
                    }

                    await safeReply(global.mess?.wait || '⏳ Sedang memverifikasi link Alight Motion...');
                    await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});

                    try {
                        let resData = null;
                        try {
                            const apiUrl = `${baseUrl}/apkprem/alightmotion/verify?apikey=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(targetEmail)}&magicLink=${encodeURIComponent(rawLink)}`;
                            const res = await axios.get(apiUrl, { timeout: 20000, validateStatus: () => true });
                            resData = res.data;
                        } catch (errApi) {
                            try {
                                const res = await axios.post(`${baseUrl}/apkprem/alightmotion/verify`, {
                                    apikey: apiKey,
                                    email: targetEmail,
                                    magicLink: rawLink
                                }, { timeout: 20000, validateStatus: () => true });
                                resData = res.data;
                            } catch (errPost) {
                                try {
                                    const fallbackData = await amRequestVerify(targetEmail, rawLink);
                                    if (fallbackData && (fallbackData.status === true || fallbackData.status === 'true')) {
                                        resData = { status: true, data: { status: 'ACTIVE', orderId: 'theresav-eu' } };
                                    }
                                } catch (errTheresa) {}
                            }
                        }

                        if (resData && (resData.status === true || resData.data?.status === 'ACTIVE' || resData.status === 'true')) {
                            await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                            addLimit(m.sender, isPrem, isCreator);

                            if (typeof amSessionDel === 'function') amSessionDel(m.sender);
                            if (global.ampremSessions) delete global.ampremSessions[m.sender];

                            const info = resData.data || {};
                            return await safeReply(
`\`⌜ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ᴘʀᴇᴍɪᴜᴍ ⌟\`
> ◦ ᴄʀᴇᴀᴛᴏʀ : *Kureza*
> ◦ sᴛᴀᴛᴜs : *✅ Berhasil Diaktifkan*
> ◦ ᴇᴍᴀɪʟ : *${targetEmail}*
> ◦ ᴍᴇᴍʙᴇʀsʜɪᴘ : *Alight Motion VIP Pro (1 Tahun)*
> ◦ ᴏʀᴅᴇʀ ɪᴅ : *${info.orderId || 'diezy-clutch-am'}*
> ◦ ᴇxᴘɪʀᴇᴅ : *${info.validUntil || '1 Tahun'}*

\`⌜ ᴄᴀᴛᴀᴛᴀɴ ⌟\`
> ◦ Silakan buka aplikasi Alight Motion lalu login dengan email di atas.
> ◦ Akun sudah otomatis berstatus Pro tanpa watermark!`
                            );
                        } else {
                            await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                            const errMsg = resData?.message || resData?.error || 'Verifikasi link gagal atau link sudah kedaluwarsa.';
                            return await safeReply(
`\`⌜ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ⌟\`
> ◦ sᴛᴀᴛᴜs : *❌ Verifikasi Gagal*
> ◦ ᴇᴍᴀɪʟ : *${targetEmail}*
> ◦ ᴘᴇsᴀɴ : *${errMsg}*
> ◦ sᴏʟᴜsɪ : *Kirim ulang email dengan ${prefix}amprem ${targetEmail}*`
                            );
                        }
                    } catch (e) {
                        console.error('[AMPREM VERIF ERROR]', e.message);
                        await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                        return await safeReply(`\`⌜ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ⌟\`\n> ◦ ɢᴀɢᴀʟ : *${e.response?.data?.message || e.message || global.mess?.error || 'Terjadi kesalahan sistem saat verifikasi'}*`);
                    }
                }

                // 3. JIKA INPUT ADALAH EMAIL -> KIRIM MAGIC LINK
                const email = cleanInput.toLowerCase();
                if (!email.includes('@') || !email.includes('.')) {
                    return await safeReply(`\`⌜ ғᴏʀᴍᴀᴛ sᴀʟᴀʜ ⌟\`\n> ◦ Format email tidak valid! Masukkan email yang benar.\n> ◦ Contoh: *${prefix}amprem user@gmail.com*`);
                }

                if (typeof amSessionSet === 'function') amSessionSet(m.sender, email);
                global.ampremSessions[m.sender] = email;
                global.ampremEmail = email;

                await safeReply(global.mess?.wait || '⏳ Sedang mengirim magic link...');
                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});

                try {
                    let sentOk = false;
                    let resMessage = "";

                    try {
                        const apiUrl = `${baseUrl}/apkprem/alightmotion/send-link?apikey=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(email)}`;
                        const res = await axios.get(apiUrl, { timeout: 20000, validateStatus: () => true });
                        if (res.data && res.data.status === true) {
                            sentOk = true;
                            resMessage = res.data.message;
                        }
                    } catch (errClutch) {
                        try {
                            const dataTheresa = await amRequestSend(email);
                            if (dataTheresa && dataTheresa.status) {
                                sentOk = true;
                                resMessage = dataTheresa.message;
                            }
                        } catch (errTheresa) {}
                    }

                    if (sentOk) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: "📧", key: m.key } }).catch(() => {});
                        addLimit(m.sender, isPrem, isCreator);

                        return await safeReply(
`\`⌜ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ᴘʀᴇᴍɪᴜᴍ ⌟\`
> ◦ ᴄʀᴇᴀᴛᴏʀ : *Kureza*
> ◦ sᴛᴀᴛᴜs : *Magic Link Terkirim 📧*
> ◦ ᴇᴍᴀɪʟ : *${email}*

\`⌜ ʟᴀɴɢᴋᴀʜ sᴇʟᴀɴᴊᴜᴛɴʏᴀ ⌟\`
> ◦ 1. Buka email (cek Inbox / Spam)
> ◦ 2. Buka pesan dari *Alight Creative* & salin tautan verifikasinya
> ◦ 3. Ketik: *${prefix}amprem verif|<link>*
> ◦ Atau cukup kirim link langsung ke chat bot ini (Auto Verif)!`
                        );
                    } else {
                        await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                        return await safeReply(`\`⌜ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ⌟\`\n> ◦ ɢᴀɢᴀʟ : *Gagal mengirim magic link ke ${email}. Pastikan email benar atau coba beberapa saat lagi.*`);
                    }
                } catch (e) {
                    console.error('[AMPREM SEND ERROR]', e.message);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    return await safeReply(`\`⌜ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ⌟\`\n> ◦ ɢᴀɢᴀʟ : *${e.response?.data?.message || e.message || global.mess?.error || 'Terjadi kesalahan'}*`);
                }
            }
            break;

            case "amprem2":
            case "verif2":
            case "amverify2": {
                const safeReply = async (teks, mentions = [m.sender]) => {
                    try {
                        const res = await Reply(teks, mentions);
                        if (res && res.key) return res;
                    } catch (e) {}
                    return await shorekeeper.sendMessage(m.chat, { text: teks, contextInfo: { mentionedJid: mentions } }, { quoted: m }).catch(() => {});
                };

                if (!isCreator && checkLimit(m.sender, isPrem, isCreator)) return await safeReply(global.mess?.limit || '❌ Limit harian kamu habis!');

                const AM2_BASE = 'https://api.jaky.dev/v1/alight-motion';
                const AM2_KEY = global.jakyKey || 'diezy-jakydev404';
                const AM2_HEAD = { 'x-jaky-key': AM2_KEY, 'Content-Type': 'application/json' };

                const input = (text || '').trim();
                const sess = am2SessionGet(m.sender);

                if (!input) {
                    return await safeReply(
`\`⌜ ᴀᴍᴘʀᴇᴍ2 ⌟\`
> ◦ ᴋɪʀɪᴍ ʟɪɴᴋ : ${prefix}amprem2 <ᴇᴍᴀɪʟ>
> ◦ ᴠᴇʀɪꜰɪᴋᴀꜱɪ : ${prefix}amprem2 <ʟɪɴᴋ>

\`⌜ ᴄᴀʀᴀ ᴘᴀᴋᴀɪ ⌟\`
> ◦ 1. ᴋɪʀɪᴍ ᴇᴍᴀɪʟ ᴋᴀᴍᴜ
> ◦ 2. ᴄᴇᴋ ɪɴʙᴏx / ꜱᴘᴀᴍ / ᴘʀᴏᴍᴏᴛɪᴏɴꜱ
> ◦ 3. ᴄᴏᴘʏ ᴍᴀɢɪᴄ ʟɪɴᴋ ᴅᴀʀɪ ᴀʟɪɢʜᴛ
> ◦ 4. ᴋɪʀɪᴍ ʟɪɴᴋɴʏᴀ ᴋᴇ ꜱɪɴɪ

${sess ? `> ◦ ꜱᴇꜱɪ ᴀᴋᴛɪꜰ : ${sess.email}` : ''}`);
                }

                if (input.includes('@') && !/^https?:\/\//i.test(input)) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                    try {
                        const res = await axios.post(`${AM2_BASE}/send-link`, { email: input }, { headers: AM2_HEAD, timeout: 30000 });
                        am2SessionSet(m.sender, input);
                        await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                        addLimit(m.sender, isPrem, isCreator);
                        return await safeReply(
`\`⌜ ᴀᴍᴘʀᴇᴍ2 ꜱᴇɴᴅ ⌟\`
> ◦ ᴇᴍᴀɪʟ : ${input}
> ◦ ꜱᴛᴀᴛᴜꜱ : ᴍᴀɢɪᴄ ʟɪɴᴋ ᴛᴇʀᴋɪʀɪᴍ
> ◦ ʟᴀɴɢᴋᴀʜ : ᴄᴇᴋ ɪɴʙᴏx & ᴋɪʀɪᴍ ʟɪɴᴋɴʏᴀ ᴋᴇ ꜱɪɴɪ
> ◦ ᴄᴏɴᴛᴏʜ : ${prefix}amprem2 <ʟɪɴᴋ>`);
                    } catch (error) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return await safeReply(`❌ Error kirim magic link amprem2: ${error?.response?.data?.message || error.message}`);
                    }
                }

                if (/^https?:\/\//i.test(input)) {
                    const cleanLink = unwrapAlightLink(input);
                    const emailTarget = (sess && sess.email) || extractEmailFromUrl(cleanLink) || extractEmailFromUrl(input);

                    if (!emailTarget) {
                        return await safeReply(`❌ Tidak ada sesi email aktif. Ketik: *${prefix}amprem2 <email>* terlebih dahulu.`);
                    }
                    await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                    try {
                        const res = await axios.post(`${AM2_BASE}/verify-link`, { email: emailTarget, link: cleanLink }, { headers: AM2_HEAD, timeout: 30000 });
                        am2SessionDel(m.sender);
                        await shorekeeper.sendMessage(m.chat, { react: { text: '🎉', key: m.key } }).catch(() => {});
                        addLimit(m.sender, isPrem, isCreator);
                        return await safeReply(
`\`⌜ ᴀᴍᴘʀᴇᴍ2 ꜱᴜᴋꜱᴇꜱ ⌟\`
> ◦ ᴇᴍᴀɪʟ : ${emailTarget}
> ◦ ꜱᴛᴀᴛᴜꜱ : ᴀᴋᴜɴ ᴘʀᴏ ᴀᴋᴛɪꜰ (1 ᴛᴀʜᴜɴ)
> ◦ ꜱɪʟᴀᴋᴀɴ ʟᴏɢɪɴ ᴅɪ ᴀᴘʟɪᴋᴀꜱɪ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ`);
                    } catch (error) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        return await safeReply(`❌ Verifikasi amprem2 gagal: ${error?.response?.data?.message || error.message}`);
                    }
                }

                return await safeReply(`❌ Input tidak valid. Kirim email untuk request link, atau kirim URL untuk verifikasi.`);
            }
            break;

            case "bulk-amprem":
            case "bulkalightmotion":
            case "bulkam": {
                const isResellerUser = checkResellerAccess(m.sender, isCreator);
                if (!isCreator && !isResellerUser && !isPrem) {
                    return Reply(
`\`⌜ ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ ⌟\`
> ◦ ᴀᴋsᴇs : *Khusus Reseller / Premium*
> ◦ ᴘᴇsᴀɴ : *Fitur ini khusus untuk Reseller, Premium & Owner!*
> ◦ ɪɴғᴏ : *Silakan hubungi Owner untuk mendaftar sebagai Reseller.*`
                    );
                }

                if (checkLimit(m.sender, isPrem, isCreator)) return Reply(global.mess?.limit || '❌ Limit habis!');

                let count = 5;
                if (text && !isNaN(parseInt(text, 10))) {
                    count = Math.max(1, Math.min(parseInt(text, 10), 25));
                }

                Reply(global.mess?.wait || '⏳ Sedang memproses bulk akun Alight Motion...');
                await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});

                const apiKey = global.apikeydiezy || global.apikeyalip || "alipaiapikeybaru";
                const baseUrl = (global.apidiezy || "https://api-shorekeeper.clutch.ai.id").replace(/\/$/, "");

                try {
                    const apiUrl = `${baseUrl}/apkprem/alightmotion/bulk?apikey=${encodeURIComponent(apiKey)}&count=${count}`;
                    const res = await axios.get(apiUrl, { timeout: 180000 });
                    const data = res.data;

                    if (!data || data.status !== true || !Array.isArray(data.results)) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                        return Reply(`\`⌜ ʙᴜʟᴋ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ⌟\`\n> ◦ ɢᴀɢᴀʟ : *${data?.error || "Gagal menghasilkan akun massal Alight Motion."}*`);
                    }

                    const successList = data.results.filter(r => r.status);
                    if (successList.length === 0) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                        return Reply(`\`⌜ ʙᴜʟᴋ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ⌟\`\n> ◦ ɢᴀɢᴀʟ : *Semua pembuatan akun gagal, silakan coba sesaat lagi.*`);
                    }

                    let fileText = `==================================================\n` +
                                   `           ALIGHT MOTION PRO (BULK)\n` +
                                   `               Creator: Kureza\n` +
                                   `==================================================\n` +
                                   `Total Akun  : ${successList.length} Akun\n` +
                                   `Waktu Buat  : ${new Date().toLocaleString('id-ID')}\n` +
                                   `Plan        : Alight Motion VIP Pro (1 Tahun)\n` +
                                   `Status      : AKTIF / PRO BERHASIL\n` +
                                   `==================================================\n\n`;

                    successList.forEach((acc, i) => {
                        fileText += `[AKUN ${i + 1}]\n` +
                                    `Email       : ${acc.email}\n` +
                                    `Inbox Login : ${acc.inbox}\n` +
                                    `Masa Aktif  : 1 Tahun\n` +
                                    `Status      : PRO ACTIVE\n` +
                                    `--------------------------------------------------\n\n`;
                    });

                    const caption = `\`⌜ ʙᴜʟᴋ ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ⌟\`\n` +
                                    `> ◦ ᴄʀᴇᴀᴛᴏʀ : *Kureza*\n` +
                                    `> ◦ sᴛᴀᴛᴜs : *✅ Berhasil (${successList.length}/${data.totalRequested || count})*\n` +
                                    `> ◦ ᴘʟᴀɴ : *Alight Motion Pro 1 Tahun*\n` +
                                    `> ◦ ᴛɪᴘᴇ : *File Dokumen (.txt)*`;

                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                    addLimit(m.sender, isPrem, isCreator);

                    return await shorekeeper.sendMessage(m.chat, {
                        document: Buffer.from(fileText, 'utf-8'),
                        fileName: `AlightMotion_Bulk_${successList.length}_Akun.txt`,
                        mimetype: 'text/plain',
                        caption: caption
                    }, { quoted: m });
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    return Reply(`❌ Error bulk: ${e.response?.data?.message || e.message}`);
                }
            }
            break;

            case "am":
            case "alight": {
                try {
                    const amPlugin = require('./plugins/tools/am');
                    await amPlugin(m, {
                        shorekeeper,
                        text,
                        command,
                        isCreator,
                        isPremium: isPrem,
                        Reply,
                        checkResellerAccess: (jid) => checkResellerAccess(jid, isCreator),
                        checkLimit,
                        addLimit,
                        prefix
                    });
                } catch (errAm) {
                    console.error('[AM PLUGIN ERROR]', errAm);
                    Reply(`❌ Error plugin AM: ${errAm.message}`);
                }
            }
            break;

            case "addpartneram": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!text) return Reply(example("6281234567890"));

                const numberPartner = text.replace(/[^0-9]/g, '');
                if (numberPartner.length < 10) return Reply("❌ Nomor tidak valid!");

                const partnerPath = './library/database/partner_am.json';
                if (!fs.existsSync(partnerPath)) {
                    fs.writeFileSync(partnerPath, JSON.stringify([]));
                }
                let partnerData = JSON.parse(fs.readFileSync(partnerPath));

                const jidPartner = numberPartner + '@s.whatsapp.net';
                if (partnerData.includes(jidPartner)) {
                    return Reply(`❌ ${numberPartner} sudah terdaftar sebagai partner Alight Motion!`);
                }

                partnerData.push(jidPartner);
                fs.writeFileSync(partnerPath, JSON.stringify(partnerData, null, 2));

                let namePartner = numberPartner;
                try {
                    const contact = await shorekeeper.getName(jidPartner);
                    if (contact) namePartner = contact;
                } catch(e) {}

                Reply(`✅ ${namePartner} (${numberPartner}) berhasil ditambahkan sebagai partner Alight Motion!\nPartner bisa memakai fitur .addreselleram dan .delreselleram.`);
            }
            break;

            case "delpartneram": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!text) return Reply(example("6281234567890"));

                const numberPartner = text.replace(/[^0-9]/g, '');
                if (numberPartner.length < 10) return Reply("❌ Nomor tidak valid!");

                const partnerPath = './library/database/partner_am.json';
                if (!fs.existsSync(partnerPath)) {
                    fs.writeFileSync(partnerPath, JSON.stringify([]));
                    return Reply("❌ Belum ada partner Alight Motion terdaftar!");
                }
                let partnerData = JSON.parse(fs.readFileSync(partnerPath));

                const jidPartner = numberPartner + '@s.whatsapp.net';
                const indexPartner = partnerData.indexOf(jidPartner);
                if (indexPartner === -1) {
                    return Reply(`❌ ${numberPartner} tidak terdaftar sebagai partner Alight Motion!`);
                }

                partnerData.splice(indexPartner, 1);
                fs.writeFileSync(partnerPath, JSON.stringify(partnerData, null, 2));

                let namePartner = numberPartner;
                try {
                    const contact = await shorekeeper.getName(jidPartner);
                    if (contact) namePartner = contact;
                } catch(e) {}

                Reply(`✅ ${namePartner} (${numberPartner}) berhasil dihapus dari partner Alight Motion!`);
            }
            break;

            case "listpartneram": {
                if (!isCreator) return Reply(global.mess.owner);

                const partnerPath = './library/database/partner_am.json';
                if (!fs.existsSync(partnerPath)) {
                    fs.writeFileSync(partnerPath, JSON.stringify([]));
                    return Reply("📭 Belum ada partner Alight Motion terdaftar!");
                }
                let partnerData = JSON.parse(fs.readFileSync(partnerPath));

                if (partnerData.length === 0) {
                    return Reply("📭 Belum ada partner Alight Motion terdaftar!");
                }

                let textListPartner = "📋 *DAFTAR PARTNER ALIGHT MOTION*\n\n";
                for (let i = 0; i < partnerData.length; i++) {
                    const jid = partnerData[i];
                    let name = jid.split('@')[0];
                    try {
                        const contact = await shorekeeper.getName(jid);
                        if (contact) name = contact;
                    } catch(e) {}
                    textListPartner += `${i+1}. ${name}\n`;
                    textListPartner += `   📱 wa.me/${jid.split('@')[0]}\n\n`;
                }
                Reply(textListPartner);
            }
            break;

            case "addreselleram": {
                if (!isCreator && !isPartnerAM(m.sender)) return Reply("❌ Fitur ini hanya untuk Owner atau Partner Alight Motion!");
                if (!text) return Reply(example("6281234567890"));

                const number = text.replace(/[^0-9]/g, '');
                if (number.length < 10) return Reply("❌ Nomor tidak valid!");

                const resellerPath = './library/database/reseller_am.json';
                if (!fs.existsSync(resellerPath)) {
                    fs.writeFileSync(resellerPath, JSON.stringify([]));
                }
                let resellerData = JSON.parse(fs.readFileSync(resellerPath));

                const jid = number + '@s.whatsapp.net';
                if (resellerData.includes(jid)) {
                    return Reply(`❌ ${number} sudah terdaftar sebagai reseller AM!`);
                }

                resellerData.push(jid);
                fs.writeFileSync(resellerPath, JSON.stringify(resellerData, null, 2));

                let name = number;
                try {
                    const contact = await shorekeeper.getName(jid);
                    if (contact) name = contact;
                } catch(e) {}

                Reply(`✅ ${name} (${number}) berhasil ditambahkan sebagai reseller AM!`);
            }
            break;

            case "delreselleram": {
                if (!isCreator && !isPartnerAM(m.sender)) return Reply("❌ Fitur ini hanya untuk Owner atau Partner Alight Motion!");
                if (!text) return Reply(example("6281234567890"));

                const number = text.replace(/[^0-9]/g, '');
                if (number.length < 10) return Reply("❌ Nomor tidak valid!");

                const resellerPath = './library/database/reseller_am.json';
                if (!fs.existsSync(resellerPath)) {
                    fs.writeFileSync(resellerPath, JSON.stringify([]));
                    return Reply("❌ Belum ada reseller AM terdaftar!");
                }
                let resellerData = JSON.parse(fs.readFileSync(resellerPath));

                const jid = number + '@s.whatsapp.net';
                const index = resellerData.indexOf(jid);
                if (index === -1) {
                    return Reply(`❌ ${number} tidak terdaftar sebagai reseller AM!`);
                }

                resellerData.splice(index, 1);
                fs.writeFileSync(resellerPath, JSON.stringify(resellerData, null, 2));

                let name = number;
                try {
                    const contact = await shorekeeper.getName(jid);
                    if (contact) name = contact;
                } catch(e) {}

                Reply(`✅ ${name} (${number}) berhasil dihapus dari reseller AM!`);
            }
            break;

            case "listreselleram": {
                if (!isCreator && !isPartnerAM(m.sender)) return Reply("❌ Fitur ini hanya untuk Owner atau Partner Alight Motion!");

                const resellerPath = './library/database/reseller_am.json';
                if (!fs.existsSync(resellerPath)) {
                    fs.writeFileSync(resellerPath, JSON.stringify([]));
                    return Reply("📭 Belum ada reseller AM terdaftar!");
                }
                let resellerData = JSON.parse(fs.readFileSync(resellerPath));

                if (resellerData.length === 0) {
                    return Reply("📭 Belum ada reseller AM terdaftar!");
                }

                let textListReseller = "📋 *DAFTAR RESELLER ALIGHT MOTION*\n\n";
                for (let i = 0; i < resellerData.length; i++) {
                    const jid = resellerData[i];
                    let name = jid.split('@')[0];
                    try {
                        const contact = await shorekeeper.getName(jid);
                        if (contact) name = contact;
                    } catch(e) {}
                    textListReseller += `${i+1}. ${name}\n`;
                    textListReseller += `   📱 wa.me/${jid.split('@')[0]}\n\n`;
                }
                Reply(textListReseller);
            }
            break;

            // ==================== CASE MANAGEMENT ====================
            case 'getcase': {
                if (!isCreator) return Reply(global.mess.owner);
                if (!text) return Reply(`Contoh: .getcase nama_case`);
                const fs = require('fs').promises;
                try {
                    const targetFile = require('fs').existsSync('./kurezamd.js') ? './kurezamd.js' : (require('fs').existsSync('./shore-cmd.js') ? './shore-cmd.js' : __filename);
                    const data = await fs.readFile(targetFile, 'utf8');
                    const regex = new RegExp(
                        `case\\s+['"\`]${text.trim()}['"\`]:[\\s\\S]*?break;?`,
                        'i'
                    );
                    const match = data.match(regex);
                    if (!match) {
                        return Reply(`❌ Case "${text}" tidak ditemukan.`);
                    }
                    const caseCode = match[0];
                    const MB = require("baileys-mbuilder");
                    const ai = new MB.AIRich(shorekeeper);
                    ai.addCode("javascript", caseCode);
                    await ai.send(m.chat, { forwarded: true });
                } catch (err) {
                    Reply(`Terjadi kesalahan: ${err.message}`);
                }
            }
            break;

            case "delcase": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!text || text.trim().length === 0) return Reply(example("nama_case"));

                const caseNameToRemove = text.trim();
                const filePath = path.join(process.cwd(), 'kurezamd.js');

                try {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const regex = new RegExp(`case\\s+['"\`]${caseNameToRemove}['"\`]:[\\s\\S]*?break;?`, 'g');
                    const modifiedData = data.replace(regex, '');

                    if (data === modifiedData) {
                        return Reply(`❌ Case "${caseNameToRemove}" tidak ditemukan di kurezamd.js.`);
                    }

                    fs.writeFileSync(filePath, modifiedData, 'utf8');
                    Reply(`✅ Sukses menghapus case: *${caseNameToRemove}* dari kurezamd.js`);
                } catch (err) {
                    console.error('delcase error:', err);
                    Reply(`❌ Gagal menghapus case: ${err.message}`);
                }
            }
            break;

            case "listcase": {
                if (!isCreator) return Reply(global.mess.owner);

                const filePath = path.join(process.cwd(), 'kurezamd.js');

                try {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const regex = /case\s+['"]([^'"]+)['"]:/g;
                    const matches = data.matchAll(regex);
                    let caseNames = [];
                    for (const m of matches) {
                        caseNames.push(m[1]);
                    }

                    if (caseNames.length === 0) {
                        return Reply("❌ Tidak ada case yang ditemukan di kurezamd.js.");
                    }

                    caseNames = [...new Set(caseNames)].sort();
                    const chunkSize = 50;
                    const totalPage = Math.ceil(caseNames.length / chunkSize);

                    let page = parseInt(args[0]) || 1;
                    if (page < 1 || page > totalPage) page = 1;

                    const chunk = caseNames.slice((page - 1) * chunkSize, page * chunkSize);
                    let teks = `\`⌜ Daftar Case (${caseNames.length} Total) ⌟\`\n> ◦ *Halaman :* ${page} / ${totalPage}\n\n`;

                    chunk.forEach((name, idx) => {
                        teks += `> ${(page - 1) * chunkSize + idx + 1}. ${name}\n`;
                    });

                    if (totalPage > 1) {
                        teks += `\n💡 *Ketik listcase <halaman> untuk melihat halaman berikutnya*`;
                    }

                    await Reply(teks);
                } catch (err) {
                    console.error('listcase error:', err);
                    Reply(`❌ Gagal membaca daftar case: ${err.message}`);
                }
            }
            break;

            // ==================== RICH GAME COMMANDS ====================
            case "dino":
            case "dinorunner":
            case "gamedino":
            case "flappy":
            case "flappybird":
            case "gameflappy":
            case "brickbreaker":
            case "breakout":
            case "brick":
            case "gamebrick":
            case "2048":
            case "game2048":
            case "puzzle2048":
            case "gaple":
            case "domino":
            case "dominogame":
            case "blockblast":
            case "block":
            case "gameblock":
            case "bb":
            case "drone":
            case "droneview":
            case "dv":
            case "guitar":
            case "guitarhero":
            case "gitar":
            case "spaceinvaders":
            case "spaceshooter":
            case "galaxian":
            case "space":
            case "parkour":
            case "parkourgame":
            case "gameparkour":
            case "plane":
            case "spacerush":
            case "planegame":
            case "snake":
            case "snakename":
            case "gamesnake":
            case "balap":
            case "racing":
            case "race":
            case "turborace":
            case "catur":
            case "chess":
            case "gamecatur":
            case "gamechess":
            case "ludo":
            case "ludoking":
            case "game_ludo":
            case "slot":
            case "slotmachine":
            case "gameslot": {
                const gamePluginMap = {
                    dino: './plugins/game/dino',
                    dinorunner: './plugins/game/dino',
                    gamedino: './plugins/game/dino',
                    flappy: './plugins/game/flappybird',
                    flappybird: './plugins/game/flappybird',
                    gameflappy: './plugins/game/flappybird',
                    brickbreaker: './plugins/game/brickbreaker',
                    breakout: './plugins/game/brickbreaker',
                    brick: './plugins/game/brickbreaker',
                    gamebrick: './plugins/game/brickbreaker',
                    '2048': './plugins/game/game2048',
                    game2048: './plugins/game/game2048',
                    puzzle2048: './plugins/game/game2048',
                    gaple: './plugins/game/gaple',
                    domino: './plugins/game/gaple',
                    dominogame: './plugins/game/gaple',
                    blockblast: './plugins/game/blockblast',
                    block: './plugins/game/blockblast',
                    gameblock: './plugins/game/blockblast',
                    bb: './plugins/game/blockblast',
                    drone: './plugins/game/droneview',
                    droneview: './plugins/game/droneview',
                    dv: './plugins/game/droneview',
                    guitar: './plugins/game/gitar',
                    guitarhero: './plugins/game/gitar',
                    gitar: './plugins/game/gitar',
                    spaceinvaders: './plugins/game/spaceinvaders',
                    spaceshooter: './plugins/game/spaceinvaders',
                    galaxian: './plugins/game/spaceinvaders',
                    space: './plugins/game/spaceinvaders',
                    parkour: './plugins/game/parkour',
                    parkourgame: './plugins/game/parkour',
                    gameparkour: './plugins/game/parkour',
                    plane: './plugins/game/plane',
                    spacerush: './plugins/game/plane',
                    planegame: './plugins/game/plane',
                    snake: './plugins/game/snake',
                    snakename: './plugins/game/snake',
                    gamesnake: './plugins/game/snake',
                    balap: './plugins/game/balap',
                    racing: './plugins/game/balap',
                    race: './plugins/game/balap',
                    turborace: './plugins/game/balap',
                    catur: './plugins/game/catur',
                    chess: './plugins/game/catur',
                    gamecatur: './plugins/game/catur',
                    gamechess: './plugins/game/catur',
                    ludo: './plugins/game/ludo',
                    ludoking: './plugins/game/ludo',
                    game_ludo: './plugins/game/ludo',
                    slot: './plugins/game/slot',
                    slotmachine: './plugins/game/slot',
                    gameslot: './plugins/game/slot'
                };
                const pluginPath = gamePluginMap[command.toLowerCase()];
                if (pluginPath) {
                    try {
                        const gamePlugin = require(pluginPath);
                        await gamePlugin(m, {
                            shorekeeper,
                            Reply,
                            isRegistered: () => true,
                            isCreator,
                            isPremium: isPrem,
                            checkLimit,
                            addLimit,
                            prefix,
                            command,
                            text,
                            args
                        });
                    } catch (errGame) {
                        console.error(`[GAME ${command} ERROR]`, errGame);
                        Reply(`❌ Gagal memuat game: ${errGame.message}`);
                    }
                }
            }
            break;

            // ==================== GAME COMMANDS ====================
            case "asahotak":
            case "caklontong":
            case "family100":
            case "lengkapikalimat":
            case "sambungkata":
            case "siapakahaku":
            case "susunkata":
            case "tebakkata":
            case "tebakkalimat":
            case "tebakinggris":
            case "tebakjorok":
            case "tebaklirik":
            case "tebakhewan":
            case "tebakgambar":
            case "tebakbendera":
            case "tebaklogo":
            case "tebakanime":
            case "tebakgame":
            case "tebakhero":
            case "tebakmakanan":
            case "tebakgenshin":
            case "tebaklagu": {
                await startGame(shorekeeper, m, command);
            }
            break;

            case "mute": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                let value = args[0]?.toLowerCase();
                if (!value || (value !== 'on' && value !== 'off')) {
                    return Reply(example("on/off"));
                }
                if (value === 'on') {
                    global.db.groups[m.chat].mute = true;
                    Reply(`\`⌜ Mute Settings ⌟\`\n> ◦ Status : *Aktif*\n> ◦ Info : *Bot berhasil di-mute di grup ini*`);
                } else if (value === 'off') {
                    global.db.groups[m.chat].mute = false;
                    Reply(`\`⌜ Mute Settings ⌟\`\n> ◦ Status : *Nonaktif*\n> ◦ Info : *Bot berhasil di-unmute di grup ini*`);
                }
            }
            break;

            case "afk": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit);

                const reason = text && text.trim().length > 0 ? text.trim() : 'Tanpa Alasan';
                setAfk(m.sender, reason);

                const timeStr = moment().tz('Asia/Jakarta').format('HH:mm:ss');
                addLimit(m.sender, isCreator);
                await shorekeeper.sendMessage(m.chat, { react: { text: '💤', key: m.key } }).catch(() => {});

                return Reply(
                    `\`⌜ Mode AFK 💤 ⌟\`\n> ◦ *User :* @${m.sender.split('@')[0]}\n> ◦ *Alasan :* ${reason}\n> ◦ *Waktu :* ${timeStr} WIB\n\n> ◦ *Info :* Jangan tag dia sampai kembali! Status AFK otomatis mati saat mengirim pesan lagi.`,
                    [m.sender]
                );
            }
            break;

            case "ht":
            case "h":
            case "hidetag": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                const members = m.metadata.participants.map(v => v.id);
                const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

                let mediaBuffer = null;
                let mimeType = '';
                let captionText = '';
                let mediaType = ''; // 'image' | 'video' | 'sticker' | 'audio' | 'document'
                let fileName = '';
                let isPtt = false;

                // 1. Cek media langsung pada pesan perintah (kirim media dengan caption .h / .ht / .hidetag)
                if (m.message?.imageMessage) {
                    try {
                        const mediaStream = await downloadContentFromMessage(m.message.imageMessage, 'image');
                        const chunks = [];
                        for await (const chunk of mediaStream) chunks.push(chunk);
                        mediaBuffer = Buffer.concat(chunks);
                        mimeType = m.message.imageMessage.mimetype || 'image/jpeg';
                        mediaType = 'image';
                        captionText = text || m.message.imageMessage.caption || '';
                    } catch (e) {}
                } else if (m.message?.videoMessage) {
                    try {
                        const mediaStream = await downloadContentFromMessage(m.message.videoMessage, 'video');
                        const chunks = [];
                        for await (const chunk of mediaStream) chunks.push(chunk);
                        mediaBuffer = Buffer.concat(chunks);
                        mimeType = m.message.videoMessage.mimetype || 'video/mp4';
                        mediaType = 'video';
                        captionText = text || m.message.videoMessage.caption || '';
                    } catch (e) {}
                } else if (m.message?.documentMessage || m.message?.documentWithCaptionMessage) {
                    try {
                        const docMsg = m.message.documentMessage || m.message.documentWithCaptionMessage?.message?.documentMessage;
                        const mediaStream = await downloadContentFromMessage(docMsg, 'document');
                        const chunks = [];
                        for await (const chunk of mediaStream) chunks.push(chunk);
                        mediaBuffer = Buffer.concat(chunks);
                        mimeType = docMsg.mimetype || 'application/octet-stream';
                        fileName = docMsg.fileName || 'file';
                        mediaType = 'document';
                        captionText = text || docMsg.caption || '';
                    } catch (e) {}
                }

                // 2. Cek pesan yang di-reply (quoted message)
                const quotedMsg = m.quoted;
                if (!mediaBuffer && quotedMsg) {
                    const qObj = quotedMsg.msg || quotedMsg;
                    const quotedMime = qObj.mimetype || quotedMsg.mime || '';
                    const quotedType = quotedMsg.type || '';

                    if (/image/gi.test(quotedMime) || quotedType === 'imageMessage') {
                        try {
                            const mediaStream = await downloadContentFromMessage(qObj, 'image');
                            const chunks = [];
                            for await (const chunk of mediaStream) chunks.push(chunk);
                            mediaBuffer = Buffer.concat(chunks);
                            mimeType = quotedMime || 'image/jpeg';
                            mediaType = 'image';
                            captionText = text || qObj.caption || quotedMsg.text || quotedMsg.body || '';
                        } catch (e) {}
                    } else if (/video/gi.test(quotedMime) || quotedType === 'videoMessage') {
                        try {
                            const mediaStream = await downloadContentFromMessage(qObj, 'video');
                            const chunks = [];
                            for await (const chunk of mediaStream) chunks.push(chunk);
                            mediaBuffer = Buffer.concat(chunks);
                            mimeType = quotedMime || 'video/mp4';
                            mediaType = 'video';
                            captionText = text || qObj.caption || quotedMsg.text || quotedMsg.body || '';
                        } catch (e) {}
                    } else if (/webp/gi.test(quotedMime) || quotedType === 'stickerMessage') {
                        try {
                            const mediaStream = await downloadContentFromMessage(qObj, 'sticker');
                            const chunks = [];
                            for await (const chunk of mediaStream) chunks.push(chunk);
                            mediaBuffer = Buffer.concat(chunks);
                            mimeType = quotedMime || 'image/webp';
                            mediaType = 'sticker';
                        } catch (e) {}
                    } else if (/audio/gi.test(quotedMime) || quotedType === 'audioMessage') {
                        try {
                            const mediaStream = await downloadContentFromMessage(qObj, 'audio');
                            const chunks = [];
                            for await (const chunk of mediaStream) chunks.push(chunk);
                            mediaBuffer = Buffer.concat(chunks);
                            mimeType = quotedMime || 'audio/mp4';
                            mediaType = 'audio';
                            isPtt = !!(qObj.ptt || quotedMsg.isPtt);
                        } catch (e) {}
                    } else if (/document/gi.test(quotedMime) || quotedType === 'documentMessage') {
                        try {
                            const mediaStream = await downloadContentFromMessage(qObj, 'document');
                            const chunks = [];
                            for await (const chunk of mediaStream) chunks.push(chunk);
                            mediaBuffer = Buffer.concat(chunks);
                            mimeType = quotedMime || 'application/octet-stream';
                            fileName = qObj.fileName || 'file';
                            mediaType = 'document';
                            captionText = text || qObj.caption || '';
                        } catch (e) {}
                    } else {
                        // Quoted pesan teks
                        const qText = quotedMsg.text || quotedMsg.body || (typeof qObj === 'string' ? qObj : (qObj?.text || ''));
                        captionText = text || qText || '';
                    }
                }

                // 3. Fallback jika bukan media & tidak ada reply media
                if (!captionText && !mediaBuffer) {
                    captionText = text || '';
                }

                // Bersihkan awalan command jika masih ada di captionText
                if (captionText) {
                    const cleanRegex = new RegExp(`^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&./]*(h|ht|hidetag)\\s*`, 'i');
                    if (/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&./]+(h|ht|hidetag)(\s|$)/i.test(captionText.trim())) {
                        captionText = captionText.trim().replace(cleanRegex, '').trim();
                    }
                }

                // Keamanan: Tolak jika pesan hidetag diawali prefix perintah bot
                if (captionText) {
                    const multiPrefix = ['.', '/', '!', '#', '$', '%', '&', '*', '+', '-', '?', '@', '^'];
                    const isCmdPrefix = multiPrefix.some(p => captionText.trim().startsWith(p));
                    if (isCmdPrefix) {
                        return Reply("❌ Izin ditolak! Demi keamanan, tidak diperbolehkan melakukan hidetag pada pesan yang diawali dengan prefix perintah.");
                    }
                }

                // 4. Kirim sesuai tipe pesan dengan mention semua member
                if (mediaBuffer) {
                    let messageOptions = {
                        mentions: members
                    };

                    if (mediaType === 'image') {
                        messageOptions.image = mediaBuffer;
                        if (captionText) messageOptions.caption = captionText;
                    } else if (mediaType === 'video') {
                        messageOptions.video = mediaBuffer;
                        if (captionText) messageOptions.caption = captionText;
                    } else if (mediaType === 'sticker') {
                        messageOptions.sticker = mediaBuffer;
                    } else if (mediaType === 'audio') {
                        messageOptions.audio = mediaBuffer;
                        messageOptions.mimetype = mimeType;
                        messageOptions.ptt = isPtt;
                    } else if (mediaType === 'document') {
                        messageOptions.document = mediaBuffer;
                        messageOptions.mimetype = mimeType;
                        messageOptions.fileName = fileName || 'document';
                        if (captionText) messageOptions.caption = captionText;
                    }

                    await shorekeeper.sendMessage(m.chat, messageOptions, { quoted: m });
                } else if (captionText) {
                    await shorekeeper.sendMessage(m.chat, {
                        text: captionText,
                        mentions: members
                    }, { quoted: m });
                } else {
                    return Reply("📌 Masukkan teks, atau kirim/reply ke pesan/foto/video/dokumen/stiker/audio yang ingin di-hidetag.");
                }
            }
            break;

            // ==================== VOTEKICK ====================
            case "votekick":
            case "vk": {
                if (!m.isGroup) return Reply(global.mess.group);

                // ── Init storage ──
                if (!global.voteKickData)    global.voteKickData    = new Map();
                if (!global.db.groups)       global.db.groups       = {};
                if (!global.db.groups[m.chat]) global.db.groups[m.chat] = {};

                const VK_NEED = 3;          // suara yang dibutuhkan
                const VK_TTL  = 10 * 60 * 1000; // 10 menit

                const vkSub = (args[0] || '').toLowerCase();

                // ── Toggle ON/OFF (admin/owner only) ──
                if (vkSub === 'on' || vkSub === 'off') {
                    if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                    global.db.groups[m.chat].votekick = (vkSub === 'on');
                    return Reply(
                        vkSub === 'on'
                            ? `✅ VoteKick *🟢 ON*\n> ◦ Butuh *${VK_NEED} suara berbeda* untuk mengeluarkan member.\n> ◦ Admin, owner & bot tidak bisa di-vote-kick.\n> ◦ Vote hangus setelah 10 menit.`
                            : `✅ VoteKick *🔴 OFF*`
                    );
                }

                // ── Cek apakah votekick aktif di grup ini ──
                if (!global.db.groups[m.chat].votekick) {
                    return Reply(`🗳️ VoteKick belum aktif di grup ini.\n> Admin ketik *${prefix}votekick on* untuk mengaktifkan.`);
                }

                // ── Resolve target ──
                const vkRaw = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null) || (text.replace(/[^0-9]/g, '') ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
                if (!vkRaw) {
                    return Reply(
                        `\`⌜ VoteKick ⌟\`\n` +
                        `> ◦ *Format :* ${prefix}votekick @tag / reply pesan target\n` +
                        `> ◦ *Butuh  :* ${VK_NEED} suara berbeda\n` +
                        `> ◦ *TTL    :* Vote hangus dalam 10 menit`
                    );
                }

                const vkTargetNum = resolveTargetNumber(vkRaw, m);
                if (!vkTargetNum) return Reply('❌ Target tidak ditemukan. Tag atau reply member yang ingin di-vote-kick.');
                const vkTargetJid = vkTargetNum + '@s.whatsapp.net';

                // ── Cek voter tidak vote diri sendiri ──
                const vkVoterNum = (m.sender || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                if (vkVoterNum === vkTargetNum) return Reply('❌ Tidak bisa vote-kick diri sendiri.');

                // ── Ambil metadata grup ──
                let vkMeta;
                try { vkMeta = await shorekeeper.groupMetadata(m.chat); }
                catch { return Reply('❌ Gagal mengambil data grup.'); }

                // ── Cek target ada di grup ──
                const vkTargetInGroup = vkMeta.participants.find(p => {
                    const pNum = String(p.id || p.jid || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                    return pNum === vkTargetNum;
                });
                if (!vkTargetInGroup) return Reply('❌ Target bukan member grup ini.');

                // ── Proteksi: admin, bot, dan owner tidak bisa di-vote-kick ──
                const vkBotNum = botNumber.split(':')[0].replace(/[^0-9]/g, '');
                const vkOwnerNums = [global.owner, ...(loadOwners ? loadOwners() : [])].map(v => String(v).replace(/[^0-9]/g, ''));
                if (vkTargetInGroup.admin != null) return Reply('❌ Admin grup tidak bisa di-vote-kick.');
                if (vkTargetNum === vkBotNum)      return Reply('❌ Bot tidak bisa di-vote-kick.');
                if (vkOwnerNums.includes(vkTargetNum)) return Reply('❌ Owner tidak bisa di-vote-kick.');

                // ── Proses vote ──
                const vkKey = `${m.chat}|${vkTargetNum}`;
                const vkNow = Date.now();
                let vkEntry = global.voteKickData.get(vkKey);

                // Reset kalau TTL habis
                if (!vkEntry || (vkNow - vkEntry.at) > VK_TTL) {
                    vkEntry = { voters: new Set(), at: vkNow };
                }

                if (vkEntry.voters.has(vkVoterNum)) {
                    return Reply(`ℹ️ Kamu sudah vote-kick @${vkTargetNum}.\n> ◦ Suara terkumpul: *${vkEntry.voters.size}/${VK_NEED}*`, [vkTargetJid]);
                }

                vkEntry.voters.add(vkVoterNum);
                global.voteKickData.set(vkKey, vkEntry);

                // Bersihkan entry lama (maks 200)
                if (global.voteKickData.size > 200) {
                    for (const [vkK, vkV] of global.voteKickData) {
                        if ((vkNow - vkV.at) > VK_TTL) global.voteKickData.delete(vkK);
                    }
                }

                // ── Belum cukup suara ──
                if (vkEntry.voters.size < VK_NEED) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '🗳️', key: m.key } }).catch(() => {});
                    return Reply(
                        `🗳️ *Vote-Kick @${vkTargetNum}*\n` +
                        `> ◦ Suara : *${vkEntry.voters.size}/${VK_NEED}*\n` +
                        `> ◦ Ketik *${prefix}votekick @tag* untuk ikut vote.\n` +
                        `> ◦ Vote hangus dalam 10 menit.`,
                        [vkTargetJid]
                    );
                }

                // ── Suara cukup → kick ──
                global.voteKickData.delete(vkKey);

                if (!m.isBotAdmin) {
                    return Reply(`⚠️ Suara sudah cukup (${VK_NEED}/${VK_NEED}), tapi bot bukan admin sehingga tidak bisa mengeluarkan @${vkTargetNum}.`, [vkTargetJid]);
                }

                try {
                    await shorekeeper.groupParticipantsUpdate(m.chat, [vkTargetInGroup.id || vkTargetJid], 'remove');
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    Reply(
                        `👢 *@${vkTargetNum} dikeluarkan lewat VoteKick!*\n` +
                        `> ◦ Terkumpul : *${VK_NEED}/${VK_NEED} suara*\n` +
                        `> ◦ Status    : *Berhasil Dikeluarkan*`,
                        [vkTargetJid]
                    );
                } catch (vkErr) {
                    Reply(`❌ Suara cukup tapi gagal mengeluarkan: ${vkErr.message}`);
                }
            }
            break;

            case "kick": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                if (!m.isBotAdmin) return Reply("❌ Bot harus menjadi admin grup untuk menggunakan perintah ini.");

                let rawUser = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '');
                if (!rawUser) return Reply(example("@mention / reply / nomor"));

                const targetNumber = resolveTargetNumber(rawUser, m);
                if (!targetNumber) return Reply(example("@mention / reply / nomor"));

                const botNumberOnly = botNumber.split(':')[0].replace(/[^0-9]/g, '');
                const ownerNumbers = [global.owner, ...(loadOwners() || [])].map(v => String(v).replace(/[^0-9]/g, ''));
                if (targetNumber === botNumberOnly) return Reply("❌ Bot tidak bisa mengeluarkan dirinya sendiri.");
                if (ownerNumbers.includes(targetNumber)) return Reply("❌ Izin ditolak! Tidak diperbolehkan mengeluarkan owner.");

                const userJid = targetNumber + '@s.whatsapp.net';
                try {
                    await shorekeeper.groupParticipantsUpdate(m.chat, [userJid], 'remove');
                    Reply(`\`⌜ Member Kicked ⌟\`\n> ◦ Target : *@${targetNumber}*\n> ◦ Status : *Berhasil Dikeluarkan*`, [userJid]);
                } catch (e) {
                    Reply("❌ Gagal mengeluarkan anggota. Pastikan bot memiliki hak admin yang cukup.");
                }
            }
            break;

            case "linkgc":
            case "linkgrup":
            case "linkgroup": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isBotAdmin) return Reply(global.mess.botAdmin || "❌ Bot harus menjadi admin grup untuk mengambil link tautan.");

                try {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                    const code = await shorekeeper.groupInviteCode(m.chat);
                    const urlGrup = `https://chat.whatsapp.com/${code}`;
                    const gcName = m.metadata?.subject || "Grup WhatsApp";

                    let caption = `╔─╼═[ ʟɪɴᴋ ɢʀᴜᴘ ]═─፨፦⋆\n`;
                    caption += `│ ❈ ɢʀᴜᴘ : ${gcName}\n`;
                    caption += `│ ❈ ʟɪɴᴋ : ${urlGrup}\n`;
                    caption += `╰┈┈┈┈┈┈┈┈┈⬡`;

                    try {
                        const { Button } = require('./library/baileys-mbuilder/index');
                        const btn = new Button(shorekeeper);
                        btn.setBody(caption)
                           .setFooter(`© ${global.botname || 'Hitoshi MD V1'} • Group Link`)
                           .addCopy('📋 Salin Link', urlGrup)
                           .addUrl('🔗 Buka Tautan', urlGrup);
                        await btn.send(m.chat, { quoted: m });
                    } catch (eBtn) {
                        await shorekeeper.sendMessage(m.chat, { text: caption, matchedText: urlGrup }, { quoted: m });
                    }
                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                } catch (e) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    Reply(`❌ Gagal mengambil link grup: ${e.message}`);
                }
            }
            break;

            case "close":
            case "tutup":
            case "closegc": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                if (!m.isBotAdmin) return Reply(global.mess.botAdmin || "Bot harus menjadi admin untuk menutup grup.");

                try {
                    await shorekeeper.groupSettingUpdate(m.chat, 'announcement');
                    const customMsg = global.db.groups?.[m.chat]?.autoCloseMessage || global.db.groups?.[m.chat]?.closeMessage;
                    let resp = `╔─╼═[ ɢʀᴜᴘ ᴅɪᴛᴜᴛᴜᴘ ]═─፨፦⋆\n│ ❈ ᴍᴏᴅᴇ   : Hanya Admin\n│ ❈ sᴛᴀᴛᴜs : Berhasil Ditutup\n`;
                    if (customMsg) resp += `│ ❈ ɪɴꜰᴏ   : ${customMsg}\n`;
                    resp += `╙────────···`;
                    Reply(resp);
                } catch (e) {
                    Reply(`╔─╼═[ ɢᴀɢᴀʟ ]═─፨፦⋆\n│ ❈ ɪɴꜰᴏ : Gagal menutup grup: ${e.message}\n╙────────···`);
                }
            }
            break;

            case "open":
            case "buka":
            case "opengc": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                if (!m.isBotAdmin) return Reply(global.mess.botAdmin || "Bot harus menjadi admin untuk membuka grup.");

                try {
                    await shorekeeper.groupSettingUpdate(m.chat, 'not_announcement');
                    const customMsg = global.db.groups?.[m.chat]?.autoOpenMessage || global.db.groups?.[m.chat]?.openMessage;
                    let resp = `╔─╼═[ ɢʀᴜᴘ ᴅɪʙᴜᴋᴀ ]═─፨፦⋆\n│ ❈ ᴍᴏᴅᴇ   : Semua Member\n│ ❈ sᴛᴀᴛᴜs : Berhasil Dibuka\n`;
                    if (customMsg) resp += `│ ❈ ɪɴꜰᴏ   : ${customMsg}\n`;
                    resp += `╙────────···`;
                    Reply(resp);
                } catch (e) {
                    Reply(`╔─╼═[ ɢᴀɢᴀʟ ]═─፨፦⋆\n│ ❈ ɪɴꜰᴏ : Gagal membuka grup: ${e.message}\n╙────────···`);
                }
            }
            break;

            case "setopentime":
            case "setopen":
            case "setbuka": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                if (!global.db.groups) global.db.groups = {};
                if (!global.db.groups[m.chat]) global.db.groups[m.chat] = {};
                const group = global.db.groups[m.chat];

                if (!text) {
                    const currentStatus = group.autoOpen ? `Aktif (${group.autoOpenTime || '06:00'} WIB)` : 'Nonaktif';
                    let info = `╔─╼═[ sᴇᴛ ᴏᴘᴇɴ ᴛɪᴍᴇ ]═─፨፦⋆\n`;
                    info += `│ ❈ sᴛᴀᴛᴜs : ${currentStatus}\n`;
                    info += `├┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡\n`;
                    info += `┃ ◈ ᴘᴀɴᴅᴜᴀɴ\n`;
                    info += `│ ❈ .setopentime <HH:MM> [| pesan]\n`;
                    info += `│ ❈ Contoh: .setopentime 06:00\n`;
                    info += `│ ❈ Contoh: .setopentime 06:00 | Selamat pagi grup dibuka\n`;
                    info += `│ ❈ Matikan: .setopentime off\n`;
                    info += `╙────────···`;
                    return Reply(info);
                }

                const input = text.trim();
                if (/^(off|mati|disable)$/i.test(input)) {
                    group.autoOpen = false;
                    group.autoOpenMessage = '';
                    return Reply(`╔─╼═[ sᴇᴛ ᴏᴘᴇɴ ᴛɪᴍᴇ ]═─፨፦⋆\n│ ❈ sᴛᴀᴛᴜs : [ ᴏғғ ]\n│ ❈ ɪɴꜰᴏ   : Jadwal buka otomatis grup telah dimatikan\n╙────────···`);
                }

                let [openJam, ...customMsgArr] = input.split('|');
                openJam = openJam.trim().replace('.', ':');
                const customMsg = customMsgArr.join('|').trim();

                const timeMatch = openJam.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
                if (!timeMatch) {
                    return Reply(`╔─╼═[ ꜰᴏʀᴍᴀᴛ sᴀʟᴀʜ ]═─፨፦⋆\n│ ❈ ꜰᴏʀᴍᴀᴛ : Gunakan jam HH:MM (contoh: 06:00)\n│ ❈ ᴄᴏɴᴛᴏʜ : .setopentime 06:00 | Grup dibuka\n╙────────···`);
                }

                const hours = timeMatch[1].padStart(2, '0');
                const minutes = timeMatch[2];
                const formattedTime = `${hours}:${minutes}`;

                group.autoOpen = true;
                group.autoOpenTime = formattedTime;
                if (customMsg) group.autoOpenMessage = customMsg;

                let resp = `╔─╼═[ sᴇᴛ ᴏᴘᴇɴ ᴛɪᴍᴇ ]═─፨፦⋆\n`;
                resp += `│ ❈ ᴡᴀᴋᴛᴜ  : ${formattedTime} WIB\n`;
                resp += `│ ❈ sᴛᴀᴛᴜs : [ ᴏɴ ] Otomatis\n`;
                if (customMsg) resp += `│ ❈ ᴘᴇsᴀɴ  : ${customMsg}\n`;
                resp += `╙────────···`;
                return Reply(resp);
            }
            break;

            case "setclosetime":
            case "setclose":
            case "settutup": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                if (!global.db.groups) global.db.groups = {};
                if (!global.db.groups[m.chat]) global.db.groups[m.chat] = {};
                const group = global.db.groups[m.chat];

                if (!text) {
                    const currentStatus = group.autoClose ? `Aktif (${group.autoCloseTime || '22:00'} WIB)` : 'Nonaktif';
                    let info = `╔─╼═[ sᴇᴛ ᴄʟᴏsᴇ ᴛɪᴍᴇ ]═─፨፦⋆\n`;
                    info += `│ ❈ sᴛᴀᴛᴜs : ${currentStatus}\n`;
                    info += `├┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡\n`;
                    info += `┃ ◈ ᴘᴀɴᴅᴜᴀɴ\n`;
                    info += `│ ❈ .setclosetime <HH:MM> [| pesan]\n`;
                    info += `│ ❈ Contoh: .setclosetime 22:00\n`;
                    info += `│ ❈ Contoh: .setclosetime 22:00 | Waktunya istirahat grup ditutup\n`;
                    info += `│ ❈ Matikan: .setclosetime off\n`;
                    info += `╙────────···`;
                    return Reply(info);
                }

                const input = text.trim();
                if (/^(off|mati|disable)$/i.test(input)) {
                    group.autoClose = false;
                    group.autoCloseMessage = '';
                    return Reply(`╔─╼═[ sᴇᴛ ᴄʟᴏsᴇ ᴛɪᴍᴇ ]═─፨፦⋆\n│ ❈ sᴛᴀᴛᴜs : [ ᴏғғ ]\n│ ❈ ɪɴꜰᴏ   : Jadwal tutup otomatis grup telah dimatikan\n╙────────···`);
                }

                let [closeJam, ...customMsgArr] = input.split('|');
                closeJam = closeJam.trim().replace('.', ':');
                const customMsg = customMsgArr.join('|').trim();

                const timeMatch = closeJam.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
                if (!timeMatch) {
                    return Reply(`╔─╼═[ ꜰᴏʀᴍᴀᴛ sᴀʟᴀʜ ]═─፨፦⋆\n│ ❈ ꜰᴏʀᴍᴀᴛ : Gunakan jam HH:MM (contoh: 22:00)\n│ ❈ ᴄᴏɴᴛᴏʜ : .setclosetime 22:00 | Grup ditutup\n╙────────···`);
                }

                const hours = timeMatch[1].padStart(2, '0');
                const minutes = timeMatch[2];
                const formattedTime = `${hours}:${minutes}`;

                group.autoClose = true;
                group.autoCloseTime = formattedTime;
                if (customMsg) group.autoCloseMessage = customMsg;

                let resp = `╔─╼═[ sᴇᴛ ᴄʟᴏsᴇ ᴛɪᴍᴇ ]═─፨፦⋆\n`;
                resp += `│ ❈ ᴡᴀᴋᴛᴜ  : ${formattedTime} WIB\n`;
                resp += `│ ❈ sᴛᴀᴛᴜs : [ ᴏɴ ] Otomatis\n`;
                if (customMsg) resp += `│ ❈ ᴘᴇsᴀɴ  : ${customMsg}\n`;
                resp += `╙────────···`;
                return Reply(resp);
            }
            break;

            case "cekjadwal":
            case "jadwalgc":
            case "cekjadwalgc": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!global.db.groups) global.db.groups = {};
                if (!global.db.groups[m.chat]) global.db.groups[m.chat] = {};
                const group = global.db.groups[m.chat];

                const openStr = group.autoOpen ? `${group.autoOpenTime || '06:00'} WIB [ ᴏɴ ]` : '[ ᴏғғ ]';
                const closeStr = group.autoClose ? `${group.autoCloseTime || '00:00'} WIB [ ᴏɴ ]` : '[ ᴏғғ ]';
                const statusGc = m.metadata?.announce ? 'Tertutup (Hanya Admin)' : 'Terbuka (Semua Member)';

                let resp = `╔─╼═[ ᴊᴀᴅᴡᴀʟ ɢʀᴜᴘ ]═─፨፦⋆\n`;
                resp += `│ ❈ ɢʀᴜᴘ   : ${m.metadata?.subject || 'Grup'}\n`;
                resp += `│ ❈ ʙᴜᴋᴀ   : ${openStr}\n`;
                resp += `│ ❈ ᴛᴜᴛᴜᴘ  : ${closeStr}\n`;
                resp += `│ ❈ sᴛᴀᴛᴜs : ${statusGc}\n`;
                if (group.autoOpenMessage) resp += `│ ❈ ᴘᴇsᴀɴ ᴏᴘᴇɴ  : ${group.autoOpenMessage}\n`;
                if (group.autoCloseMessage) resp += `│ ❈ ᴘᴇsᴀɴ ᴄʟᴏsᴇ : ${group.autoCloseMessage}\n`;
                resp += `╙────────···`;
                return Reply(resp);
            }
            break;

            case "resetjadwal":
            case "resetjadwalgc": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);

                if (!global.db.groups) global.db.groups = {};
                if (!global.db.groups[m.chat]) global.db.groups[m.chat] = {};
                const group = global.db.groups[m.chat];

                group.autoOpen = false;
                group.autoOpenMessage = '';
                group.autoClose = false;
                group.autoCloseMessage = '';

                return Reply(`╔─╼═[ ʀᴇsᴇᴛ ᴊᴀᴅᴡᴀʟ ]═─፨፦⋆\n│ ❈ sᴛᴀᴛᴜs : Berhasil Direset\n│ ❈ ɪɴꜰᴏ   : Semua jadwal buka dan tutup grup dinonaktifkan\n╙────────···`);
            }
            break;

            case "closetime": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                if (!m.isBotAdmin) return Reply(global.mess.botAdmin || "Bot harus menjadi admin untuk menutup grup.");

                if (!text || args.length < 2) {
                    return Reply(`╔─╼═[ ᴘᴀɴᴅᴜᴀɴ ᴄʟᴏsᴇ ᴛɪᴍᴇ ]═─፨፦⋆\n│ ❈ ꜰᴏʀᴍᴀᴛ : .closetime <waktu> <unit>\n│ ❈ ᴜɴɪᴛ   : detik / menit / jam / hari\n│ ❈ ᴄᴏɴᴛᴏʜ : .closetime 10 menit\n╙────────···`);
                }

                const waktu = parseInt(args[0]);
                const unit = args[1].toLowerCase();

                if (isNaN(waktu) || waktu <= 0) {
                    return Reply(`╔─╼═[ ᴘᴇʀɪɴɢᴀᴛᴀɴ ]═─፨፦⋆\n│ ❈ ɪɴꜰᴏ : Waktu harus berupa angka positif!\n╙────────···`);
                }

                let timer;
                if (unit === 'detik' || unit === 'second' || unit === 's') timer = waktu * 1000;
                else if (unit === 'menit' || unit === 'minute' || unit === 'm') timer = waktu * 60000;
                else if (unit === 'jam' || unit === 'hour' || unit === 'h') timer = waktu * 3600000;
                else if (unit === 'hari' || unit === 'day' || unit === 'd') timer = waktu * 86400000;
                else {
                    return Reply(`╔─╼═[ ᴘᴇʀɪɴɢᴀᴛᴀɴ ]═─፨፦⋆\n│ ❈ ɪɴꜰᴏ : Unit waktu salah! Pilih detik/menit/jam/hari\n╙────────···`);
                }

                await Reply(`╔─╼═[ ᴄʟᴏsᴇ ᴛɪᴍᴇ ]═─፨፦⋆\n│ ❈ ᴅᴜʀᴀsɪ : ${waktu} ${unit}\n│ ❈ sᴛᴀᴛᴜs : Timer Berjalan\n│ ❈ ɪɴꜰᴏ   : Grup akan ditutup otomatis saat waktu habis\n╙────────···`);

                setTimeout(async () => {
                    try {
                        await shorekeeper.groupSettingUpdate(m.chat, 'announcement');
                        const nowWib = moment().tz('Asia/Jakarta').format('HH:mm') + ' WIB';
                        const customMsg = global.db.groups[m.chat]?.autoCloseMessage;
                        let endMsg = `╔─╼═[ ɢʀᴜᴘ ᴅɪᴛᴜᴛᴜᴘ ]═─፨፦⋆\n│ ❈ ᴍᴏᴅᴇ   : Hanya Admin\n│ ❈ sᴛᴀᴛᴜs : Ditutup Otomatis oleh Sistem\n│ ❈ ᴡᴀᴋᴛᴜ  : ${nowWib}\n`;
                        if (customMsg) endMsg += `│ ❈ ɪɴꜰᴏ   : ${customMsg}\n`;
                        endMsg += `╙────────···`;
                        await shorekeeper.sendMessage(m.chat, { text: endMsg });
                    } catch (error) {
                        await Reply(`╔─╼═[ ɢᴀɢᴀʟ ]═─፨፦⋆\n│ ❈ ɪɴꜰᴏ : Gagal menutup grup otomatis. Pastikan bot masih admin.\n╙────────···`);
                    }
                }, timer);
            }
            break;

            case "opentime": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                if (!m.isBotAdmin) return Reply(global.mess.botAdmin || "Bot harus menjadi admin untuk membuka grup.");

                if (!text || args.length < 2) {
                    return Reply(`╔─╼═[ ᴘᴀɴᴅᴜᴀɴ ᴏᴘᴇɴ ᴛɪᴍᴇ ]═─፨፦⋆\n│ ❈ ꜰᴏʀᴍᴀᴛ : .opentime <waktu> <unit>\n│ ❈ ᴜɴɪᴛ   : detik / menit / jam / hari\n│ ❈ ᴄᴏɴᴛᴏʜ : .opentime 10 menit\n╙────────···`);
                }

                const waktu = parseInt(args[0]);
                const unit = args[1].toLowerCase();

                if (isNaN(waktu) || waktu <= 0) {
                    return Reply(`╔─╼═[ ᴘᴇʀɪɴɢᴀᴛᴀɴ ]═─፨፦⋆\n│ ❈ ɪɴꜰᴏ : Waktu harus berupa angka positif!\n╙────────···`);
                }

                let timer;
                if (unit === 'detik' || unit === 'second' || unit === 's') timer = waktu * 1000;
                else if (unit === 'menit' || unit === 'minute' || unit === 'm') timer = waktu * 60000;
                else if (unit === 'jam' || unit === 'hour' || unit === 'h') timer = waktu * 3600000;
                else if (unit === 'hari' || unit === 'day' || unit === 'd') timer = waktu * 86400000;
                else {
                    return Reply(`╔─╼═[ ᴘᴇʀɪɴɢᴀᴛᴀɴ ]═─፨፦⋆\n│ ❈ ɪɴꜰᴏ : Unit waktu salah! Pilih detik/menit/jam/hari\n╙────────···`);
                }

                await Reply(`╔─╼═[ ᴏᴘᴇɴ ᴛɪᴍᴇ ]═─፨፦⋆\n│ ❈ ᴅᴜʀᴀsɪ : ${waktu} ${unit}\n│ ❈ sᴛᴀᴛᴜs : Timer Berjalan\n│ ❈ ɪɴꜰᴏ   : Grup akan dibuka otomatis saat waktu habis\n╙────────···`);

                setTimeout(async () => {
                    try {
                        await shorekeeper.groupSettingUpdate(m.chat, 'not_announcement');
                        const nowWib = moment().tz('Asia/Jakarta').format('HH:mm') + ' WIB';
                        const customMsg = global.db.groups[m.chat]?.autoOpenMessage;
                        let endMsg = `╔─╼═[ ɢʀᴜᴘ ᴅɪʙᴜᴋᴀ ]═─፨፦⋆\n│ ❈ ᴍᴏᴅᴇ   : Semua Member\n│ ❈ sᴛᴀᴛᴜs : Dibuka Otomatis oleh Sistem\n│ ❈ ᴡᴀᴋᴛᴜ  : ${nowWib}\n`;
                        if (customMsg) endMsg += `│ ❈ ɪɴꜰᴏ   : ${customMsg}\n`;
                        endMsg += `╙────────···`;
                        await shorekeeper.sendMessage(m.chat, { text: endMsg });
                    } catch (error) {
                        await Reply(`╔─╼═[ ɢᴀɢᴀʟ ]═─፨፦⋆\n│ ❈ ɪɴꜰᴏ : Gagal membuka grup otomatis. Pastikan bot masih admin.\n╙────────···`);
                    }
                }, timer);
            }
            break;

            case "group":
            case "grup": {
                if (!m.isGroup) return Reply(global.mess.group);
                if (!m.isAdmin && !isCreator) return Reply(global.mess.admin);
                if (!m.isBotAdmin) return Reply(global.mess.botAdmin || "❌ Bot harus menjadi admin grup untuk menggunakan perintah ini.");
                
                let action = args[0]?.toLowerCase();
                if (action === 'open' || action === 'buka') {
                    try {
                        await shorekeeper.groupSettingUpdate(m.chat, 'not_announcement');
                        Reply(`╔─╼═[ ɢʀᴜᴘ ᴅɪʙᴜᴋᴀ ]═─፨፦⋆\n│ ❈ ᴍᴏᴅᴇ   : Semua Member\n│ ❈ sᴛᴀᴛᴜs : Berhasil Dibuka\n│ ❈ ɪɴꜰᴏ   : Semua peserta dapat mengirim pesan\n╙────────···`);
                    } catch (e) {
                        Reply(`╔─╼═[ ɢᴀɢᴀʟ ]═─፨፦⋆\n│ ❈ ɪɴꜰᴏ : Gagal membuka grup: ${e.message}\n╙────────···`);
                    }
                } else if (action === 'close' || action === 'tutup') {
                    try {
                        await shorekeeper.groupSettingUpdate(m.chat, 'announcement');
                        Reply(`╔─╼═[ ɢʀᴜᴘ ᴅɪᴛᴜᴛᴜᴘ ]═─፨፦⋆\n│ ❈ ᴍᴏᴅᴇ   : Hanya Admin\n│ ❈ sᴛᴀᴛᴜs : Berhasil Ditutup\n│ ❈ ɪɴꜰᴏ   : Hanya admin yang dapat mengirim pesan\n╙────────···`);
                    } catch (e) {
                        Reply(`╔─╼═[ ɢᴀɢᴀʟ ]═─፨፦⋆\n│ ❈ ɪɴꜰᴏ : Gagal menutup grup: ${e.message}\n╙────────···`);
                    }
                } else {
                    Reply(`╔─╼═[ ᴘᴀɴᴅᴜᴀɴ ]═─፨፦⋆\n│ ❈ .group open\n│ ❈ .group close\n╙────────···`);
                }
            }
            break;

            case "addbadword": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!text) return Reply(example("<kata>"));
                
                const badwords = loadBadwords();
                const newWord = text.toLowerCase().trim();
                if (badwords.words.includes(newWord)) return Reply(`❌ Kata "${newWord}" sudah terdaftar.`);
                
                badwords.words.push(newWord);
                saveBadwords(badwords);
                Reply(`\`⌜ Badword Added ⌟\`\n> ◦ Kata : *${newWord}*\n> ◦ Status : *Berhasil Ditambahkan*`);
            }
            break;

            case "delbadword": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!text) return Reply(example("<kata>"));
                
                const badwords = loadBadwords();
                const wordToDelete = text.toLowerCase().trim();
                if (!badwords.words.includes(wordToDelete)) return Reply(`❌ Kata "${wordToDelete}" tidak ditemukan.`);
                
                badwords.words = badwords.words.filter(w => w !== wordToDelete);
                saveBadwords(badwords);
                Reply(`\`⌜ Badword Deleted ⌟\`\n> ◦ Kata : *${wordToDelete}*\n> ◦ Status : *Berhasil Dihapus*`);
            }
            break;

            case "listbadword": {
                const badwords = loadBadwords();
                if (badwords.words.length === 0) return Reply('📭 Belum ada kata kasar yang terdaftar.');
                Reply(`📋 *Daftar Badwords (${badwords.words.length} kata):*\n\n${badwords.words.map((w, i) => `${i+1}. ${w}`).join('\n')}`);
            }
            break;

            case "addsewa":
            case "renewsewa": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!text) return Reply(example("<jumlah hari> atau <link gc> <jumlah hari>"));

                let groupId, groupName, days;
                let joinStatus = "✅ Sudah di dalam grup";

                if (args[0] && args[0].includes('chat.whatsapp.com')) {
                    const link = args[0];
                    days = parseInt(args[1]);

                    if (isNaN(days)) return Reply(`❌ Masukkan jumlah hari!`);

                    const inviteCode = link.split("chat.whatsapp.com/")[1].split("?")[0];

                    try {
                        try {
                            const res = await shorekeeper.groupAcceptInvite(inviteCode);
                            groupId = res;
                            joinStatus = "✅ Berhasil join via link";
                        } catch (e) {
                            const meta = await shorekeeper.groupGetInviteInfo(inviteCode);
                            groupId = meta.id;
                            joinStatus = "⏳ Pending (Tautan valid, bot akan join jika di-approve)";
                        }
                    } catch (e) {
                        return Reply(`❌ Link tidak valid atau bot tidak bisa mengakses info grup.`);
                    }
                } else if (!isNaN(parseInt(args[0]))) {
                    if (!m.isGroup) return Reply(global.mess.group);
                    days = parseInt(args[0]);
                    groupId = m.chat;
                } else {
                    return Reply(example("<jumlah hari> atau <link gc> <jumlah hari>"));
                }

                try {
                    const meta = await shorekeeper.groupMetadata(groupId);
                    groupName = meta.subject;
                } catch (e) {
                    groupName = "Grup Tidak Dikenal";
                }

                let sewagrup = JSON.parse(fs.readFileSync(sewaPath));
                const now = Date.now();
                const durationMs = days * 24 * 60 * 60 * 1000;

                const existing = sewagrup.find(v => v.jid === groupId);
                let expiredDate;

                if (existing) {
                    if (existing.expired > now) {
                        existing.expired += durationMs;
                    } else {
                        existing.expired = now + durationMs;
                    }
                    existing.warningSent = false;
                    expiredDate = existing.expired;
                } else {
                    expiredDate = now + durationMs;
                    sewagrup.push({
                        jid: groupId,
                        expired: expiredDate,
                        warningSent: false
                    });
                }

                fs.writeFileSync(sewaPath, JSON.stringify(sewagrup, null, 2));

                try {
                    const notified = getSewaNotified();
                    if (notified[groupId]) {
                        delete notified[groupId];
                        saveSewaNotified(notified);
                    }
                } catch (e) {}

                const expiredFormat = new Date(expiredDate).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const teksSewa = `\`⌜ Sewa Group ⌟\`\n> ◦ Grup : *${groupName}*\n> ◦ Durasi : *${days} Hari*\n> ◦ Expired : *${expiredFormat}*\n> ◦ Status : *Berhasil ${existing ? 'Diperpanjang' : 'Ditambahkan'}*`;
                Reply(teksSewa);
            }
            break;

            case "delsewa": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!text) return Reply(example("<jid/link gc>"));

                let targetJid = '';

                if (text.includes('chat.whatsapp.com')) {
                    try {
                        const groupInviteCode = text.split('/').pop().split('?')[0];
                        const info = await shorekeeper.groupGetInviteInfo(groupInviteCode);
                        targetJid = info.id;
                    } catch (e) {
                        return Reply(`❌ Link grup tidak valid.`);
                    }
                } else {
                    targetJid = text.replace(/[^0-9@g.us]/g, '');
                    if (!targetJid.endsWith('@g.us')) {
                        targetJid += '@g.us';
                    }
                }

                let sewagrup = JSON.parse(fs.readFileSync(sewaPath));
                const initialLength = sewagrup.length;

                sewagrup = sewagrup.filter(v => v.jid !== targetJid);

                if (sewagrup.length === initialLength) {
                    return Reply(`❌ Grup dengan ID tersebut tidak ditemukan dalam database sewa.`);
                }

                fs.writeFileSync(sewaPath, JSON.stringify(sewagrup, null, 2));

                try {
                    const notified = getSewaNotified();
                    if (notified[targetJid]) {
                        delete notified[targetJid];
                        saveSewaNotified(notified);
                    }
                } catch (e) {}

                let groupName = targetJid;
                try {
                    const groupMetadata = await shorekeeper.groupMetadata(targetJid);
                    groupName = groupMetadata.subject || targetJid;
                } catch (e) {}

                Reply(`\`⌜ Sewa Deleted ⌟\`\n> ◦ Grup : *${groupName}*\n> ◦ Status : *Berhasil Dihapus*`);
            }
            break;

            case "listsewa": {
                if (!isCreator) return Reply(global.mess.owner);

                let sewagrup = JSON.parse(fs.readFileSync(sewaPath));
                const now = Date.now();

                const activeSewa = sewagrup.filter(v => now <= v.expired);

                if (activeSewa.length === 0) {
                    return Reply(`\`⌜ Daftar Sewa ⌟\`\n> ◦ Status : *Kosong*\n> ◦ Info : *Belum ada grup yang menyewa bot*`);
                }

                let teks = `\`⌜ Daftar Sewa Bot ⌟\`\n> ◦ Total : *${activeSewa.length} Grup Aktif*\n\n`;

                for (let i = 0; i < activeSewa.length; i++) {
                    const data = activeSewa[i];
                    let groupName = data.jid;
                    try {
                        const meta = await shorekeeper.groupMetadata(data.jid);
                        groupName = meta.subject || data.jid;
                    } catch (e) {}

                    const sisaMs = data.expired - now;
                    const days = Math.floor(sisaMs / (24 * 60 * 60 * 1000));
                    const hours = Math.floor((sisaMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

                    const expiredFormat = new Date(data.expired).toLocaleDateString('id-ID', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                    });

                    teks += `*${i+1}.* ${groupName}\n> ◦ Expired : *${expiredFormat}* (${days}h ${hours}j)\n\n`;
                }

                Reply(teks);
            }
            break;

            
            
            
            
            
            
            
            
            
            case "self": {
                if (!isCreator) return Reply(global.mess.owner);
                shorekeeper.public = false;
                global.db.settings.isPublic = false;
                Reply(`\`⌜ Mode Settings ⌟\`\n> ◦ Status : *Self*\n> ◦ Info : *Hanya owner yang dapat menggunakan bot*`);
            }
            break;

            case "public": {
                if (!isCreator) return Reply(global.mess.owner);
                shorekeeper.public = true;
                global.db.settings.isPublic = true;
                Reply(`\`⌜ Mode Settings ⌟\`\n> ◦ Status : *Public*\n> ◦ Info : *Semua orang dapat menggunakan bot*`);
            }
            break;

            // ==================== GETSC & GETFILE ====================

            case "getsc": {
                const ownerJid = (global.owner || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                const isOwnerCheck = isCreator || m.sender === ownerJid || m.key.fromMe;
                if (!isOwnerCheck) return Reply(global.mess.owner);

                const target = text ? text.trim().toLowerCase() : '';

                const junkFolderNames = [
                    'node_modules', '.git', '.github', '.vscode', '.idea',
                    'sessions', 'session', 'sesi', 'auth', 'auth_info', 'auth_info_baileys', 'baileys_auth_info',
                    'tmp', 'temp', 'cache', '.cache', '.npm',
                    'logs', 'log', 'sampah', 'backup', 'backups',
                    'store', 'stores', 'output', 'outputs', 'dist', 'build', 'coverage', '.next'
                ];

                const junkFileNames = [
                    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
                    '.ds_store', 'npm-debug.log', 'creds.json', '.npmrc'
                ];

                const buatBackupZip = () => {
                    const name = (global.botname2 || global.botname || 'diezy_sc').replace(/[^a-zA-Z0-9_-]/g, '_');
                    const zipName = `${name}.zip`;
                    const zipPath = path.join(process.cwd(), zipName);

                    const items = fs.readdirSync(process.cwd())
                        .filter(pe => !junkFolderNames.some(ex => ex.toLowerCase() === pe.toLowerCase()))
                        .filter(pe => !junkFileNames.some(ex => ex.toLowerCase() === pe.toLowerCase()))
                        .filter(pe => !pe.toLowerCase().endsWith('.zip'))
                        .filter(pe => !pe.toLowerCase().endsWith('.log'))
                        .filter(pe => !/\.(tgz|tar\.gz|gz)$/i.test(pe));

                    if (items.length === 0) throw new Error('Tidak ada file untuk di-backup');

                    const quotedItems = items.map(i => `"${i.replace(/"/g, '\\"')}"`).join(' ');
                    const staticExclude = [
                        '*/node_modules/*', '*/.git/*', '*/session/*', '*/sessions/*',
                        'library/database/sessions/*', 'library/database/sampah/*',
                        '*.tar.gz', '*.tgz', '*.gz', '*.log', '*.zip', '*creds.json*'
                    ].map(p => `-x "${p}"`).join(' ');

                    const { execSync } = require('child_process');
                    execSync(`zip -r -q -9 "${zipPath}" ${quotedItems} ${staticExclude}`, {
                        cwd: process.cwd(),
                        maxBuffer: 1024 * 1024 * 100
                    });

                    if (!fs.existsSync(zipPath)) throw new Error('Gagal membuat file zip backup');
                    return { name, zipPath };
                };

                const getZipSizeMB = (zipPath) => {
                    if (!fs.existsSync(zipPath)) return 0;
                    return fs.statSync(zipPath).size / (1024 * 1024);
                };

                const hapusZip = (zipPath) => {
                    try { if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath); } catch (_) {}
                };

                const kirimKeWA = async (jid, zipPath, name) => {
                    await shorekeeper.sendMessage(jid, {
                        document: fs.readFileSync(zipPath),
                        fileName: `${name}.zip`,
                        mimetype: "application/zip",
                        caption: `╔─╼═[ sᴏᴜʀᴄᴇ ᴄᴏᴅᴇ ʙᴏᴛ ]═─፨፦⋆\n│ ❈ ʙᴏᴛ    : ${global.botname || 'Hitoshi MD V1'}\n│ ❈ ᴠᴇʀsɪ  : ${global.versi || '1.0.0'}\n│ ❈ ᴏᴡɴᴇʀ  : ${global.namaOwner || 'Owner'}\n│ ❈ ᴡᴀᴋᴛᴜ  : ${new Date().toLocaleString('id-ID')}\n╰┈┈┈┈┈┈┈┈┈⬡`
                    }, { quoted: m });
                };

                const kirimKeTelegram = async (zipPath, name) => {
                    const sizeMB = getZipSizeMB(zipPath);
                    if (sizeMB > 49) {
                        throw new Error(`Ukuran zip (${sizeMB.toFixed(1)} MB) melebihi batas Telegram (50 MB). Gunakan tujuan 'owner' atau 'sini' untuk mengirim lewat WhatsApp.`);
                    }
                    const FormData = require('form-data');
                    const form = new FormData();
                    form.append('chat_id', global.telegramChatId);
                    form.append('document', fs.createReadStream(zipPath), `${name}.zip`);
                    form.append('caption', `Backup Script Bot\nFile : ${name}.zip\nTanggal : ${moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss')} WIB`);

                    await axios.post(`https://api.telegram.org/bot${global.telegramToken}/sendDocument`, form, {
                        headers: form.getHeaders(),
                        maxBodyLength: Infinity,
                        maxContentLength: Infinity,
                        timeout: 180000
                    });
                };

                if (target === 'grup' || target === 'group' || target === 'gc') {
                    let targetJid = m.isGroup ? m.chat : (global.idgc || '');
                    if (!targetJid) {
                        return Reply(`╔─╼═[ ɢᴇᴛsᴄ ɢᴀɢᴀʟ ]═─፨፦⋆\n│ ❈ ᴘᴇɴʏᴇʙᴀʙ : Bukan di dalam grup dan global.idgc belum diatur di settings.js\n│ ❈ sᴏʟᴜsɪ   : Ketik .getsc sini atau atur global.idgc\n╰┈┈┈┈┈┈┈┈┈⬡`);
                    }
                    await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                    let zipInfo;
                    try {
                        zipInfo = buatBackupZip();
                        const sizeMB = getZipSizeMB(zipInfo.zipPath);
                        await kirimKeWA(targetJid, zipInfo.zipPath, zipInfo.name);
                        await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                        Reply(`╔─╼═[ ɢᴇᴛsᴄ ʙᴇʀʜᴀsɪʟ ]═─፨፦⋆\n│ ❈ ᴛᴜᴊᴜᴀɴ : Grup (${targetJid})\n│ ❈ ꜰɪʟᴇ   : ${zipInfo.name}.zip\n│ ❈ ᴜᴋᴜʀᴀɴ : ${sizeMB.toFixed(2)} MB\n╰┈┈┈┈┈┈┈┈┈⬡`);
                    } catch (e) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        Reply(`╔─╼═[ ɢᴇᴛsᴄ ɢᴀɢᴀʟ ]═─፨፦⋆\n│ ❈ ᴘᴇsᴀɴ  : ${e.message}\n╰┈┈┈┈┈┈┈┈┈⬡`);
                    } finally {
                        if (zipInfo?.zipPath) hapusZip(zipInfo.zipPath);
                    }

                } else if (target === 'telegram' || target === 'tele' || target === 'tg') {
                    if (!global.telegramToken || !global.telegramChatId) {
                        return Reply(`╔─╼═[ ɢᴇᴛsᴄ ɢᴀɢᴀʟ ]═─፨፦⋆\n│ ❈ ᴘᴇɴʏᴇʙᴀʙ : Token / Chat ID Telegram belum diatur\n│ ❈ sᴏʟᴜsɪ   : Isi global.telegramToken & global.telegramChatId di settings.js\n╰┈┈┈┈┈┈┈┈┈⬡`);
                    }
                    await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                    let zipInfo;
                    try {
                        zipInfo = buatBackupZip();
                        const sizeMB = getZipSizeMB(zipInfo.zipPath);
                        await kirimKeTelegram(zipInfo.zipPath, zipInfo.name);
                        await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                        Reply(`╔─╼═[ ɢᴇᴛsᴄ ʙᴇʀʜᴀsɪʟ ]═─፨፦⋆\n│ ❈ ᴛᴜᴊᴜᴀɴ : Telegram\n│ ❈ ꜰɪʟᴇ   : ${zipInfo.name}.zip\n│ ❈ ᴜᴋᴜʀᴀɴ : ${sizeMB.toFixed(2)} MB\n╰┈┈┈┈┈┈┈┈┈⬡`);
                    } catch (e) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        Reply(`╔─╼═[ ɢᴇᴛsᴄ ɢᴀɢᴀʟ ]═─፨፦⋆\n│ ❈ ᴘᴇsᴀɴ  : ${e.message}\n╰┈┈┈┈┈┈┈┈┈⬡`);
                    } finally {
                        if (zipInfo?.zipPath) hapusZip(zipInfo.zipPath);
                    }

                } else if (target === 'pribadi' || target === 'private' || target === 'owner' || target === 'dm') {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                    let zipInfo;
                    try {
                        zipInfo = buatBackupZip();
                        const sizeMB = getZipSizeMB(zipInfo.zipPath);
                        await kirimKeWA(ownerJid, zipInfo.zipPath, zipInfo.name);
                        await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                        Reply(`╔─╼═[ ɢᴇᴛsᴄ ʙᴇʀʜᴀsɪʟ ]═─፨፦⋆\n│ ❈ ᴛᴜᴊᴜᴀɴ : DM Owner (${global.namaOwner || 'Owner'})\n│ ❈ ꜰɪʟᴇ   : ${zipInfo.name}.zip\n│ ❈ ᴜᴋᴜʀᴀɴ : ${sizeMB.toFixed(2)} MB\n╰┈┈┈┈┈┈┈┈┈⬡`);
                    } catch (e) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        Reply(`╔─╼═[ ɢᴇᴛsᴄ ɢᴀɢᴀʟ ]═─፨፦⋆\n│ ❈ ᴘᴇsᴀɴ  : ${e.message}\n╰┈┈┈┈┈┈┈┈┈⬡`);
                    } finally {
                        if (zipInfo?.zipPath) hapusZip(zipInfo.zipPath);
                    }

                } else if (target === 'sini' || target === 'disini' || target === 'here' || target === 'chat' || target === 'chatini') {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                    let zipInfo;
                    try {
                        zipInfo = buatBackupZip();
                        const sizeMB = getZipSizeMB(zipInfo.zipPath);
                        await kirimKeWA(m.chat, zipInfo.zipPath, zipInfo.name);
                        await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                        Reply(`╔─╼═[ ɢᴇᴛsᴄ ʙᴇʀʜᴀsɪʟ ]═─፨፦⋆\n│ ❈ ᴛᴜᴊᴜᴀɴ : Chat Ini\n│ ❈ ꜰɪʟᴇ   : ${zipInfo.name}.zip\n│ ❈ ᴜᴋᴜʀᴀɴ : ${sizeMB.toFixed(2)} MB\n╰┈┈┈┈┈┈┈┈┈⬡`);
                    } catch (e) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                        Reply(`╔─╼═[ ɢᴇᴛsᴄ ɢᴀɢᴀʟ ]═─፨፦⋆\n│ ❈ ᴘᴇsᴀɴ  : ${e.message}\n╰┈┈┈┈┈┈┈┈┈⬡`);
                    } finally {
                        if (zipInfo?.zipPath) hapusZip(zipInfo.zipPath);
                    }

                } else {
                    let promptText = `╔─╼═[ ɢᴇᴛsᴄ - ʙᴀᴄᴋᴜᴘ sᴄʀɪᴘᴛ ]═─፨፦⋆\n`;
                    promptText += `│ ❈ ʙᴏᴛ   : ${global.botname || 'Hitoshi MD V1'}\n`;
                    promptText += `│ ❈ ᴏᴡɴᴇʀ : ${global.namaOwner || 'Owner'}\n`;
                    promptText += `├┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡\n`;
                    promptText += `┃ ◈ ᴘɪʟɪʜᴀɴ ᴛᴜᴊᴜᴀɴ :\n`;
                    promptText += `│ ❈ .getsc telegram\n`;
                    promptText += `│ ❈ .getsc grup\n`;
                    promptText += `│ ❈ .getsc sini\n`;
                    promptText += `│ ❈ .getsc owner\n`;
                    promptText += `╙────────···`;

                    try {
                        const { ButtonV2 } = require('./library/baileys-mbuilder/index');
                        const btn2 = new ButtonV2(shorekeeper);
                        btn2.setThumbnail(global.image?.menu || "https://cdn-alip.clutch.web.id/api/u/mvsopxz2.jpg")
                            .setBody(promptText)
                            .setFooter(`© ${global.botname || 'Hitoshi MD V1'} • Backup Tool`)
                            .addRawButton({
                                buttonText: { displayText: '𔕬 ᴘɪʟɪʜ ᴛᴜᴊᴜᴀɴ ʙᴀᴄᴋᴜᴘ' },
                                buttonId: 'getsc_pilihan',
                                type: 1,
                                nativeFlowInfo: {
                                    name: 'single_select',
                                    paramsJson: JSON.stringify({
                                        title: 'Pilih Tujuan Backup',
                                        sections: [{
                                            title: 'Pilihan Pengiriman',
                                            rows: [
                                                { title: 'Kirim ke Telegram', description: 'Kirim backup script ke Telegram Bot', id: `${prefix}getsc telegram` },
                                                { title: 'Kirim ke DM Owner', description: 'Kirim backup script ke DM pribadi owner', id: `${prefix}getsc owner` },
                                                { title: 'Kirim ke Grup', description: 'Kirim backup script ke grup terdaftar', id: `${prefix}getsc grup` },
                                                { title: 'Kirim ke Chat Ini', description: 'Kirim backup script ke chat ini langsung', id: `${prefix}getsc sini` }
                                            ]
                                        }]
                                    })
                                }
                            });
                        await btn2.send(m.chat);
                    } catch (eBtn) {
                        Reply(promptText);
                    }
                }
            }
            break;

            case "getfilehelp": {
                if (!isCreator) return Reply(global.mess.owner);
                const token = text.trim();
                return Reply(`╔─╼═[ ɢᴇᴛғɪʟᴇ ᴛᴜᴊᴜᴀɴ ]═─፨፦⋆\n│ ❈ ᴅᴍ ᴏᴡɴᴇʀ  : ${prefix}getfiledest ${token} owner\n│ ❈ ᴄʜᴀᴛ ɪɴɪ  : ${prefix}getfiledest ${token} chat\n│ ❈ ɢʀᴜᴘ      : ${prefix}getfiledest ${token} group <id>\n│ ❈ ᴅᴍ ɴᴏᴍᴏʀ  : ${prefix}getfiledest ${token} dm <nomor>\n│ ❈ ᴛᴇʟᴇɢʀᴀᴍ  : ${prefix}getfiledest ${token} telegram\n╰┈┈┈┈┈┈┈┈┈⬡`);
            }
            break;

            case "getfiledest": {
                if (!isCreator) return Reply(global.mess.owner);
                return handleGetFileDest(shorekeeper, m, Reply, prefix, text);
            }
            break;

            case "getfile": {
                if (!isCreator) return Reply(global.mess.owner);

                const scanAllFiles = () => {
                    const files = [];
                    const excludeFolders = [
                        'node_modules', '.git', '.github', '.vscode', '.idea',
                        'sessions', 'session', 'auth_info', 'auth_info_baileys',
                        'tmp', 'temp', 'cache', '.cache', '.npm',
                        'logs', 'log', 'sampah', 'backup', 'backups',
                        'store', 'stores', 'output', 'outputs', 'dist', 'build', 'coverage', '.next'
                    ];
                    const excludeFiles = [
                        '.env', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
                        '.ds_store', 'npm-debug.log', 'creds.json'
                    ];
                    const includeExt = [
                        '.js', '.cjs', '.mjs', '.ts', '.json', '.yml', '.yaml',
                        '.html', '.css', '.md', '.txt', '.env.example'
                    ];

                    const walkDir = (dir, baseDir = '') => {
                        try {
                            const items = fs.readdirSync(dir);
                            items.forEach(item => {
                                const fullPath = path.join(dir, item);
                                let stat;
                                try { stat = fs.statSync(fullPath); } catch (e) { return; }
                                const relativePath = baseDir ? `${baseDir}/${item}` : item;

                                if (stat.isDirectory()) {
                                    if (excludeFolders.some(ex => item.toLowerCase() === ex.toLowerCase())) return;
                                    walkDir(fullPath, relativePath);
                                } else {
                                    if (excludeFiles.some(ex => item.toLowerCase() === ex.toLowerCase())) return;
                                    const ext = path.extname(item).toLowerCase();
                                    if (!includeExt.includes(ext)) return;
                                    const fileSize = (stat.size / 1024).toFixed(2);
                                    files.push({
                                        path: fullPath,
                                        name: relativePath,
                                        size: `${fileSize} KB`,
                                        fullName: `${relativePath} (${fileSize} KB)`
                                    });
                                }
                            });
                        } catch (err) {}
                    };
                    walkDir(process.cwd());
                    return files.sort((a, b) => a.name.localeCompare(b.name));
                };

                const allFiles = scanAllFiles();
                if (allFiles.length === 0) return Reply('📭 Tidak ada file yang ditemukan.');

                const raw = (text || '').trim();
                let targetFile = null;
                let destination = null;

                if (raw.includes('|')) {
                    const parts = raw.split('|').map(s => s.trim());
                    const namePart = parts[0];
                    destination = parts[1]?.toLowerCase();
                    targetFile = allFiles.find(f => f.name === namePart) ||
                                 allFiles.find(f => path.basename(f.name) === namePart) ||
                                 allFiles.find(f => f.name.toLowerCase().includes(namePart.toLowerCase()));
                    if (targetFile && destination) {
                        const token = Buffer.from(targetFile.name).toString('base64url');
                        await shorekeeper.sendMessage(m.chat, {
                            text: `⏳ Mengirim file *${targetFile.name}* ke *${destination.toUpperCase()}*...`
                        }, { quoted: m });
                        try {
                            return await handleGetFileDest(shorekeeper, m, Reply, prefix, `${token} ${destination}`);
                        } catch (e) {
                            return Reply(`❌ Gagal mengirim file ke ${destination}: ${e.message}\nCoba manual: ${prefix}getfiledest ${token} ${destination}`);
                        }
                    }
                }

                if (raw && !raw.startsWith('b64:')) {
                    targetFile = allFiles.find(f => f.name === raw) ||
                                 allFiles.find(f => path.basename(f.name) === raw) ||
                                 allFiles.find(f => f.name.toLowerCase().includes(raw.toLowerCase()));
                }

                if (targetFile) {
                    const token = Buffer.from(targetFile.name).toString('base64url');
                    const fileName = targetFile.name;
                    const fileSize = targetFile.size;

                    let sendPrompt = `╔─╼═[ ɢᴇᴛғɪʟᴇ ᴛᴜᴊᴜᴀɴ ]═─፨፦⋆\n`;
                    sendPrompt += `│ ❈ ғɪʟᴇ   : ${fileName}\n`;
                    sendPrompt += `│ ❈ ᴜᴋᴜʀᴀɴ : ${fileSize}\n`;
                    sendPrompt += `├┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⬡\n`;
                    sendPrompt += `┃ ◈ ᴘɪʟɪʜ ᴛᴜᴊᴜᴀɴ ᴘᴇɴɢɪʀɪᴍᴀɴ :\n`;
                    sendPrompt += `│ ❈ ${prefix}getfiledest ${token} chat\n`;
                    sendPrompt += `│ ❈ ${prefix}getfiledest ${token} owner\n`;
                    sendPrompt += `│ ❈ ${prefix}getfiledest ${token} group\n`;
                    sendPrompt += `│ ❈ ${prefix}getfiledest ${token} telegram\n`;
                    sendPrompt += `╙────────···`;

                    try {
                        const { ButtonV2 } = require('./library/baileys-mbuilder/index');
                        const btn = new ButtonV2(shorekeeper);
                        btn.setThumbnail(global.image?.menu || "https://cdn-alip.clutch.web.id/api/u/mvsopxz2.jpg")
                           .setBody(sendPrompt)
                           .setFooter(`Bot: ${global.botname || 'Hitoshi MD V1'}`)
                           .addRawButton({
                               buttonText: { displayText: '𔕬 ᴘɪʟɪʜ ᴛᴜᴊᴜᴀɴ ᴋɪʀɪᴍ' },
                               buttonId: 'getfile_pilihan',
                               type: 1,
                               nativeFlowInfo: {
                                   name: 'single_select',
                                   paramsJson: JSON.stringify({
                                       title: 'Tujuan Kirim File',
                                       sections: [{
                                           title: 'Pilih salah satu tujuan',
                                           rows: [
                                               { title: 'Kirim ke Chat Ini', description: 'Kirim file ke chat ini langsung', id: `${prefix}getfiledest ${token} chat` },
                                               { title: 'Kirim ke Pribadi Owner', description: 'Kirim file ke chat pribadi owner', id: `${prefix}getfiledest ${token} owner` },
                                               { title: 'Kirim ke Telegram', description: 'Kirim file ke bot Telegram', id: `${prefix}getfiledest ${token} telegram` },
                                               { title: 'Kirim ke Grup Terdaftar', description: 'Kirim file ke grup yang sudah diatur', id: `${prefix}getfiledest ${token} group` }
                                           ]
                                       }]
                                   })
                               }
                           });
                        await btn.send(m.chat);
                    } catch (eBtn) {
                        Reply(sendPrompt);
                    }
                    return;
                }

                // If no file given, display interactive single_select or paginated list
                const MAX_ROWS = 100;
                const displayFiles = allFiles.slice(0, MAX_ROWS);
                const rows = displayFiles.map(file => ({
                    title: file.name.length > 50 ? file.name.slice(0, 47) + '...' : file.name,
                    description: `${file.size}`,
                    id: `${prefix}getfile ${file.name}`
                }));

                let listPrompt = `╔─╼═[ ɢᴇᴛғɪʟᴇ sᴏᴜʀᴄᴇ ]═─፨፦⋆\n`;
                listPrompt += `│ ❈ ᴛᴏᴛᴀʟ ғɪʟᴇ : ${allFiles.length}\n`;
                listPrompt += `│ ❈ ᴄᴏɴᴛᴏʜ     : ${prefix}getfile index.js | sini\n`;
                listPrompt += `│ ❈ ᴛᴜᴊᴜᴀɴ     : sini / owner / grup / telegram\n`;
                listPrompt += `╙────────···`;

                try {
                    const { ButtonV2 } = require('./library/baileys-mbuilder/index');
                    const btnList = new ButtonV2(shorekeeper);
                    btnList.setThumbnail(global.image?.menu || "https://cdn-alip.clutch.web.id/api/u/mvsopxz2.jpg")
                        .setBody(listPrompt)
                        .setFooter(`Bot: ${global.botname || 'Hitoshi MD V1'}`)
                        .addRawButton({
                            buttonText: { displayText: '𔕬 ᴘɪʟɪʜ ғɪʟᴇ' },
                            buttonId: 'getfile_list',
                            type: 1,
                            nativeFlowInfo: {
                                name: 'single_select',
                                paramsJson: JSON.stringify({
                                    title: 'Daftar File Project',
                                    sections: [{
                                        title: `Pilih File (${rows.length} dari ${allFiles.length})`,
                                        rows: rows
                                    }]
                                })
                            }
                        });
                    await btnList.send(m.chat);
                } catch (eBtn) {
                    Reply(listPrompt);
                }
            }
            break;

            case "setimg":
            case "setimage":
            case "setimgmenu": {
                if (!isCreator) return Reply(global.mess.owner);

                const splitted = text.trim().split(' ');
                let type = splitted[0]?.toLowerCase();

                // if invoked as setimgmenu directly without arg, default type to 'menu'
                if (command === 'setimgmenu' && (!type || !['menu', 'reply', 'menuvideo', 'menuv3', 'iconinv', 'qris'].includes(type))) {
                    type = 'menu';
                }

                const validTypes = ['menu', 'reply', 'menuvideo', 'menuv3', 'iconinv', 'qris'];

                if (!type || !validTypes.includes(type)) {
                    return Reply(`Contoh:\n${prefix}setimg menu\n${prefix}setimg reply\n${prefix}setimg menuv3\n${prefix}setimg menuvideo\n${prefix}setimg iconinv\n${prefix}setimg qris\n\nReply gambar/video dengan caption tersebut\n\n*iconinv* = icon bulat default di kartu struk invoice\n*qris* = ganti gambar QRIS donasi/pembayaran (global.image.qris)`);
                }

                const qTarget = m.quoted ? m.quoted : m;
                const quotedMime = qTarget.msg?.mimetype || qTarget.mimetype || '';

                if (type === 'iconinv') {
                    if (!/image/.test(quotedMime)) {
                        return Reply(`Reply gambar dengan caption: ${prefix}setimg iconinv`);
                    }

                    try {
                        await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                        const buffer = await (m.quoted ? m.quoted.download() : m.download());
                        const uploadResult = await uploadToCDN(buffer, 'image/jpeg');

                        if (!uploadResult) {
                            await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                            return Reply('Gagal upload gambar ke CDN');
                        }

                        const iconDb = loadInvoiceIconDb();
                        iconDb.default = uploadResult;
                        saveInvoiceIconDb(iconDb);

                        global.invoiceLogo = global.invoiceLogo || {};
                        global.invoiceLogo.default = uploadResult;

                        await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                        return Reply(`✅ Berhasil set icon default kartu struk invoice.\n\nIcon ini otomatis dipakai untuk user yang tidak punya foto profil WA.`);
                    } catch (error) {
                        console.error('Setimg iconinv error:', error);
                        await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                        return Reply('Terjadi error saat menyimpan icon invoice');
                    }
                }

                if (type === 'menuvideo') {
                    if (!/video/.test(quotedMime)) {
                        return Reply(`Reply video (max 10 detik) dengan caption: ${prefix}setimg menuvideo`);
                    }

                    try {
                        await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                        const buffer = await (m.quoted ? m.quoted.download() : m.download());
                        const videoPath = './source/media/menuv2.mp4';
                        const vDir = path.dirname(videoPath);
                        if (!fs.existsSync(vDir)) fs.mkdirSync(vDir, { recursive: true });

                        fs.writeFileSync(videoPath, buffer);

                        await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                        return Reply('✅ Berhasil mengganti video menu (menuv2.mp4)');
                    } catch (error) {
                        console.error('Setimg menuvideo error:', error);
                        await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                        return Reply('❌ Gagal mengganti video menu');
                    }
                }

                // Image types: menu, reply, menuv3, qris
                if (!/image/.test(quotedMime) && !(splitted[1] && splitted[1].startsWith('http'))) {
                    return Reply(`Reply gambar dengan caption: ${prefix}setimg ${type}\nAtau: ${prefix}setimg ${type} <url_gambar>`);
                }

                try {
                    await shorekeeper.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
                    let uploadResult;
                    let imgBuffer;

                    if (splitted[1] && splitted[1].startsWith('http')) {
                        uploadResult = splitted[1].trim();
                        try {
                            const resImg = await axios.get(uploadResult, { responseType: 'arraybuffer', timeout: 15000 });
                            imgBuffer = Buffer.from(resImg.data);
                        } catch (e) {}
                    } else {
                        imgBuffer = await (m.quoted ? m.quoted.download() : m.download());
                        uploadResult = await uploadToCDN(imgBuffer, 'image/jpeg');
                    }

                    if (!uploadResult) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                        return Reply('Gagal upload gambar ke CDN');
                    }

                    const settingsPath = './settings.js';
                    if (!fs.existsSync(settingsPath)) {
                        await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                        return Reply('File settings.js tidak ditemukan');
                    }

                    let settingContent = fs.readFileSync(settingsPath, 'utf8');
                    let regexPattern;
                    let propertyName = type;

                    if (type === 'menu') {
                        regexPattern = /menu:\s*['"][^'"]*['"]/g;
                    } else if (type === 'reply') {
                        regexPattern = /reply:\s*['"][^'"]*['"]/g;
                    } else if (type === 'menuv3') {
                        regexPattern = /menuv3:\s*['"][^'"]*['"]/g;
                    } else if (type === 'qris') {
                        regexPattern = /qris:\s*['"][^'"]*['"]/g;
                    }

                    let newContent;
                    if (regexPattern && regexPattern.test(settingContent)) {
                        newContent = settingContent.replace(regexPattern, `${propertyName}: "${uploadResult}"`);
                    } else if (type === 'qris') {
                        const imageBlockRegex = /(image\s*:\s*\{)/;
                        if (imageBlockRegex.test(settingContent)) {
                            newContent = settingContent.replace(imageBlockRegex, `$1\n\tqris: "${uploadResult}",`);
                        } else {
                            newContent = settingContent;
                        }
                    } else {
                        newContent = settingContent;
                    }

                    fs.writeFileSync(settingsPath, newContent);

                    if (!global.image) global.image = {};
                    global.image[propertyName] = uploadResult;

                    if (type === 'menu') {
                        cachedMenuMainThumbBuf = null;
                        cachedMenuMainThumbSrc = null;
                    }
                    if (type === 'reply') {
                        cachedMenuReplyThumbBuf = null;
                        cachedMenuReplyThumbSrc = null;
                    }

                    if (type === 'qris') {
                        if (!global.payment) global.payment = {};
                        global.payment.qris = uploadResult;
                    }

                    if (type === 'reply') {
                        const thumbPath = "./source/media/foto/imgdokumen.jpg";
                        try {
                            if (imgBuffer && imgBuffer.length) {
                                const jimp = require('jimp');
                                const image = await jimp.read(imgBuffer);
                                image.cover(300, 300);
                                const dir = path.dirname(thumbPath);
                                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                                await image.writeAsync(thumbPath);
                            }
                        } catch (e) {
                            console.error('Error writing imgdokumen.jpg:', e);
                        }
                    }

                    await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
                    return Reply(`✅ Berhasil memperbarui image *${type}* di settings.js:\n${uploadResult}`);
                } catch (error) {
                    console.error('Setimg error:', error);
                    await shorekeeper.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
                    return Reply('Terjadi error saat mengedit file settings.js');
                }
            }
            break;

            case "renamebot": {
                if (!isCreator) return Reply(global.mess.owner);

                const splitted = text.trim().split(' ');
                const settingName = splitted[0];
                const newValue = splitted.slice(1).join(' ').trim();

                if (!settingName || !newValue) {
                    return Reply(
`╭─❏ 𝗥𝗲𝗻𝗮𝗺𝗲 𝗕𝗼𝘁 - 𝗗𝗮𝗳𝘁𝗮𝗿 𝗦𝗲𝘁𝘁𝗶𝗻𝗴
│▣ 1. owner - Nomor WhatsApp owner
│▣ 2. namaOwner - Nama owner
│▣ 3. packname - Packname sticker
│▣ 4. botname - Nama bot
│▣ 5. botname2 - Nama bot alternatif
│▣ 6. linkOwner - Link WhatsApp owner
│▣ 7. linkGrup - Link grup bot
│▣ 8. linkSaluran - Link channel
│▣ 9. idSaluran - ID channel
│▣ 10. namaSaluran - Nama channel
╰──────────❏

📌 *Contoh:*
${prefix}renamebot botname Hitoshi MD V1
${prefix}renamebot owner 6289531204240

💡 *Tips:*
> Pastikan format penulisan benar~`
                    );
                }

                const validSettings = {
                    'owner': 'owner',
                    'namaowner': 'namaOwner',
                    'packname': 'packname',
                    'botname': 'botname',
                    'botname2': 'botname2',
                    'linkowner': 'linkOwner',
                    'linkgrup': 'linkGrup',
                    'linksaluran': 'linkSaluran',
                    'idsaluran': 'idSaluran',
                    'namasaluran': 'namaSaluran'
                };

                const normalizedSetting = settingName.toLowerCase();
                if (!validSettings[normalizedSetting]) {
                    return Reply(
`╭─❏ 𝗥𝗲𝗻𝗮𝗺𝗲 𝗕𝗼𝘁 - 𝗚𝗔𝗚𝗔𝗟
│▣ Alasan : Setting tidak valid
│▣ Input : ${settingName}
│▣ List : Lihat daftar di atas
╰──────────❏

💡 *Tips:*
> Gunakan nama setting yang ada di daftar
> Contoh: botname, owner, packname~`
                    );
                }

                const actualSettingName = validSettings[normalizedSetting];
                let newValueSanitized = newValue;

                if (actualSettingName === 'owner') {
                    const digitsOnly = newValue.replace(/[^0-9]/g, '');
                    if (digitsOnly.length < 8) {
                        return Reply(`╭─❏ 𝗥𝗲𝗻𝗮𝗺𝗲 𝗕𝗼𝘁 - 𝗚𝗔𝗚𝗔𝗟\n│▣ Alasan : Nomor owner tidak valid\n│▣ Input : ${newValue}\n╰──────────❏\n\n💡 *Tips:*\n> Isi hanya angka nomor WhatsApp, contoh: 6289531204240\n> Jangan pakai spasi, tanda "+", atau "@s.whatsapp.net"~`);
                    }
                    newValueSanitized = digitsOnly;
                }

                try {
                    const settingsPath = './settings.js';
                    if (!fs.existsSync(settingsPath)) {
                        return Reply(`╭─❏ 𝗥𝗲𝗻𝗮𝗺𝗲 𝗕𝗼𝘁 - 𝗚𝗔𝗚𝗔𝗟\n│▣ Alasan : File settings.js tidak ditemukan\n╰──────────❏`);
                    }

                    let settingContent = fs.readFileSync(settingsPath, 'utf8');
                    let regex = new RegExp(`^(\\s*global\\.${actualSettingName})\\s*=\\s*['"][^'"]*['"]`, 'm');

                    if (regex.test(settingContent)) {
                        const safeValue = newValueSanitized.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                        const newContent = settingContent.replace(regex, `$1 = "${safeValue}"`);

                        fs.writeFileSync(settingsPath, newContent);

                        global[actualSettingName] = newValueSanitized;

                        await shorekeeper.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});

                        const replyMsg =
`╭─❏ 𝗥𝗲𝗻𝗮𝗺𝗲 𝗕𝗼𝘁 - 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟
│▣ Setting : ${actualSettingName}
│▣ Nilai Baru : "${newValueSanitized}"
╰──────────❏

💡 *Tips:*
> Perubahan akan langsung diterapkan
> Bot akan menggunakan setting baru~`;

                        Reply(replyMsg);

                        delete require.cache[require.resolve('./settings.js')];
                        require('./settings.js');
                    } else {
                        return Reply(
`╭─❏ 𝗥𝗲𝗻𝗮𝗺𝗲 𝗕𝗼𝘁 - 𝗚𝗔𝗚𝗔𝗟
│▣ Alasan : Setting "${actualSettingName}" tidak ditemukan di settings.js
╰──────────❏`
                        );
                    }
                } catch (error) {
                    console.error('Renamebot error:', error);
                    return Reply(`╭─❏ 𝗥𝗲𝗻𝗮𝗺𝗲 𝗕𝗼𝘁 - 𝗚𝗔𝗚𝗔𝗟\n│▣ Alasan : ${error.message}\n╰──────────❏`);
                }
            }
            break;

            case "uimode":
            case "tampilan":
            case "menutext":
            case "menurich": {
                if (!isCreator) return Reply(global.mess.owner);
                const _um = require('./lib/rich/uimode.cjs');
                let _arg = (args[0] || '').toLowerCase();
                if (command === 'menutext') _arg = 'text';
                if (command === 'menurich') _arg = 'rich';
                if (!_arg) {
                    return Reply(`\`⌜ Tampilan Bot ⌟\`\n> ◦ Saat ini : *${_um.get()}*\n\n• ${prefix}menutext → menu teks + banner\n• ${prefix}menurich → menu kartu HTML\n• ${prefix}uimode text / rich`);
                }
                const _set = _um.set(_arg);
                if (!_set) return Reply(`❌ Pilihan tidak valid. Pakai: *text* atau *rich*.\nContoh: ${prefix}uimode text`);
                return Reply(_set === 'text'
                    ? `✅ Tampilan diubah ke *TEXT*.\nKetik ${prefix}menu untuk melihat menu teks dengan banner.`
                    : `✅ Tampilan diubah ke *RICH* (kartu HTML).\nKetik ${prefix}menu untuk mencobanya.`);
            }
            break;

            case "setmenu": {
                if (!isCreator) return Reply(global.mess.owner);

                const validMenuVersions = MENU_STYLE_OPTIONS.map(o => o.id);

                if (!text || !text.trim()) {
                    const currentMenuStyle = getMenuStyle();
                    await sendStylePickerA2UI(shorekeeper, m, {
                        current: currentMenuStyle,
                        options: MENU_STYLE_OPTIONS,
                        title: 'menu style',
                        commandPrefix: '.setmenu'
                    });
                    return;
                }

                let version = text.toLowerCase().trim();
                if (version === 'v9') version = 'v3';
                if (!validMenuVersions.includes(version)) {
                    return Reply(`❌ Versi tidak valid! Gunakan salah satu dari: ${validMenuVersions.join(', ')}.\nKetik ${prefix}setmenu tanpa argumen untuk memilih lewat tombol.`);
                }

                setMenuStyle(version);

                const names = {
                    'v1': 'Interactive Message',
                    'v2': 'Video Menu',
                    'v3': 'Orbit Flow Menu'
                };
                return Reply(`✅ Menu style berhasil diubah ke *${names[version] || version.toUpperCase()}* (${version.toUpperCase()})`);
            }
            break;

            case "setreplystyle":
            case "setreply": {
                if (!isCreator) return Reply(global.mess.owner);

                const validReplyVersions = REPLY_STYLE_OPTIONS.map(o => o.id);

                if (!text || !text.trim()) {
                    const currentReplyStyle = getReplyStyle();
                    await sendStylePickerA2UI(shorekeeper, m, {
                        current: currentReplyStyle,
                        options: REPLY_STYLE_OPTIONS,
                        title: 'reply style',
                        commandPrefix: 'setreplystyle'
                    });
                    return;
                }

                const replyVersion = text.toLowerCase().trim();
                if (!validReplyVersions.includes(replyVersion)) {
                    return Reply(`❌ Versi tidak valid! Gunakan salah satu dari: ${validReplyVersions.join(', ')}.\nKetik ${prefix}setreply tanpa argumen untuk memilih lewat tombol.`);
                }

                setReplyStyle(replyVersion);

                const replyNames = {
                    'v1': 'Link Preview Card',
                    'v2': 'Native Flow',
                    'v3': 'Quoted Order Card',
                    'v4': 'Order Card Besar',
                    'v5': 'Link Card + Order'
                };
                return Reply(`✅ Reply style berhasil diubah ke *${replyNames[replyVersion]}* (${replyVersion.toUpperCase()})`);
            }
            break;

            case "tourl":
            case "touploader": {
                const qTarget = m.quoted ? m.quoted : m;
                let mimeType = qTarget.msg?.mimetype || qTarget.mimetype || "";

                if (!/^(image|video|audio|document)\//.test(mimeType)) {
                    return Reply("⚠️ Khusus Image/Video/Audio/Document! Reply media yang ingin diupload.");
                }

                try {
                    Reply(global.mess?.wait || "Harap tunggu...");
                    const media = await (m.quoted ? m.quoted.download() : m.download());
                    if (!media || !media.length) {
                        return Reply("❌ Gagal mengunduh media.");
                    }

                    const generateFilename = (mime) => {
                        const extMap = {
                            'image/jpeg': 'jpg',
                            'image/jpg': 'jpg',
                            'image/png': 'png',
                            'image/gif': 'gif',
                            'image/webp': 'webp',
                            'video/mp4': 'mp4',
                            'video/3gp': '3gp',
                            'video/quicktime': 'mov',
                            'audio/mpeg': 'mp3',
                            'audio/mp4': 'm4a',
                            'audio/ogg': 'ogg',
                            'application/pdf': 'pdf',
                            'application/zip': 'zip'
                        };
                        const ext = extMap[mime] || mime.split('/')[1] || 'bin';
                        return 'diezy-' + Date.now() + '.' + ext;
                    };

                    const uploadPromises = [
                        uploadTop4Top(media, mimeType, generateFilename),
                        uploadCatbox(media, mimeType, generateFilename),
                        uploadQu(media, mimeType, generateFilename),
                        uploadUguu(media, mimeType, generateFilename),
                        uploadToCDN(media, mimeType)
                    ];

                    const uploadResults = await Promise.allSettled(uploadPromises);

                    let buttons = [];

                    if (uploadResults[0].status === 'fulfilled' && uploadResults[0].value && uploadResults[0].value.downloadUrl) {
                        buttons.push({
                            name: "cta_copy",
                            buttonParamsJson: JSON.stringify({ display_text: "Top4Top-Uploader", copy_code: uploadResults[0].value.downloadUrl })
                        });
                    }

                    if (uploadResults[1].status === 'fulfilled' && uploadResults[1].value) {
                        buttons.push({
                            name: "cta_copy",
                            buttonParamsJson: JSON.stringify({ display_text: "CatBox-Uploader", copy_code: uploadResults[1].value })
                        });
                    }

                    if (uploadResults[2].status === 'fulfilled' && uploadResults[2].value && uploadResults[2].value.url) {
                        buttons.push({
                            name: "cta_copy",
                            buttonParamsJson: JSON.stringify({ display_text: "Qu-Uploader", copy_code: uploadResults[2].value.url })
                        });
                    }

                    if (uploadResults[3].status === 'fulfilled' && uploadResults[3].value) {
                        buttons.push({
                            name: "cta_copy",
                            buttonParamsJson: JSON.stringify({ display_text: "Uguu-Uploader", copy_code: uploadResults[3].value })
                        });
                    }

                    if (uploadResults[4].status === 'fulfilled' && uploadResults[4].value) {
                        buttons.push({
                            name: "cta_copy",
                            buttonParamsJson: JSON.stringify({ display_text: "Hitoshi MD V1 - Cdn", copy_code: uploadResults[4].value })
                        });
                    }

                    if (buttons.length === 0) {
                        return Reply("⚠️ Semua uploader gagal mengupload file.");
                    }

                    const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

                    let headerImage;
                    try {
                        if (/^image\//.test(mimeType)) {
                            headerImage = await prepareWAMessageMedia(
                                { image: media },
                                { upload: shorekeeper.waUploadToServer }
                            );
                        } else {
                            headerImage = await prepareWAMessageMedia(
                                { image: { url: global.image?.menu || "https://cdn-alip.clutch.web.id/api/u/mvnbdijm.jpg" } },
                                { upload: shorekeeper.waUploadToServer }
                            );
                        }
                    } catch (e) {
                        headerImage = null;
                    }

                    try {
                        const msg = generateWAMessageFromContent(
                            m.chat,
                            {
                                viewOnceMessage: {
                                    message: {
                                        messageContextInfo: {
                                            deviceListMetadata: {},
                                            deviceListMetadataVersion: 2,
                                            stanzaId: m.key.id,
                                            participant: m.sender
                                        },
                                        interactiveMessage: proto.Message.InteractiveMessage.create({
                                            body: proto.Message.InteractiveMessage.Body.create({
                                                text: `\n╔──☉ *UPLOADER RESULTS*\n│✎ *Status* : ✅ Success\n│✎ *Total*  : ${buttons.length} Uploader\n╚────────────☉`
                                            }),
                                            footer: proto.Message.InteractiveMessage.Footer.create({
                                                text: `Bot: ${global.botname || 'Hitoshi MD V1'}`
                                            }),
                                            ...(headerImage ? {
                                                header: proto.Message.InteractiveMessage.Header.create({
                                                    hasMediaAttachment: true,
                                                    ...headerImage
                                                })
                                            } : {}),
                                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                                buttons: buttons
                                            }),
                                            contextInfo: {
                                                stanzaId: m.key.id,
                                                participant: m.sender
                                            }
                                        })
                                    }
                                }
                            },
                            {}
                        );

                        await shorekeeper.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
                    } catch (interactiveErr) {
                        let resultText = `╔──☉ *UPLOADER RESULTS*\n│✎ *Status* : ✅ Success\n│✎ *Total*  : ${buttons.length} Uploader\n╚────────────☉\n\n`;
                        if (uploadResults[0].status === 'fulfilled' && uploadResults[0].value?.downloadUrl) resultText += `• *Top4Top*: ${uploadResults[0].value.downloadUrl}\n`;
                        if (uploadResults[1].status === 'fulfilled' && uploadResults[1].value) resultText += `• *CatBox*: ${uploadResults[1].value}\n`;
                        if (uploadResults[2].status === 'fulfilled' && uploadResults[2].value?.url) resultText += `• *Qu.ax*: ${uploadResults[2].value.url}\n`;
                        if (uploadResults[3].status === 'fulfilled' && uploadResults[3].value) resultText += `• *Uguu*: ${uploadResults[3].value}\n`;
                        if (uploadResults[4].status === 'fulfilled' && uploadResults[4].value) resultText += `• *Diezy CDN*: ${uploadResults[4].value}\n`;
                        return Reply(resultText.trim());
                    }

                } catch (e) {
                    console.error('Tourl Error:', e);
                    Reply("❌ Error! Mungkin file terlalu besar atau terjadi gangguan server.");
                }
            }
            break;

            case "setpay":
            case "setpayment":
            case "setqris": {
                if (!isCreator) return Reply(global.mess.owner);

                const qMsg = m.quoted ? m.quoted : m;
                const mimeType = (qMsg.msg || qMsg).mimetype || '';
                const isImg = /image/.test(mimeType);

                if (!global.payment) global.payment = {};
                if (!global.image) global.image = {};

                const saveSettingsPay = () => {
                    try {
                        const settingsPath = path.join(process.cwd(), 'settings.js');
                        if (fs.existsSync(settingsPath)) {
                            let settingsContent = fs.readFileSync(settingsPath, 'utf8');
                            const paymentBlock = `global.payment = {\n\tqris: "${global.payment.qris || ''}",\n\tdana: "${global.payment.dana || ''}",\n\tgopay: "${global.payment.gopay || ''}",\n\tan: "${global.payment.an || ''}"\n};`;
                            if (/global\.payment\s*=\s*\{[\s\S]*?\};/.test(settingsContent)) {
                                settingsContent = settingsContent.replace(/global\.payment\s*=\s*\{[\s\S]*?\};/, paymentBlock);
                            }
                            if (global.payment.qris) {
                                settingsContent = settingsContent.replace(/(global\.image\s*=\s*\{[\s\S]*?qris:\s*)["'][^"']*["']/, `$1"${global.payment.qris}"`);
                            }
                            fs.writeFileSync(settingsPath, settingsContent, 'utf8');
                        }
                    } catch (e) {
                        console.error('Error saving payment in settings.js:', e);
                    }
                };

                // 1. Jika kirim / reply foto
                if (isImg) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                    Reply(global.mess.wait);
                    try {
                        const buffer = await qMsg.download();
                        const cdnUrl = await uploadToCDN(buffer, mimeType);
                        if (!cdnUrl) {
                            return Reply(`❌ Gagal mengunggah foto QRIS ke CDN. Pastikan server CDN aktif.`);
                        }
                        global.payment.qris = cdnUrl;
                        global.image.qris = cdnUrl;
                        saveSettingsPay();
                        await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                        return Reply(`\`⌜ QRIS Updated ⌟\`\n> ◦ Status : *Berhasil Diubah*\n> ◦ QRIS URL : *${cdnUrl}*\n> ◦ Info : *Foto QRIS berhasil diperbarui dan disimpan secara permanen.*`);
                    } catch (err) {
                        return Reply(`❌ Gagal mengunduh / mengunggah foto QRIS: ${err.message}`);
                    }
                }

                // 2. Jika command setqris dengan URL
                if (command === 'setqris' && text && text.trim().startsWith('http')) {
                    const newUrl = text.trim();
                    global.payment.qris = newUrl;
                    global.image.qris = newUrl;
                    saveSettingsPay();
                    await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    return Reply(`\`⌜ QRIS Updated ⌟\`\n> ◦ Status : *Berhasil Diubah*\n> ◦ QRIS URL : *${newUrl}*\n> ◦ Info : *URL QRIS berhasil diperbarui secara permanen.*`);
                }

                // 3. Subcommand: .setpay dana <nomor>, .setpay gopay <nomor>, .setpay an <nama>, .setpay qris <url>
                const subCmd = (args[0] || '').toLowerCase();
                const subVal = args.slice(1).join(' ').trim();

                if (subCmd === 'dana') {
                    if (!subVal) return Reply(example('dana 081234567890'));
                    global.payment.dana = subVal;
                    saveSettingsPay();
                    return Reply(`\`⌜ Payment Updated ⌟\`\n> ◦ Nomor Dana : *${subVal}*\n> ◦ Status : *Berhasil Disimpan Permanen*`);
                }

                if (subCmd === 'gopay') {
                    if (!subVal) return Reply(example('gopay 081234567890'));
                    global.payment.gopay = subVal;
                    saveSettingsPay();
                    return Reply(`\`⌜ Payment Updated ⌟\`\n> ◦ Nomor GoPay : *${subVal}*\n> ◦ Status : *Berhasil Disimpan Permanen*`);
                }

                if (subCmd === 'an' || subCmd === 'atasnama' || subCmd === 'nama') {
                    if (!subVal) return Reply(example('an Nama Anda'));
                    global.payment.an = subVal;
                    saveSettingsPay();
                    return Reply(`\`⌜ Payment Updated ⌟\`\n> ◦ Atas Nama (A/N) : *${subVal}*\n> ◦ Status : *Berhasil Disimpan Permanen*`);
                }

                if (subCmd === 'qris') {
                    if (!subVal || !subVal.startsWith('http')) return Reply(example('qris https://url-gambar-qris.jpg'));
                    global.payment.qris = subVal;
                    global.image.qris = subVal;
                    saveSettingsPay();
                    return Reply(`\`⌜ QRIS Updated ⌟\`\n> ◦ QRIS URL : *${subVal}*\n> ◦ Status : *Berhasil Disimpan Permanen*`);
                }

                // 4. Default info / Cara penggunaan
                return Reply(`\`⌜ Set Payment Settings ⌟\`
> ◦ *Cara Penggunaan:*
> 1. *Ganti Foto QRIS:* Kirim / reply foto dengan caption *setpay*
> 2. *Ganti Nomor Dana:* *setpay dana <nomor>*
> 3. *Ganti Nomor GoPay:* *setpay gopay <nomor>*
> 4. *Ganti Atas Nama (A/N):* *setpay an <nama>*
> 5. *Ganti URL QRIS:* *setpay qris <url_gambar>*`);
            }
            break;

            case "setaudiomenu": {
                if (!isCreator) return Reply(global.mess.owner);

                const qMsg = m.quoted ? m.quoted : m;
                const mimeType = (qMsg.msg || qMsg).mimetype || '';
                const isAudio = /audio|video/.test(mimeType);

                if (isAudio) {
                    await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
                    Reply(global.mess.wait);
                    try {
                        const buffer = await qMsg.download();
                        const mediaDir = path.join(process.cwd(), 'source/media');
                        if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
                        const audioPath = path.join(mediaDir, 'menu.mp3');
                        fs.writeFileSync(audioPath, buffer);
                        global.db.settings.audiomenu = true;
                        await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                        return Reply(`\`⌜ Audio Menu Updated ⌟\`\n> ◦ Status : *Aktif (ON)*\n> ◦ Info : *Audio menu berhasil diperbarui dan diaktifkan.*`);
                    } catch (err) {
                        return Reply(`❌ Gagal mengunduh audio: ${err.message}`);
                    }
                }

                let value = (args[0] || '').toLowerCase();
                if (value === 'on' || value === 'aktif' || value === 'enable' || value === '1') {
                    global.db.settings.audiomenu = true;
                    return Reply(`\`⌜ Audio Menu Settings ⌟\`\n> ◦ Status : *Aktif (ON)*\n> ◦ Info : *Audio menu akan dikirim setiap kali menu utama dibuka.*`);
                } else if (value === 'off' || value === 'mati' || value === 'disable' || value === '0') {
                    global.db.settings.audiomenu = false;
                    return Reply(`\`⌜ Audio Menu Settings ⌟\`\n> ◦ Status : *Nonaktif (OFF)*\n> ◦ Info : *Audio menu dinonaktifkan.*`);
                } else {
                    const statusAudio = global.db.settings?.audiomenu ? '🟢 Aktif (ON)' : '🔴 Nonaktif (OFF)';
                    return Reply(`\`⌜ Set Audio Menu ⌟\`
> ◦ *Status Saat Ini :* ${statusAudio}
> ◦ *Cara Penggunaan:*
> 1. *setaudiomenu on* (Mengaktifkan audio menu)
> 2. *setaudiomenu off* (Menonaktifkan audio menu)
> 3. *Kirim / Reply Audio:* Kirim VN/Audio dengan caption *setaudiomenu* untuk mengganti audio sekaligus mengaktifkannya`);
                }
            }
            break;

            // ==================== OWNER SETTINGS ====================

            case "addowner": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!text) return Reply(example("<nomor>"));

                const ownerFile = "./library/database/owner.json";
                let owners = [];
                try {
                    if (fs.existsSync(ownerFile)) owners = JSON.parse(fs.readFileSync(ownerFile));
                } catch (e) { owners = []; }

                const newNum = text.replace(/[^0-9]/g, '');
                if (!newNum) return Reply("❌ Nomor tidak valid.");
                if (owners.includes(newNum)) return Reply(`❌ Nomor *${newNum}* sudah terdaftar sebagai owner.`);

                owners.push(newNum);
                fs.writeFileSync(ownerFile, JSON.stringify(owners, null, 2));
                Reply(`\`⌜ Add Owner ⌟\`\n> ◦ Nomor : *${newNum}*\n> ◦ Status : *Berhasil Ditambahkan*`);
            }
            break;

            case "delowner": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!text) return Reply(example("<nomor>"));

                const ownerFile = "./library/database/owner.json";
                let owners = [];
                try {
                    if (fs.existsSync(ownerFile)) owners = JSON.parse(fs.readFileSync(ownerFile));
                } catch (e) { owners = []; }

                const delNum = text.replace(/[^0-9]/g, '');
                if (!owners.includes(delNum)) return Reply(`❌ Nomor *${delNum}* tidak ditemukan dalam daftar owner.`);

                owners = owners.filter(v => v !== delNum);
                fs.writeFileSync(ownerFile, JSON.stringify(owners, null, 2));
                Reply(`\`⌜ Del Owner ⌟\`\n> ◦ Nomor : *${delNum}*\n> ◦ Status : *Berhasil Dihapus*`);
            }
            break;

            case "listowner": {
                if (!isCreator) return Reply(global.mess.owner);

                const ownerFile = "./library/database/owner.json";
                let owners = [];
                try {
                    if (fs.existsSync(ownerFile)) owners = JSON.parse(fs.readFileSync(ownerFile));
                } catch (e) { owners = []; }

                if (owners.length === 0) return Reply(`\`⌜ List Owner ⌟\`\n> ◦ Status : *Kosong*`);
                const list = owners.map((v, i) => `> ◦ ${i+1}. ${v}`).join('\n');
                Reply(`\`⌜ List Owner ⌟\`\n> ◦ Total : *${owners.length} Nomor*\n${list}`);
            }
            break;

            case "owner":
            case "developer":
            case "dev":
            case "developerbot": {
                await shorekeeper.sendMessage(m.chat, { react: { text: "OK", key: m.key } }).catch(() => {});

                const ownerNumber = (global.owner || "6289531204240").replace(/[^0-9]/g, '');
                const ownerJid    = ownerNumber + "@s.whatsapp.net";
                const ownerName   = global.namaOwner || "Diezy";
                const botName     = global.botname   || "Hitoshi MD V1";
                const botVersion  = global.versi     || "1.0.0";
                const waLink      = `https://wa.me/${ownerNumber}`;

                const runtimeSec = process.uptime();
                const upDays  = Math.floor(runtimeSec / 86400);
                const upHours = Math.floor((runtimeSec % 86400) / 3600);
                const upMin   = Math.floor((runtimeSec % 3600) / 60);
                const uptimeStr = `${upDays > 0 ? upDays + 'd ' : ''}${upHours}h ${upMin}m`;

                let totalCaseOwner = 0;
                try {
                    const contentOwner = fs.readFileSync(__filename, 'utf8');
                    totalCaseOwner = (contentOwner.match(/case\s+['"`]/g) || []).length;
                } catch (e) {}

                let totalPluginOwner = 0;
                try {
                    const pluginsDirOwner = path.join(__dirname, './plugins');
                    const countJsOwner = (dir) => {
                        let c = 0;
                        for (const file of fs.readdirSync(dir)) {
                            const fp = path.join(dir, file);
                            if (fs.statSync(fp).isDirectory()) c += countJsOwner(fp);
                            else if (file.endsWith('.js')) c++;
                        }
                        return c;
                    };
                    if (fs.existsSync(pluginsDirOwner)) totalPluginOwner = countJsOwner(pluginsDirOwner);
                } catch (e) {}

                const totalFiturOwner = totalCaseOwner + totalPluginOwner;

                let totalUserOwner = 0;
                try {
                    if (typeof loadRegistered === 'function') {
                        totalUserOwner = loadRegistered().length;
                    } else if (global.db && global.db.users) {
                        totalUserOwner = Object.keys(global.db.users).length;
                    }
                } catch (e) {}

                let totalPremOwner = 0;
                try {
                    if (typeof prem !== 'undefined' && Array.isArray(prem)) {
                        totalPremOwner = prem.filter(u => u.expired > Date.now()).length;
                    } else {
                        const { getPremiumList } = require('./source/premium');
                        totalPremOwner = getPremiumList().length;
                    }
                } catch (e) {}

                let totalGrupOwner = 0;
                try {
                    const allGrupOwner = await shorekeeper.groupFetchAllParticipating();
                    totalGrupOwner = Object.keys(allGrupOwner).length;
                } catch (e) {}

                let totalSewaOwner = 0;
                try {
                    const sewaDbOwner = JSON.parse(fs.readFileSync(sewaPath));
                    const nowOwner = Date.now();
                    totalSewaOwner = sewaDbOwner.filter(v => v.permanent === true || v.expired > nowOwner).length;
                } catch (e) {}

                const moment = require("moment-timezone");
                const wibNowOwner  = moment().tz('Asia/Jakarta');
                const wibTimeOwner = wibNowOwner.format('DD/MM/YYYY HH:mm');

                const thumbUrl = (global.image && global.image.menu)
                    ? global.image.menu
                    : "https://files.catbox.moe/5tgkff.jpg";

                const avatarUrl = (global.image && global.image.reply)
                    ? global.image.reply
                    : thumbUrl;

                const teksFallbackOwner = `OWNER CARD
- NAMA   : ${ownerName}
- NOMOR  : +${ownerNumber}
- ROLE   : Founder & Main Developer
- BOT    : ${botName} v${botVersion}
- LINK   : ${waLink}

STATISTIK
- FITUR   : ${totalFiturOwner}
- USER    : ${totalUserOwner}
- PREMIUM : ${totalPremOwner}
- GRUP    : ${totalGrupOwner}
- SEWA    : ${totalSewaOwner}
- UPTIME  : ${uptimeStr}

Klik kartu untuk chat owner: ${waLink}`;

                // Kartu owner dengan banner lokal (lib/media/owner_banner.jpg), dikirim sebagai kartu HTML
                let sentOwnerBanner = false;
                try {
                    const R = require('./lib/rich/richui.cjs');
                    if (R.isRich()) {
                        const bannerUri = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'lib', 'media', 'owner_banner.jpg')).toString('base64');
                        const bannerHtml = `<div class="banner"><img src="${bannerUri}" alt=""><div class="bncap"><b>${R.esc(botName)}</b><span>Owner of ${R.esc(botName)}</span></div></div>`;
                        const ownerRows = [
                            { k: 'Nama', v: ownerName },
                            { k: 'Nomor', v: '+' + ownerNumber },
                            { k: 'Role', v: 'Founder & Main Developer' },
                            { k: 'Bot', v: `${botName} v${botVersion}` },
                            { k: 'Fitur', v: String(totalFiturOwner) },
                            { k: 'User', v: String(totalUserOwner) },
                            { k: 'Premium', v: String(totalPremOwner) },
                            { k: 'Grup', v: String(totalGrupOwner) },
                            { k: 'Sewa', v: String(totalSewaOwner) },
                            { k: 'Uptime', v: uptimeStr }
                        ];
                        const ownerHtml = R.shell({ icon: 'id-card', eyebrow: botName, title: ownerName, body: R.H.rows(ownerRows), banner: bannerHtml, accent: R.TONES.info, pager: true });
                        await R.sendHtml(shorekeeper, m.chat, ownerHtml, ownerName);
                        try {
                            await R.sendCopy(shorekeeper, m.chat, [
                                { label: 'Nomor Owner', value: '+' + ownerNumber },
                                { label: 'Link Chat', value: waLink }
                            ]);
                        } catch (_) {}
                        sentOwnerBanner = true;
                    }
                } catch (err) {
                    console.error('Owner Banner Card Error:', err);
                }

                if (sentOwnerBanner) break;

                let sentOwnerStyle1 = false;
                try {
                    const ownerSubtitle = `Owner of ${botName}`;
                    const secondarySub   = "Founder & Developer";

                    const ownerData = {
                        response_id: `owner-${Date.now()}`,
                        sections: [
                            {
                                view_model: {
                                    primitive: {
                                        media: {
                                            url: thumbUrl,
                                            mime_type: "image/jpeg",
                                            width: 16,
                                            height: 9
                                        },
                                        imagine_type: "IMAGE",
                                        status: {
                                            status: "READY"
                                        },
                                        __typename: "GenAIImaginePrimitive"
                                    },
                                    __typename: "GenAISingleLayoutViewModel"
                                }
                            },
                            {
                                view_model: {
                                    primitive: {
                                        __typename: "GenAICompactEntityPrimitive",
                                        title: ownerName,
                                        subtitle: ownerSubtitle,
                                        secondary_subtitle: secondarySub,
                                        entity_id: 867051314767696,
                                        entity_url: waLink,
                                        entity_type: "PAGE",
                                        action_type: "FOLLOW",
                                        is_verified: true,
                                        image: {
                                            url: avatarUrl,
                                            url_fallback: avatarUrl
                                        }
                                    },
                                    __typename: "GenAISingleLayoutViewModel"
                                }
                            }
                        ]
                    };

                    await shorekeeper.relayMessage(
                        m.chat,
                        {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2,
                                botMetadata: {
                                    messageDisclaimerText: "",
                                    botResponseId: `owner-${Date.now()}`,
                                    verificationMetadata: { proofs: [] }
                                }
                            },
                            botForwardedMessage: {
                                message: {
                                    richResponseMessage: {
                                        messageType: 1,
                                        submessages: [
                                            {
                                                messageType: 1,
                                                gridImageMetadata: {
                                                    gridImageUrl: {
                                                        imagePreviewUrl: thumbUrl
                                                    },
                                                    imageUrls: [
                                                        {
                                                            imagePreviewUrl: thumbUrl,
                                                            imageHighResUrl: thumbUrl,
                                                            sourceUrl: thumbUrl
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                messageType: 2,
                                                messageText: ownerSubtitle
                                            }
                                        ],
                                        unifiedResponse: {
                                            data: Buffer.from(JSON.stringify(ownerData)).toString('base64')
                                        },
                                        contextInfo: {
                                            forwardingScore: 1,
                                            isForwarded: true,
                                            forwardedAiBotMessageInfo: {
                                                botJid: "867051314767696@bot"
                                            },
                                            forwardOrigin: 4
                                        }
                                    }
                                }
                            }
                        },
                        { quoted: m }
                    );
                    sentOwnerStyle1 = true;
                } catch (err) {
                    console.error('Owner Rich Response Error:', err);
                }

                if (sentOwnerStyle1) break;

                let sentOwnerStyle2 = false;
                try {
                    const docUrl   = (global.image && global.image.reply) ? global.image.reply : "https://files.catbox.moe/2mddp6.js";
                    let thumbBuf = null;
                    try {
                        const resThumb = await axios.get(thumbUrl, { responseType: 'arraybuffer' });
                        thumbBuf = Buffer.from(resThumb.data);
                    } catch (e) {
                        try {
                            thumbBuf = Buffer.from(await (await fetch(thumbUrl)).arrayBuffer());
                        } catch (_) {}
                    }

                    const teksFallbackV2 = (fs.existsSync('./library/reply.js') && require('./library/reply').wrapSmallcapHeaders) ? require('./library/reply').wrapSmallcapHeaders(teksFallbackOwner) : teksFallbackOwner;

                    await shorekeeper.sendMessage(m.chat, {
                        document:      { url: docUrl },
                        mimetype:      "text/javascript",
                        fileName:      ` ${botName}`,
                        caption:       teksFallbackV2,
                        thumbnail:     thumbBuf,
                        jpegThumbnail: thumbBuf,
                        contextInfo: {
                            isForwarded:     true,
                            forwardingScore: 1,
                            businessMessageForwardInfo: { businessOwnerJid: ownerJid },
                            forwardedNewsletterMessageInfo: {
                                newsletterName: global.namaSaluran || botName,
                                newsletterJid:  global.idSaluran    || "0@newsletter"
                            }
                        }
                    });
                    sentOwnerStyle2 = true;
                } catch (err) {
                    console.error('Owner DocThumb Error:', err);
                }

                if (sentOwnerStyle2) break;

                try { await shorekeeper.sendContact(m.chat, [ownerNumber], m); } catch (e) {}
                await Reply(`${teksFallbackOwner}\n\nKlik: ${waLink}`);
            }
            break;

            case "backup": {
                if (!isCreator) return Reply(global.mess.owner);

                const val = (args[0] || '').toLowerCase();
                if (val !== 'on' && val !== 'off') return Reply(example("on/off"));

                if (val === 'off') {
                    Reply(`\`⌜ Backup ⌟\`\n> ◦ Status : *Backup Dinonaktifkan*`);
                    break;
                }

                Reply(global.mess.wait);
                await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});

                const botCleanName = (global.botname || 'Bot').replace(/[^a-zA-Z0-9]/g, '_');
                const backupName = `Backup_${botCleanName}_${Date.now()}.zip`;
                const backupPath = path.join(process.cwd(), backupName);
                const zipCmd = `zip -r "${backupPath}" . -x "node_modules/*" ".git/*" "*.zip"`;

                exec(zipCmd, { cwd: process.cwd() }, async (err, stdout, stderr) => {
                    if (err || !fs.existsSync(backupPath)) {
                        return Reply(`❌ Backup gagal: ${err?.message || stderr}`);
                    }
                    try {
                        const buf = fs.readFileSync(backupPath);
                        const sizeMb = (buf.length / (1024 * 1024)).toFixed(2);
                        await shorekeeper.sendMessage(m.chat, {
                            document: buf,
                            mimetype: 'application/zip',
                            fileName: backupName,
                            caption: `\`⌜ Backup Selesai ⌟\`\n> ◦ File : *${backupName}*\n> ◦ Ukuran : *${sizeMb} MB*\n> ◦ Status : *Berhasil*`
                        }, { quoted: m });
                        await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                    } catch (e) {
                        Reply(`❌ Gagal mengirim file backup: ${e.message}`);
                    } finally {
                        if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
                    }
                });
            }
            break;

            case "setrestart":
            case "restart": {
                if (!isCreator) return Reply(global.mess.owner);
                await Reply(`\`⌜ Restart ⌟\`\n> ◦ Status : *Bot sedang restart...*\n> ◦ Info : *Tunggu beberapa detik*`);
                setTimeout(() => process.exit(1), 2000);
            }
            break;

            case "settimezone":
            case "timezone": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!text) return Reply(`\`⌜ Timezone ⌟\`\n> ◦ Timezone saat ini : *${global.db.settings.timezone || 'Asia/Jakarta'}*\n\n📌 *Contoh:* settimezone Asia/Jakarta`);

                try {
                    const testMoment = require('moment-timezone');
                    if (!testMoment.tz.zone(text.trim())) return Reply(`❌ Timezone *${text.trim()}* tidak valid.`);
                    global.db.settings.timezone = text.trim();
                    Reply(`\`⌜ Timezone Updated ⌟\`\n> ◦ Timezone : *${text.trim()}*\n> ◦ Status : *Berhasil Diubah*`);
                } catch (e) {
                    Reply(`❌ Gagal set timezone: ${e.message}`);
                }
            }
            break;

            // ==================== JPM (BROADCAST GROUP) ====================

            case "jpm": {
                if (!isCreator) return Reply(global.mess.owner);

                const isMedia = /image|video/.test(mime);
                const teks = text || '';

                if (!teks && !isMedia) return Reply(`\`⌜ JPM ⌟\`\n> ◦ Format salah!\n\n📌 *Contoh:*\n> 1. jpm pesan broadcast\n> 2. Reply media + caption jpm pesan`);

                const allGrup = await shorekeeper.groupFetchAllParticipating();
                const res = Object.keys(allGrup);
                let count = 0;
                const delayJpm = global.db.settings.delayJpm || 3000;

                let mediaPath = null;
                if (isMedia) {
                    mediaPath = await qmsg.download ? await qmsg.download() : null;
                    await Reply(`\`⌜ Proses JPM ⌟\`\n> ◦ Total Grup : *${res.length}*\n> ◦ Tipe : *Media + Teks*\n> ◦ Delay : *${delayJpm}ms*`);
                } else {
                    await Reply(`\`⌜ Proses JPM ⌟\`\n> ◦ Total Grup : *${res.length}*\n> ◦ Tipe : *Teks*\n> ◦ Delay : *${delayJpm}ms*`);
                }

                for (let i of res) {
                    if (global.db.groups[i]?.blacklistjpm === true) continue;
                    try {
                        if (isMedia && mediaPath) {
                            if (/image/.test(mime)) {
                                await shorekeeper.sendMessage(i, { image: mediaPath, caption: teks });
                            } else if (/video/.test(mime)) {
                                await shorekeeper.sendMessage(i, { video: mediaPath, caption: teks, mimetype: mime });
                            }
                        } else {
                            await shorekeeper.sendMessage(i, { text: teks });
                        }
                        count++;
                    } catch (e) {
                        console.error(`Gagal JPM ke ${i}:`, e.message);
                    }
                    await new Promise(r => setTimeout(r, delayJpm));
                }

                await shorekeeper.sendMessage(m.chat, {
                    text: `\`⌜ JPM Selesai ⌟\`\n> ◦ Berhasil : *${count} Grup*\n> ◦ Gagal : *${res.length - count} Grup*`
                }, { quoted: m });
            }
            break;

            case "jpmtag": {
                if (!isCreator) return Reply(global.mess.owner);

                const isMedia = /image|video/.test(mime);
                const teks = text || '';

                if (!teks && !isMedia) return Reply(example("pesan broadcast"));

                const allGrup = await shorekeeper.groupFetchAllParticipating();
                const res = Object.keys(allGrup);
                let count = 0;
                const delayJpmTag = global.db.settings.delayJpmTag || 3000;

                await Reply(`\`⌜ Proses JPM Tag ⌟\`\n> ◦ Total Grup : *${res.length}*\n> ◦ Delay : *${delayJpmTag}ms*`);

                for (let i of res) {
                    if (global.db.groups[i]?.blacklistjpm === true) continue;
                    try {
                        const meta = allGrup[i];
                        const members = (meta.participants || []).map(v => v.id);
                        const tag = members.map(v => `@${v.split('@')[0]}`).join(' ');
                        const pesanTag = `${teks}\n${tag}`;

                        if (isMedia && qmsg.download) {
                            const buf = await qmsg.download();
                            if (/image/.test(mime)) {
                                await shorekeeper.sendMessage(i, { image: buf, caption: pesanTag, mentions: members });
                            } else if (/video/.test(mime)) {
                                await shorekeeper.sendMessage(i, { video: buf, caption: pesanTag, mentions: members, mimetype: mime });
                            }
                        } else {
                            await shorekeeper.sendMessage(i, { text: pesanTag, mentions: members });
                        }
                        count++;
                    } catch (e) {
                        console.error(`Gagal JPMTag ke ${i}:`, e.message);
                    }
                    await new Promise(r => setTimeout(r, delayJpmTag));
                }

                await shorekeeper.sendMessage(m.chat, {
                    text: `\`⌜ JPM Tag Selesai ⌟\`\n> ◦ Berhasil : *${count} Grup*\n> ◦ Gagal : *${res.length - count} Grup*`
                }, { quoted: m });
            }
            break;

            case "jpmht":
            case "jpmh":
            case "jpmhidetag": {
                if (!isCreator) return Reply(global.mess.owner);

                const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

                let mediaBuffer = null;
                let mimeType = '';
                let captionText = text || '';
                let mediaType = ''; // 'image' | 'video' | 'audio' | 'document'
                let fileName = 'file';
                let isPtt = false;

                // 1. Cek media langsung pada pesan perintah
                if (m.message?.imageMessage) {
                    try {
                        const stream = await downloadContentFromMessage(m.message.imageMessage, 'image');
                        const chunks = [];
                        for await (const chunk of stream) chunks.push(chunk);
                        mediaBuffer = Buffer.concat(chunks);
                        mimeType = m.message.imageMessage.mimetype || 'image/jpeg';
                        mediaType = 'image';
                        captionText = text || m.message.imageMessage.caption || '';
                    } catch (e) {}
                } else if (m.message?.videoMessage) {
                    try {
                        const stream = await downloadContentFromMessage(m.message.videoMessage, 'video');
                        const chunks = [];
                        for await (const chunk of stream) chunks.push(chunk);
                        mediaBuffer = Buffer.concat(chunks);
                        mimeType = m.message.videoMessage.mimetype || 'video/mp4';
                        mediaType = 'video';
                        captionText = text || m.message.videoMessage.caption || '';
                    } catch (e) {}
                } else if (m.message?.documentMessage || m.message?.documentWithCaptionMessage) {
                    try {
                        const docMsg = m.message.documentMessage || m.message.documentWithCaptionMessage?.message?.documentMessage;
                        const stream = await downloadContentFromMessage(docMsg, 'document');
                        const chunks = [];
                        for await (const chunk of stream) chunks.push(chunk);
                        mediaBuffer = Buffer.concat(chunks);
                        mimeType = docMsg.mimetype || 'application/octet-stream';
                        fileName = docMsg.fileName || 'file';
                        mediaType = 'document';
                        captionText = text || docMsg.caption || '';
                    } catch (e) {}
                } else if (m.message?.audioMessage) {
                    try {
                        const stream = await downloadContentFromMessage(m.message.audioMessage, 'audio');
                        const chunks = [];
                        for await (const chunk of stream) chunks.push(chunk);
                        mediaBuffer = Buffer.concat(chunks);
                        mimeType = m.message.audioMessage.mimetype || 'audio/mp4';
                        mediaType = 'audio';
                        isPtt = !!m.message.audioMessage.ptt;
                    } catch (e) {}
                }

                // 2. Cek pesan yang di-reply (quoted message)
                const quotedMsg = m.quoted;
                if (!mediaBuffer && quotedMsg) {
                    const qObj = quotedMsg.msg || quotedMsg;
                    const quotedMime = qObj.mimetype || quotedMsg.mime || '';
                    const quotedType = quotedMsg.type || '';

                    if (/image/gi.test(quotedMime) || quotedType === 'imageMessage') {
                        try {
                            const stream = await downloadContentFromMessage(qObj, 'image');
                            const chunks = [];
                            for await (const chunk of stream) chunks.push(chunk);
                            mediaBuffer = Buffer.concat(chunks);
                            mimeType = quotedMime || 'image/jpeg';
                            mediaType = 'image';
                            captionText = text || qObj.caption || quotedMsg.text || quotedMsg.body || '';
                        } catch (e) {}
                    } else if (/video/gi.test(quotedMime) || quotedType === 'videoMessage') {
                        try {
                            const stream = await downloadContentFromMessage(qObj, 'video');
                            const chunks = [];
                            for await (const chunk of stream) chunks.push(chunk);
                            mediaBuffer = Buffer.concat(chunks);
                            mimeType = quotedMime || 'video/mp4';
                            mediaType = 'video';
                            captionText = text || qObj.caption || quotedMsg.text || quotedMsg.body || '';
                        } catch (e) {}
                    } else if (/audio/gi.test(quotedMime) || quotedType === 'audioMessage') {
                        try {
                            const stream = await downloadContentFromMessage(qObj, 'audio');
                            const chunks = [];
                            for await (const chunk of stream) chunks.push(chunk);
                            mediaBuffer = Buffer.concat(chunks);
                            mimeType = quotedMime || 'audio/mp4';
                            mediaType = 'audio';
                            isPtt = !!(qObj.ptt || quotedMsg.isPtt);
                        } catch (e) {}
                    } else if (/document|pdf|zip|tar|rar|octet-stream|application/gi.test(quotedMime) || quotedType === 'documentMessage') {
                        try {
                            const stream = await downloadContentFromMessage(qObj, 'document');
                            const chunks = [];
                            for await (const chunk of stream) chunks.push(chunk);
                            mediaBuffer = Buffer.concat(chunks);
                            mimeType = quotedMime || 'application/octet-stream';
                            fileName = qObj.fileName || quotedMsg.fileName || 'file';
                            mediaType = 'document';
                            captionText = text || qObj.caption || '';
                        } catch (e) {}
                    } else {
                        // Quoted pesan teks
                        const qText = quotedMsg.text || quotedMsg.body || (typeof qObj === 'string' ? qObj : (qObj?.text || ''));
                        if (!captionText) captionText = qText || '';
                    }
                }

                // Bersihkan awalan perintah jika ada di captionText
                if (captionText) {
                    const cleanRegex = new RegExp(`^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&./]*(jpmht|jpmh|jpmhidetag)\\s*`, 'i');
                    if (/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&./]+(jpmht|jpmh|jpmhidetag)(\s|$)/i.test(captionText.trim())) {
                        captionText = captionText.trim().replace(cleanRegex, '').trim();
                    }
                }

                if (!captionText && !mediaBuffer) {
                    return Reply(`\`⌜ JPM HideTag ⌟\`\n> ◦ Format salah!\n\n📌 *Penggunaan:*\n> 1. *.jpmht pesan*\n> 2. Kirim/reply foto, video, dokumen, audio dengan *.jpmht [pesan]*`);
                }

                const allGrup = await shorekeeper.groupFetchAllParticipating();
                const res = Object.keys(allGrup);
                let count = 0;
                const delayJpmHt = global.db.settings.delayJpmTag || global.db.settings.delayJpm || 3000;

                const tipeStr = mediaType ? (mediaType.toUpperCase() + (captionText ? ' + Teks' : '')) : 'Teks (HideTag)';
                await Reply(`\`⌜ Proses JPM HideTag ⌟\`\n> ◦ Total Grup : *${res.length}*\n> ◦ Tipe : *${tipeStr}*\n> ◦ Delay : *${delayJpmHt}ms*`);

                for (let i of res) {
                    if (global.db.groups[i]?.blacklistjpm === true) continue;
                    try {
                        const meta = allGrup[i];
                        const members = (meta.participants || []).map(v => v.id);

                        let messageOptions = {
                            mentions: members
                        };

                        if (mediaBuffer) {
                            if (mediaType === 'image') {
                                messageOptions.image = mediaBuffer;
                                if (captionText) messageOptions.caption = captionText;
                            } else if (mediaType === 'video') {
                                messageOptions.video = mediaBuffer;
                                messageOptions.mimetype = mimeType;
                                if (captionText) messageOptions.caption = captionText;
                            } else if (mediaType === 'audio') {
                                messageOptions.audio = mediaBuffer;
                                messageOptions.mimetype = mimeType;
                                messageOptions.ptt = isPtt;
                            } else if (mediaType === 'document') {
                                messageOptions.document = mediaBuffer;
                                messageOptions.mimetype = mimeType;
                                messageOptions.fileName = fileName;
                                if (captionText) messageOptions.caption = captionText;
                            }
                            await shorekeeper.sendMessage(i, messageOptions);
                        } else {
                            await shorekeeper.sendMessage(i, { text: captionText, mentions: members });
                        }
                        count++;
                    } catch (e) {
                        console.error(`Gagal JPMHT ke ${i}:`, e.message);
                    }
                    await new Promise(r => setTimeout(r, delayJpmHt));
                }

                await shorekeeper.sendMessage(m.chat, {
                    text: `\`⌜ JPM HideTag Selesai ⌟\`\n> ◦ Berhasil : *${count} Grup*\n> ◦ Gagal : *${res.length - count} Grup*`
                }, { quoted: m });
            }
            break;

            case "jpmstatus": {
                if (!isCreator) return Reply(global.mess.owner);

                const isAutoJpmOn = !!global._autoJpmInterval;
                const isAutoJpmTagOn = !!global._autoJpmTagInterval;
                const delayJpm = global.db.settings.delayJpm || 3000;
                const delayJpmTag = global.db.settings.delayJpmTag || 3000;

                let allGrupCount = 0;
                let blacklistCount = 0;
                try {
                    const allGrup = await shorekeeper.groupFetchAllParticipating();
                    allGrupCount = Object.keys(allGrup).length;
                    blacklistCount = Object.values(global.db.groups || {}).filter(g => g.blacklistjpm === true).length;
                } catch (e) {}

                Reply(`\`⌜ Status JPM ⌟\`
> ◦ Auto JPM : *${isAutoJpmOn ? '🟢 Aktif' : '🔴 Nonaktif'}*
> ◦ Auto JPM Tag : *${isAutoJpmTagOn ? '🟢 Aktif' : '🔴 Nonaktif'}*
> ◦ Delay JPM : *${delayJpm}ms*
> ◦ Delay JPM Tag : *${delayJpmTag}ms*
> ◦ Total Grup : *${allGrupCount} Grup*
> ◦ Blacklist JPM : *${blacklistCount} Grup*`);
            }
            break;

            case "jpmpilih": {
                if (!isCreator) return Reply(global.mess.owner);

                await Reply(global.mess.wait);
                const allGrup = await shorekeeper.groupFetchAllParticipating();
                const grupArr = Object.entries(allGrup);

                if (grupArr.length === 0) return Reply("❌ Bot tidak berada di grup manapun.");

                global._jpmPilihList = grupArr.map(([id, meta]) => ({ id, name: meta.subject || id }));

                // Set state: tunggu input nomor dari user
                global._jpmState = global._jpmState || {};
                global._jpmState[m.sender] = { step: 'pilih_nomor', chat: m.chat };

                let teks = `\`⌜ JPM Pilih Grup ⌟\`\n> ◦ Total : *${grupArr.length} Grup*\n> ◦ Ketik nomor grup (pisah titik/koma)\n> ◦ Contoh: *1.2.3* atau *1,2,3*\n\n`;
                global._jpmPilihList.forEach((g, i) => {
                    const bl = global.db.groups[g.id]?.blacklistjpm ? ' [BL]' : '';
                    teks += `*${i+1}.* ${g.name}${bl}\n`;
                });
                Reply(teks);
            }
            break;

            // ==================== AUTO JPM ====================

            case "autojpm": {
                if (!isCreator) return Reply(global.mess.owner);

                const isMedia = /image|video/.test(mime);
                const teks = text || '';

                if (!teks && !isMedia) return Reply(example("pesan auto broadcast"));

                if (global._autoJpmInterval) {
                    clearInterval(global._autoJpmInterval);
                    global._autoJpmInterval = null;
                }

                let mediaBuf = null;
                let mediaMime = mime;
                if (isMedia && qmsg.download) {
                    mediaBuf = await qmsg.download();
                }

                const delayAuto = global.db.settings.delayJpm || 3000;
                const intervalTime = parseInt(args[0]) || 60000; // default 60 detik jika tidak diset

                Reply(`\`⌜ Auto JPM Aktif ⌟\`\n> ◦ Interval : *setiap ${intervalTime/1000}s*\n> ◦ Delay antar grup : *${delayAuto}ms*\n> ◦ Pesan : *${teks || '[Media]'}*`);

                global._autoJpmInterval = setInterval(async () => {
                    try {
                        const allGrup = await shorekeeper.groupFetchAllParticipating();
                        const grupIds = Object.keys(allGrup);
                        for (let i of grupIds) {
                            if (global.db.groups[i]?.blacklistjpm === true) continue;
                            try {
                                if (mediaBuf) {
                                    if (/image/.test(mediaMime)) {
                                        await shorekeeper.sendMessage(i, { image: mediaBuf, caption: teks });
                                    } else if (/video/.test(mediaMime)) {
                                        await shorekeeper.sendMessage(i, { video: mediaBuf, caption: teks, mimetype: mediaMime });
                                    }
                                } else {
                                    await shorekeeper.sendMessage(i, { text: teks });
                                }
                            } catch (e) {}
                            await new Promise(r => setTimeout(r, delayAuto));
                        }
                    } catch (e) { console.error('AutoJPM error:', e.message); }
                }, intervalTime);
            }
            break;

            case "stopautojpm": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!global._autoJpmInterval) return Reply("❌ Auto JPM tidak sedang berjalan.");
                clearInterval(global._autoJpmInterval);
                global._autoJpmInterval = null;
                Reply(`\`⌜ Auto JPM ⌟\`\n> ◦ Status : *Dihentikan*`);
            }
            break;

            case "autojpmtag": {
                if (!isCreator) return Reply(global.mess.owner);

                const isMedia = /image|video/.test(mime);
                const teks = text || '';

                if (!teks && !isMedia) return Reply(example("pesan auto broadcast tag"));

                if (global._autoJpmTagInterval) {
                    clearInterval(global._autoJpmTagInterval);
                    global._autoJpmTagInterval = null;
                }

                let mediaBuf = null;
                let mediaMime = mime;
                if (isMedia && qmsg.download) {
                    mediaBuf = await qmsg.download();
                }

                const delayAutoTag = global.db.settings.delayJpmTag || 3000;
                const intervalTimeTag = parseInt(args[0]) || 60000;

                Reply(`\`⌜ Auto JPM Tag Aktif ⌟\`\n> ◦ Interval : *setiap ${intervalTimeTag/1000}s*\n> ◦ Delay : *${delayAutoTag}ms*`);

                global._autoJpmTagInterval = setInterval(async () => {
                    try {
                        const allGrup = await shorekeeper.groupFetchAllParticipating();
                        const grupEntries = Object.entries(allGrup);
                        for (let [id, meta] of grupEntries) {
                            if (global.db.groups[id]?.blacklistjpm === true) continue;
                            try {
                                const members = (meta.participants || []).map(v => v.id);
                                const tag = members.map(v => `@${v.split('@')[0]}`).join(' ');
                                const pesanTag = `${teks}\n${tag}`;
                                if (mediaBuf) {
                                    if (/image/.test(mediaMime)) {
                                        await shorekeeper.sendMessage(id, { image: mediaBuf, caption: pesanTag, mentions: members });
                                    } else if (/video/.test(mediaMime)) {
                                        await shorekeeper.sendMessage(id, { video: mediaBuf, caption: pesanTag, mentions: members, mimetype: mediaMime });
                                    }
                                } else {
                                    await shorekeeper.sendMessage(id, { text: pesanTag, mentions: members });
                                }
                            } catch (e) {}
                            await new Promise(r => setTimeout(r, delayAutoTag));
                        }
                    } catch (e) { console.error('AutoJPMTag error:', e.message); }
                }, intervalTimeTag);
            }
            break;

            case "stopautojpmtag": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!global._autoJpmTagInterval) return Reply("❌ Auto JPM Tag tidak sedang berjalan.");
                clearInterval(global._autoJpmTagInterval);
                global._autoJpmTagInterval = null;
                Reply(`\`⌜ Auto JPM Tag ⌟\`\n> ◦ Status : *Dihentikan*`);
            }
            break;

            case "setdelayjpm": {
                if (!isCreator) return Reply(global.mess.owner);
                const delayVal = parseInt(text);
                if (isNaN(delayVal) || delayVal < 500) return Reply(example("<ms> (min 500)\nContoh: setdelayjpm 3000"));
                global.db.settings.delayJpm = delayVal;
                Reply(`\`⌜ Delay JPM ⌟\`\n> ◦ Delay : *${delayVal}ms*\n> ◦ Status : *Berhasil Diubah*`);
            }
            break;

            case "setdelayjpmtag": {
                if (!isCreator) return Reply(global.mess.owner);
                const delayTagVal = parseInt(text);
                if (isNaN(delayTagVal) || delayTagVal < 500) return Reply(example("<ms> (min 500)\nContoh: setdelayjpmtag 3000"));
                global.db.settings.delayJpmTag = delayTagVal;
                Reply(`\`⌜ Delay JPM Tag ⌟\`\n> ◦ Delay : *${delayTagVal}ms*\n> ◦ Status : *Berhasil Diubah*`);
            }
            break;

            // ==================== SWGC (STATUS GRUP) ====================

            case "swgc": {
                if (!isCreator) return Reply(global.mess.owner);

                const qSwgc = m.quoted ? m.quoted : m;
                const mimeSwgc = (qSwgc.msg || qSwgc).mimetype || '';
                const captionSwgc = text || '';
                const jidSwgc = m.chat;

                if (!mimeSwgc && !captionSwgc) return Reply(example("teks atau reply media"));

                try {
                    Reply(global.mess.wait);
                    if (/image/.test(mimeSwgc)) {
                        const buf = await qSwgc.download();
                        await shorekeeper.sendMessage(jidSwgc, { groupStatusMessage: { image: buf, caption: captionSwgc } });
                        Reply(global.mess.done);
                    } else if (/video/.test(mimeSwgc)) {
                        const buf = await qSwgc.download();
                        await shorekeeper.sendMessage(jidSwgc, { groupStatusMessage: { video: buf, caption: captionSwgc } });
                        Reply(global.mess.done);
                    } else if (/audio/.test(mimeSwgc)) {
                        const buf = await qSwgc.download();
                        await shorekeeper.sendMessage(jidSwgc, { groupStatusMessage: { audio: buf } });
                        Reply(global.mess.done);
                    } else if (captionSwgc) {
                        await shorekeeper.sendMessage(jidSwgc, { groupStatusMessage: { text: captionSwgc } });
                        Reply(global.mess.done);
                    } else {
                        Reply("❌ Kirim teks atau reply media untuk SWGC.");
                    }
                } catch (e) {
                    console.error("swgc error:", e);
                    Reply(global.mess.error);
                }
            }
            break;

            // ==================== SWCH (STATUS SALURAN / NEWSLETTER) ====================

            case "swch":
            case "upswch":
            case "statusch": {
                // Command khusus Owner Bot
                if (!isCreator) return Reply(global.mess.owner);

                const swchConf = global.swchConfig || {};
                let targetCh = swchConf.idSaluran || global.idSaluran || "";
                let contentText = text || '';

                if (args.length > 0 && args[0].endsWith('@newsletter')) {
                    targetCh = args[0];
                    contentText = args.slice(1).join(' ');
                }

                if (!targetCh || !targetCh.endsWith('@newsletter')) {
                    return Reply(`\`⌜ Target Saluran Tidak Ditemukan ⌟\`\n> ◦ Info : *Set global.idSaluran di settings.js atau sertakan JID saluran*\n> ◦ Contoh : ${prefix + command} 120363xxx@newsletter teks`);
                }

                const qSwch = m.quoted ? m.quoted : m;
                const mimeSwch = (qSwch.msg || qSwch).mimetype || '';
                const captionSwch = contentText || (m.quoted ? (m.quoted.text || m.quoted.caption || '') : '');

                // Validasi contoh penggunaan sama seperti swgc
                if (!mimeSwch && !captionSwch) return Reply(example("teks atau reply media"));

                // Validasi Izin: Bot harus Admin / Owner di saluran
                if (swchConf.requireAdmin !== false) {
                    let isBotAdmin = false;
                    let viewerRole = "";
                    try {
                        if (typeof shorekeeper.newsletterMetadata === 'function') {
                            const meta = await shorekeeper.newsletterMetadata("jid", targetCh, "GUEST");
                            viewerRole = (meta?.viewer_metadata?.role || meta?.role || "").toUpperCase();
                            isBotAdmin = viewerRole === "ADMIN" || viewerRole === "OWNER";
                        } else {
                            isBotAdmin = true;
                        }
                    } catch (err) {
                        const errStr = String(err).toLowerCase();
                        if (errStr.includes("403") || errStr.includes("401") || errStr.includes("not-authorized") || errStr.includes("forbidden")) {
                            viewerRole = "NOT_AUTHORIZED";
                            isBotAdmin = false;
                        } else {
                            viewerRole = "UNKNOWN_ERROR";
                        }
                    }

                    if (!isBotAdmin && viewerRole !== "UNKNOWN_ERROR") {
                        return Reply(`\`⌜ Akses Saluran Ditolak ⌟\`\n` +
                            `> ◦ Status : *Bot Bukan Admin Saluran*\n` +
                            `> ◦ Saluran : *${swchConf.namaSaluran || targetCh}*\n` +
                            `> ◦ Target JID : *${targetCh}*\n` +
                            `> ◦ Peran Akun Bot : *${viewerRole || 'Subscriber / Tamu'}*\n\n` +
                            `⚠️ *Syarat SWCH:* Akun bot *wajib* dipromosikan menjadi *Admin* atau *Owner* di saluran tersebut agar dapat mempublikasikan status saluran.`);
                    }
                }

                try {
                    Reply(global.mess.wait);

                    let payload = {};
                    let contentType = "Teks";

                    if (/image/.test(mimeSwch)) {
                        const buf = await qSwch.download();
                        payload = { image: buf, caption: captionSwch };
                        contentType = "Gambar";
                    } else if (/video/.test(mimeSwch)) {
                        const buf = await qSwch.download();
                        payload = { video: buf, caption: captionSwch };
                        contentType = "Video";
                    } else if (/audio/.test(mimeSwch)) {
                        const buf = await qSwch.download();
                        payload = { audio: buf, ptt: false };
                        contentType = "Audio";
                    } else if (captionSwch) {
                        payload = {
                            text: captionSwch,
                            background: swchConf.defaultBgColor || "#25D366"
                        };
                        contentType = "Teks";
                    } else {
                        return Reply("❌ Kirim teks atau reply media untuk SWCH.");
                    }

                    const sendOptions = {
                        statusAttribution: swchConf.statusAttribution ?? true,
                        resolveServerId: swchConf.resolveServerId ?? true,
                        ackTimeoutMs: swchConf.ackTimeoutMs || 15000
                    };

                    let res;
                    let statusSent = false;
                    try {
                        if (shorekeeper.newsletter && typeof shorekeeper.newsletter.sendStatus === 'function') {
                            res = await shorekeeper.newsletter.sendStatus(targetCh, payload, sendOptions);
                        } else if (typeof shorekeeper.sendNewsletterStatus === 'function') {
                            res = await shorekeeper.sendNewsletterStatus(targetCh, payload, sendOptions);
                        } else {
                            const { sendNewsletterStatus } = require('@whiskeysockets/baileys');
                            res = await sendNewsletterStatus(shorekeeper, targetCh, payload, sendOptions);
                        }
                        statusSent = true;
                    } catch (errStatus) {
                        console.warn("swch status error:", errStatus?.message || errStatus);
                    }

                    // Terbitkan juga ke feed room saluran agar langsung muncul di WhatsApp
                    let feedSent = false;
                    if (swchConf.postToFeed !== false) {
                        try {
                            if (/image/.test(mimeSwch)) {
                                const buf = payload.image || (await qSwch.download());
                                await shorekeeper.sendMessage(targetCh, { image: buf, caption: captionSwch });
                                feedSent = true;
                            } else if (/video/.test(mimeSwch)) {
                                const buf = payload.video || (await qSwch.download());
                                await shorekeeper.sendMessage(targetCh, { video: buf, caption: captionSwch });
                                feedSent = true;
                            } else if (/audio/.test(mimeSwch)) {
                                const buf = payload.audio || (await qSwch.download());
                                await shorekeeper.sendMessage(targetCh, { audio: buf, mimetype: mimeSwch });
                                feedSent = true;
                            } else if (captionSwch) {
                                await shorekeeper.sendMessage(targetCh, { text: captionSwch });
                                feedSent = true;
                            }
                        } catch (errFeed) {
                            console.warn("swch feed post error:", errFeed?.message || errFeed);
                        }
                    }

                    if (!statusSent && !feedSent) {
                        throw new Error("Gagal mengirim ke status maupun feed saluran.");
                    }

                    const serverId = res?.newsletterStatusServerId || res?.newsletterStatusAck?.serverId || 'Terkirim';
                    let statusNote = "";
                    if (feedSent) {
                        statusNote = `\n> ◦ Feed Saluran : *Terbit (Langsung Muncul)*`;
                    }
                    Reply(`\`⌜ SWCH Berhasil ⌟\`\n` +
                        `> ◦ Saluran : *${swchConf.namaSaluran || targetCh}*\n` +
                        `> ◦ Target JID : *${targetCh}*\n` +
                        `> ◦ Story Saluran : *${statusSent ? 'Terkirim' : 'Dilewati'}*\n` +
                        `> ◦ Server ID : *${serverId}*` +
                        statusNote + `\n` +
                        `> ◦ Tipe Konten : *${contentType}*\n` +
                        `> ◦ Info : *Cincin story di foto profil saluran dibatasi Meta hanya untuk channel berizin khusus (CHANNEL_STATUS_PRODUCER).*`);
                } catch (e) {
                    console.error("swch error:", e);
                    Reply(`\`⌜ SWCH Gagal ⌟\`\n> ◦ Error : *${e.message || String(e)}*`);
                }
            }
            break;

            // ==================== EVAL & EXEC COMMANDS ====================

            case "$":
            case "exec": {
                if (!isCreator) return Reply(global.mess?.owner || "Khusus Owner");
                const cmdStr = text || (trimmedBudy.startsWith('$') ? trimmedBudy.slice(1).trim() : '');
                if (!cmdStr) return Reply(example("ls -la"));
                exec(cmdStr, (err, stdout, stderr) => {
                    if (err) return Reply(String(err));
                    if (stderr && !stdout) return Reply(String(stderr));
                    if (stdout) return Reply(String(stdout));
                });
            }
            break;

            case ">":
            case "eval": {
                if (!isCreator) return Reply(global.mess?.owner || "Khusus Owner");
                const code = text || (trimmedBudy.startsWith('>') ? trimmedBudy.slice(1).trim() : '');
                if (!code) return Reply(example("console.log('hello')"));
                try {
                    let evaled;
                    try {
                        evaled = await eval(`(async () => { return ${code} })()`);
                    } catch {
                        evaled = await eval(`(async () => { ${code} })()`);
                    }
                    if (evaled !== undefined) {
                        if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
                        await Reply(evaled);
                    }
                } catch (err) {
                    await Reply(String(err));
                }
            }
            break;

            case "=>": {
                if (!isCreator) return Reply(global.mess?.owner || "Khusus Owner");
                const code = text || (trimmedBudy.startsWith('=>') ? trimmedBudy.slice(2).trim() : '');
                if (!code) return Reply(example("1 + 1"));
                try {
                    let evaled;
                    try {
                        evaled = await eval(`(async () => { return ${code} })()`);
                    } catch {
                        evaled = await eval(`(async () => { ${code} })()`);
                    }
                    if (evaled !== undefined) {
                        if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
                        await Reply(evaled);
                    }
                } catch (err) {
                    await Reply(String(err));
                }
            }
            break;

            case "autoswgc": {
                if (!isCreator) return Reply(global.mess.owner);

                const qAutoSwgc = m.quoted ? m.quoted : m;
                const mimeAutoSwgc = (qAutoSwgc.msg || qAutoSwgc).mimetype || '';
                const captionAutoSwgc = text || '';

                if (!mimeAutoSwgc && !captionAutoSwgc) return Reply(example("teks atau reply media"));

                if (global._autoSwgcInterval) {
                    clearInterval(global._autoSwgcInterval);
                    global._autoSwgcInterval = null;
                }

                let swgcBuf = null;
                if (/image|video|audio/.test(mimeAutoSwgc) && qAutoSwgc.download) {
                    swgcBuf = await qAutoSwgc.download();
                }

                const delaySwgcAuto = global.db.settings.delayAutoSwgc || 60000;
                const jidSwgcAuto = m.chat;

                Reply(`\`⌜ Auto SWGC Aktif ⌟\`\n> ◦ Interval : *setiap ${delaySwgcAuto/1000}s*`);

                global._autoSwgcInterval = setInterval(async () => {
                    try {
                        if (swgcBuf) {
                            if (/image/.test(mimeAutoSwgc)) {
                                await shorekeeper.sendMessage(jidSwgcAuto, { groupStatusMessage: { image: swgcBuf, caption: captionAutoSwgc } });
                            } else if (/video/.test(mimeAutoSwgc)) {
                                await shorekeeper.sendMessage(jidSwgcAuto, { groupStatusMessage: { video: swgcBuf, caption: captionAutoSwgc } });
                            } else if (/audio/.test(mimeAutoSwgc)) {
                                await shorekeeper.sendMessage(jidSwgcAuto, { groupStatusMessage: { audio: swgcBuf } });
                            }
                        } else if (captionAutoSwgc) {
                            await shorekeeper.sendMessage(jidSwgcAuto, { groupStatusMessage: { text: captionAutoSwgc } });
                        }
                    } catch (e) { console.error('AutoSWGC error:', e.message); }
                }, delaySwgcAuto);
            }
            break;

            case "stopswgc":
            case "stopautoswgc": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!global._autoSwgcInterval) return Reply("❌ Auto SWGC tidak sedang berjalan.");
                clearInterval(global._autoSwgcInterval);
                global._autoSwgcInterval = null;
                Reply(`\`⌜ Auto SWGC ⌟\`\n> ◦ Status : *Dihentikan*`);
            }
            break;

            case "setdelayswgc":
            case "setdelayautoswgc": {
                if (!isCreator) return Reply(global.mess.owner);
                const dSwgc = parseInt(text);
                if (isNaN(dSwgc) || dSwgc < 1000) return Reply(example("<ms> (min 1000)\nContoh: setdelayswgc 60000"));
                global.db.settings.delayAutoSwgc = dSwgc;
                Reply(`\`⌜ Delay SWGC ⌟\`\n> ◦ Delay : *${dSwgc}ms*\n> ◦ Status : *Berhasil Diubah*`);
            }
            break;

            // ==================== PUSH KONTAK ====================

            case "pushkontak": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!m.isGroup) return Reply(global.mess.group);

                const isMedia = /image|video/.test(mime);
                const teks = text || '';

                if (!teks && !isMedia) return Reply(example("pesan yang ingin di-push ke member"));

                const members = m.metadata.participants.map(v => v.id);
                if (members.length === 0) return Reply("❌ Tidak ada member di grup ini.");

                let mediaBufPush = null;
                if (isMedia && qmsg.download) {
                    mediaBufPush = await qmsg.download();
                }

                const delayPush = global.db.settings.delayPushKontak || 2000;
                global._pushRunning = true;
                let count = 0;

                Reply(`\`⌜ Push Kontak ⌟\`\n> ◦ Target : *${members.length} Member*\n> ◦ Delay : *${delayPush}ms*\n> ◦ Info : *Ketik stoppush untuk hentikan*`);

                for (let jid of members) {
                    if (!global._pushRunning) break;
                    const jidOnly = jid.split('@')[0].split(':')[0];
                    if (jidOnly === (shorekeeper.user?.id || '').split('@')[0].split(':')[0]) continue;
                    try {
                        if (mediaBufPush) {
                            if (/image/.test(mime)) {
                                await shorekeeper.sendMessage(jid, { image: mediaBufPush, caption: teks });
                            } else if (/video/.test(mime)) {
                                await shorekeeper.sendMessage(jid, { video: mediaBufPush, caption: teks, mimetype: mime });
                            }
                        } else {
                            await shorekeeper.sendMessage(jid, { text: teks });
                        }
                        count++;
                    } catch (e) {
                        console.error(`Gagal push ke ${jid}:`, e.message);
                    }
                    await new Promise(r => setTimeout(r, delayPush));
                }

                global._pushRunning = false;
                await shorekeeper.sendMessage(m.chat, {
                    text: `\`⌜ Push Kontak Selesai ⌟\`\n> ◦ Berhasil : *${count} Member*\n> ◦ Gagal : *${members.length - count} Member*`
                }, { quoted: m });
            }
            break;

            case "stoppush": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!global._pushRunning) return Reply("❌ Push kontak tidak sedang berjalan.");
                global._pushRunning = false;
                Reply(`\`⌜ Push Kontak ⌟\`\n> ◦ Status : *Dihentikan*`);
            }
            break;

            case "setdelaypushkontak": {
                if (!isCreator) return Reply(global.mess.owner);
                const dPush = parseInt(text);
                if (isNaN(dPush) || dPush < 500) return Reply(example("<ms> (min 500)\nContoh: setdelaypushkontak 2000"));
                global.db.settings.delayPushKontak = dPush;
                Reply(`\`⌜ Delay Push Kontak ⌟\`\n> ◦ Delay : *${dPush}ms*\n> ◦ Status : *Berhasil Diubah*`);
            }
            break;

            // ==================== AUTO JOIN ====================

            case "autojoin": {
                if (!isCreator) return Reply(global.mess.owner);
                const valAj = (args[0] || '').toLowerCase();
                if (valAj !== 'on' && valAj !== 'off') return Reply(example("on/off"));
                global.db.settings.autojoin = valAj === 'on';
                Reply(`\`⌜ Auto Join ⌟\`\n> ◦ Status : *${valAj === 'on' ? '🟢 Aktif' : '🔴 Nonaktif'}*\n> ◦ Info : *Bot akan ${valAj === 'on' ? 'otomatis join' : 'tidak join'} link grup yang dikirim lewat PM*`);
            }
            break;

            case "join": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!text) return Reply(example("https://chat.whatsapp.com/xxxxx"));

                const linkJoin = text.trim();
                if (!linkJoin.includes('chat.whatsapp.com/')) return Reply("❌ Link WhatsApp tidak valid.");

                const invCode = linkJoin.split('chat.whatsapp.com/')[1].split(/[\s?]+/)[0].trim();
                try {
                    Reply(global.mess.wait);
                    const joinRes = await shorekeeper.groupAcceptInvite(invCode);
                    Reply(`\`⌜ Join Grup ⌟\`\n> ◦ Status : *Berhasil Join*\n> ◦ ID Grup : *${joinRes}*`);
                } catch (e) {
                    Reply(`❌ Gagal join grup: ${e.message}`);
                }
            }
            break;

            case "cekjoin": {
                if (!isCreator) return Reply(global.mess.owner);
                const statusAj = global.db.settings.autojoin ? '🟢 Aktif' : '🔴 Nonaktif';
                Reply(`\`⌜ Status Auto Join ⌟\`\n> ◦ Auto Join : *${statusAj}*`);
            }
            break;

            case "stopjoin": {
                if (!isCreator) return Reply(global.mess.owner);
                global.db.settings.autojoin = false;
                Reply(`\`⌜ Auto Join ⌟\`\n> ◦ Status : *🔴 Dihentikan*`);
            }
            break;

            // ==================== GROUP MANAGER ====================

            case "listgrub":
            case "listgrup": {
                if (!isCreator) return Reply(global.mess.owner);
                Reply(global.mess.wait);

                try {
                    const allGrup = await shorekeeper.groupFetchAllParticipating();
                    const grupArr = Object.entries(allGrup);

                    if (grupArr.length === 0) return Reply("❌ Bot tidak berada di grup manapun.");

                    let teks = `\`⌜ List Semua Grup ⌟\`\n> ◦ Total : *${grupArr.length} Grup*\n\n`;
                    grupArr.forEach(([id, meta], i) => {
                        const isClose = meta.announce ? '🔒' : '🔓';
                        const memberCount = (meta.participants || []).length;
                        const bl = global.db.groups[id]?.blacklistjpm ? ' [BL]' : '';
                        teks += `*${i+1}.* ${meta.subject || id}${bl}\n> ◦ ${isClose} ${meta.announce ? 'Close' : 'Open'} | 👥 ${memberCount}\n\n`;
                    });

                    Reply(teks);
                } catch (e) {
                    Reply(`❌ Gagal mengambil daftar grup: ${e.message}`);
                }
            }
            break;

            case "listgrubopen":
            case "listgrupopen": {
                if (!isCreator) return Reply(global.mess.owner);
                Reply(global.mess.wait);

                try {
                    const allGrup = await shorekeeper.groupFetchAllParticipating();
                    const openGrup = Object.entries(allGrup).filter(([, meta]) => !meta.announce);

                    if (openGrup.length === 0) return Reply("❌ Tidak ada grup yang berstatus open.");

                    let teks = `\`⌜ List Grup Open ⌟\`\n> ◦ Total : *${openGrup.length} Grup*\n\n`;
                    openGrup.forEach(([id, meta], i) => {
                        const memberCount = (meta.participants || []).length;
                        teks += `*${i+1}.* ${meta.subject || id}\n> ◦ 🔓 Open | 👥 ${memberCount}\n\n`;
                    });
                    Reply(teks);
                } catch (e) {
                    Reply(`❌ Gagal: ${e.message}`);
                }
            }
            break;

            case "listgrubclose":
            case "listgrupclose": {
                if (!isCreator) return Reply(global.mess.owner);
                Reply(global.mess.wait);

                try {
                    const allGrup = await shorekeeper.groupFetchAllParticipating();
                    const closeGrup = Object.entries(allGrup).filter(([, meta]) => meta.announce);

                    if (closeGrup.length === 0) return Reply("❌ Tidak ada grup yang berstatus close.");

                    let teks = `\`⌜ List Grup Close ⌟\`\n> ◦ Total : *${closeGrup.length} Grup*\n\n`;
                    closeGrup.forEach(([id, meta], i) => {
                        const memberCount = (meta.participants || []).length;
                        teks += `*${i+1}.* ${meta.subject || id}\n> ◦ 🔒 Close | 👥 ${memberCount}\n\n`;
                    });
                    Reply(teks);
                } catch (e) {
                    Reply(`❌ Gagal: ${e.message}`);
                }
            }
            break;

            case "outclosegc": {
                if (!isCreator) return Reply(global.mess.owner);
                Reply(global.mess.wait);

                try {
                    const allGrup = await shorekeeper.groupFetchAllParticipating();
                    const closeGrup = Object.entries(allGrup).filter(([, meta]) => meta.announce);

                    if (closeGrup.length === 0) return Reply("❌ Tidak ada grup close untuk ditinggalkan.");

                    let count = 0;
                    for (let [id] of closeGrup) {
                        try {
                            await shorekeeper.groupLeave(id);
                            count++;
                        } catch (e) {}
                        await new Promise(r => setTimeout(r, 1500));
                    }
                    Reply(`\`⌜ Out Close GC ⌟\`\n> ◦ Keluar dari : *${count} Grup Close*`);
                } catch (e) {
                    Reply(`❌ Gagal: ${e.message}`);
                }
            }
            break;

            case "outopengc": {
                if (!isCreator) return Reply(global.mess.owner);
                Reply(global.mess.wait);

                try {
                    const allGrup = await shorekeeper.groupFetchAllParticipating();
                    const openGrup = Object.entries(allGrup).filter(([, meta]) => !meta.announce);

                    if (openGrup.length === 0) return Reply("❌ Tidak ada grup open untuk ditinggalkan.");

                    let count = 0;
                    for (let [id] of openGrup) {
                        try {
                            await shorekeeper.groupLeave(id);
                            count++;
                        } catch (e) {}
                        await new Promise(r => setTimeout(r, 1500));
                    }
                    Reply(`\`⌜ Out Open GC ⌟\`\n> ◦ Keluar dari : *${count} Grup Open*`);
                } catch (e) {
                    Reply(`❌ Gagal: ${e.message}`);
                }
            }
            break;

            case "outallgc": {
                if (!isCreator) return Reply(global.mess.owner);
                if (!text || text.toLowerCase() !== 'konfirmasi') return Reply(`⚠️ Perintah ini akan mengeluarkan bot dari *semua grup*!\n\nKetik: *outallgc konfirmasi* untuk melanjutkan.`);
                Reply(global.mess.wait);

                try {
                    const allGrup = await shorekeeper.groupFetchAllParticipating();
                    const grupIds = Object.keys(allGrup);

                    if (grupIds.length === 0) return Reply("❌ Bot tidak berada di grup manapun.");

                    let count = 0;
                    for (let id of grupIds) {
                        try {
                            await shorekeeper.groupLeave(id);
                            count++;
                        } catch (e) {}
                        await new Promise(r => setTimeout(r, 1500));
                    }
                    Reply(`\`⌜ Out All GC ⌟\`\n> ◦ Keluar dari : *${count} Grup*`);
                } catch (e) {
                    Reply(`❌ Gagal: ${e.message}`);
                }
            }
            break;

            case "outpilih": {
                if (!isCreator) return Reply(global.mess.owner);

                await Reply(global.mess.wait);
                const allGrup = await shorekeeper.groupFetchAllParticipating();
                const grupArr = Object.entries(allGrup);
                if (grupArr.length === 0) return Reply("❌ Bot tidak berada di grup manapun.");

                global._outPilihList = grupArr.map(([id, meta]) => ({ id, name: meta.subject || id }));
                global._outState = global._outState || {};
                global._outState[m.sender] = { step: 'pilih_nomor', chat: m.chat };

                let teks = `\`⌜ Out Pilih Grup ⌟\`\n> ◦ Total : *${grupArr.length} Grup*\n> ◦ Ketik nomor grup yang ingin ditinggalkan\n> ◦ Contoh: *1.2.3* atau *1,2,3*\n\n`;
                global._outPilihList.forEach((g, i) => {
                    teks += `*${i+1}.* ${g.name}\n`;
                });
                Reply(teks);
            }
            break;

            // ==================== BLACKLIST JPM ====================

            case "addbl": {
                if (!isCreator) return Reply(global.mess.owner);

                let targetJidBl = m.chat;
                let grupNameBl = 'Grup ini';

                // Jika ada link grup
                if (text && text.includes('chat.whatsapp.com/')) {
                    const blInvCode = text.split('chat.whatsapp.com/')[1].split(/[\s?]+/)[0].trim();
                    try {
                        const blInfo = await shorekeeper.groupGetInviteInfo(blInvCode);
                        targetJidBl = blInfo.id;
                        grupNameBl = blInfo.subject || targetJidBl;
                    } catch (e) {
                        return Reply(`❌ Link grup tidak valid: ${e.message}`);
                    }
                } else if (text) {
                    // Jika berupa JID langsung
                    targetJidBl = text.trim().endsWith('@g.us') ? text.trim() : text.replace(/[^0-9]/g,'') + '@g.us';
                    try {
                        const blMeta = await shorekeeper.groupMetadata(targetJidBl);
                        grupNameBl = blMeta.subject || targetJidBl;
                    } catch (e) {}
                } else {
                    if (!m.isGroup) return Reply("❌ Gunakan di grup atau sertakan link/JID grup.");
                    try {
                        const meta = await shorekeeper.groupMetadata(m.chat);
                        grupNameBl = meta.subject || m.chat;
                    } catch (e) {}
                }

                if (!global.db.groups[targetJidBl]) global.db.groups[targetJidBl] = {};

                if (global.db.groups[targetJidBl].blacklistjpm) {
                    // Toggle off
                    global.db.groups[targetJidBl].blacklistjpm = false;
                    Reply(`\`⌜ Blacklist JPM ⌟\`\n> ◦ Grup : *${grupNameBl}*\n> ◦ Status : *🔓 Dihapus dari Blacklist*`);
                } else {
                    global.db.groups[targetJidBl].blacklistjpm = true;
                    Reply(`\`⌜ Blacklist JPM ⌟\`\n> ◦ Grup : *${grupNameBl}*\n> ◦ Status : *🔒 Ditambahkan ke Blacklist*`);
                }
            }
            break;

            case "listbl": {
                if (!isCreator) return Reply(global.mess.owner);

                const blList = Object.entries(global.db.groups || {}).filter(([, v]) => v.blacklistjpm === true);

                if (blList.length === 0) return Reply(`\`⌜ Blacklist JPM ⌟\`\n> ◦ Status : *Kosong*`);

                let teks = `\`⌜ Blacklist JPM ⌟\`\n> ◦ Total : *${blList.length} Grup*\n\n`;
                let no = 1;
                for (let [jid] of blList) {
                    let namaGrup = jid;
                    try {
                        const meta = await shorekeeper.groupMetadata(jid);
                        namaGrup = meta.subject || jid;
                    } catch (e) {}
                    teks += `*${no++}.* ${namaGrup}\n`;
                }
                Reply(teks);
            }
            break;

            case "delbl": {
                if (!isCreator) return Reply(global.mess.owner);

                const blList = Object.entries(global.db.groups || {}).filter(([, v]) => v.blacklistjpm === true);
                if (blList.length === 0) return Reply(`\`⌜ Blacklist JPM ⌟\`\n> ◦ Status : *Kosong*`);

                // Jika ada nomor langsung
                if (text && /^[\d\s.,]+$/.test(text.trim())) {
                    const indices = text.trim().replace(/[.,\s]+/g, ',').split(',')
                        .map(v => parseInt(v.trim()) - 1)
                        .filter(v => !isNaN(v) && v >= 0 && v < blList.length);

                    if (indices.length === 0) return Reply("❌ Nomor tidak valid.");

                    let count = 0;
                    for (let idx of indices) {
                        const [jid] = blList[idx];
                        if (global.db.groups[jid]) {
                            global.db.groups[jid].blacklistjpm = false;
                            count++;
                        }
                    }
                    return Reply(`\`⌜ Delbl ⌟\`\n> ◦ Dihapus dari blacklist : *${count} Grup*`);
                }

                // Tampilkan daftar bl dulu
                let teks = `\`⌜ Hapus Blacklist JPM ⌟\`\n> ◦ Total : *${blList.length} Grup*\n> ◦ Ketik nomor yang ingin dihapus\n> ◦ Contoh: *1.2.3*\n\n`;
                let no = 1;
                for (let [jid] of blList) {
                    let namaGrup = jid;
                    try {
                        const meta = await shorekeeper.groupMetadata(jid);
                        namaGrup = meta.subject || jid;
                    } catch (e) {}
                    teks += `*${no++}.* ${namaGrup}\n`;
                }

                // Simpan list sementara untuk state machine
                global._delBlList = blList;
                global._blState = global._blState || {};
                global._blState[m.sender] = { step: 'delbl', chat: m.chat };

                // Handler sementara untuk delbl state
                global._jpmState = global._jpmState || {};

                Reply(teks);
            }
            break;

            case "blpilih": {
                if (!isCreator) return Reply(global.mess.owner);

                await Reply(global.mess.wait);
                const allGrupBl = await shorekeeper.groupFetchAllParticipating();
                const grupArrBl = Object.entries(allGrupBl);
                if (grupArrBl.length === 0) return Reply("❌ Bot tidak berada di grup manapun.");

                global._blPilihList = grupArrBl.map(([id, meta]) => ({ id, name: meta.subject || id }));
                global._blState = global._blState || {};
                global._blState[m.sender] = { step: 'pilih_nomor', chat: m.chat };

                let teks = `\`⌜ Blacklist Pilih Grup ⌟\`\n> ◦ Total : *${grupArrBl.length} Grup*\n> ◦ Ketik nomor untuk toggle blacklist\n> ◦ [BL] = sudah di-blacklist\n> ◦ Contoh: *1.2.3*\n\n`;
                global._blPilihList.forEach((g, i) => {
                    const bl = global.db.groups[g.id]?.blacklistjpm ? ' [BL]' : '';
                    teks += `*${i+1}.* ${g.name}${bl}\n`;
                });
                Reply(teks);
            }
            break;

            // ==================== BAILEYS-MBUILDER DEMO (sama seperti Hitoshi MD V1 new update v12) ====================
            case "button": {
                try {
                    const imageUrl = global.image?.menu || 'https://cdn-alip.clutch.web.id/api/u/mvnbdijm.jpg';
                    const btn = new Button(shorekeeper)
                        .setTitle(`${global.botname || 'Diezy'} AI`)
                        .setBody('`⌜ Demo Button ⌟`\n> ◦ Contoh kartu interaktif pakai baileys-mbuilder')
                        .setFooter(global.footer || 'Hitoshi MD V1')
                        .setImage(imageUrl)
                        .addReply('📜 Menu', `${command.length ? '.' : ''}menu`)
                        .addUrl('🌐 Channel', 'https://whatsapp.com/channel/0029VaBOlsv002TEjlntTE2D')
                        .addCopy('📋 Copy Prefix', '.');
                    await btn.send(m.chat, { quoted: m });
                } catch (err) {
                    console.error('button demo error:', err);
                    Reply(`❌ Gagal kirim button: ${err.message}`);
                }
            }
            break;

            case "buttonv2": {
                try {
                    const imageUrl = global.image?.menu || 'https://cdn-alip.clutch.web.id/api/u/mvnbdijm.jpg';
                    const btn2 = new ButtonV2(shorekeeper)
                        .setTitle(`${global.botname || 'Diezy'} AI`)
                        .setSubtitle('Demo ButtonV2')
                        .setBody('`⌜ Demo ButtonV2 ⌟`\n> ◦ Contoh tombol gaya lama (buttonsMessage)')
                        .setFooter(global.footer || 'Hitoshi MD V1')
                        .setThumbnail(imageUrl)
                        .addButton('📜 Menu', '.menu')
                        .addButton('ℹ️ Info', '.info');
                    await btn2.send(m.chat, { quoted: m });
                } catch (err) {
                    console.error('buttonv2 demo error:', err);
                    Reply(`❌ Gagal kirim buttonv2: ${err.message}`);
                }
            }
            break;

            case "carousel":
            case "korsel": {
                try {
                    const imageUrl = global.image?.menu || 'https://cdn-alip.clutch.web.id/api/u/mvnbdijm.jpg';
                    const carousel = new Carousel(shorekeeper)
                        .setBody('`⌜ Demo Carousel ⌟`\n> ◦ Geser untuk lihat kartu lain')
                        .setFooter(global.footer || 'Hitoshi MD V1');

                    carousel
                        .card((c) => c
                            .image(imageUrl)
                            .title('Kartu 1 - Menu')
                            .text('Lihat semua fitur bot')
                            .addReply('📜 Buka Menu', '.menu'))
                        .card((c) => c
                            .image(imageUrl)
                            .title('Kartu 2 - Owner')
                            .text('Hubungi developer')
                            .addUrl('💬 Hubungi', 'https://wa.me/' + String(global.owner || '').replace(/[^0-9]/g, '')))
                        .card((c) => c
                            .image(imageUrl)
                            .title('Kartu 3 - Channel')
                            .text('Update info & fitur terbaru')
                            .addUrl('🌐 Join Channel', 'https://whatsapp.com/channel/0029VaBOlsv002TEjlntTE2D'));

                    await carousel.send(m.chat, { quoted: m });
                } catch (err) {
                    console.error('carousel demo error:', err);
                    Reply(`❌ Gagal kirim carousel: ${err.message}`);
                }
            }
            break;

            case "richmenu": {
                try {
                    const rich = new AIRich(shorekeeper)
                        .addText(`*${global.botname || 'Diezy'} AI*\n\nContoh rich message (AIRich) pakai baileys-mbuilder — mendukung teks, gambar, tabel, kode, dan saran lanjutan.`)
                        .addImage(global.image?.menu || 'https://cdn-alip.clutch.web.id/api/u/mvnbdijm.jpg')
                        .addSuggest(['Lihat menu', 'Info owner', 'Cara sewa bot']);

                    await rich.send(m.chat);
                } catch (err) {
                    console.error('richmenu demo error:', err);
                    Reply(`❌ Gagal kirim rich message: ${err.message}`);
                }
            }
            break;
        } // end switch
    } catch (err) {
        console.error(err)
    }
}

handler.validCommands = validCommandsList;
module.exports = handler;

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    console.log(chalk.blue('Update'), __filename)
    delete require.cache[file]
    try {
        delete require.cache[require.resolve('./source/game')]
    } catch (e) {}
    require(file)
});