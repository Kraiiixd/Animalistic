/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

require('../settings');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const FileType = require('file-type');
const PhoneNumber = require('awesome-phonenumber');

const { imageToWebp, videoToWebp, writeExif } = require('../library/exif');
const { isUrl, getGroupAdmins, generateMessageTag, getBuffer, getSizeMedia } = require('../library/function');
const { jidNormalizedUser, proto, getBinaryNodeChildren, getBinaryNodeChild, generateWAMessageContent, generateForwardMessageContent, prepareWAMessageMedia, delay, areJidsSameUser, extractMessageContent, generateMessageID, downloadContentFromMessage, generateWAMessageFromContent, jidDecode, generateWAMessage, toBuffer, getContentType, getDevice } = require('@whiskeysockets/baileys');
const { getAfk, removeAfk, formatDuration: formatAfkDuration } = require('../source/afk');

const getOwnerNumbers = () => {
    try {
        const ownerFile = './library/database/owner.json';
        const fileOwners = fs.existsSync(ownerFile) ? JSON.parse(fs.readFileSync(ownerFile)) : [];
        const list = [global.owner, ...(Array.isArray(fileOwners) ? fileOwners : [])];
        return list.map(v => String(v).replace(/[^0-9]/g, '')).filter(Boolean);
    } catch {
        return [String(global.owner).replace(/[^0-9]/g, '')].filter(Boolean);
    }
};

global.lidMap = global.lidMap || {};

const recordLidMapping = (participants, metadata) => {
    if (metadata) {
        if (metadata.owner && metadata.ownerLid) {
            const oPhone = String(metadata.owner).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            const oLid = String(metadata.ownerLid).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            if (oPhone && oLid) global.lidMap[oLid] = oPhone;
        }
        if (metadata.subjectOwner && metadata.subjectOwnerLid) {
            const sPhone = String(metadata.subjectOwner).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            const sLid = String(metadata.subjectOwnerLid).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            if (sPhone && sLid) global.lidMap[sLid] = sPhone;
        }
        if (metadata.descOwner && metadata.descOwnerLid) {
            const dPhone = String(metadata.descOwner).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            const dLid = String(metadata.descOwnerLid).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            if (dPhone && dLid) global.lidMap[dLid] = dPhone;
        }
    }
    if (!Array.isArray(participants)) return;
    for (const p of participants) {
        let lid = '';
        let phone = '';

        const fields = [p.id, p.jid, p.lid, p.phoneNumber].filter(Boolean);
        for (const f of fields) {
            const str = String(f);
            if (str.includes('@lid')) {
                lid = str.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            } else if (str.includes('@s.whatsapp.net')) {
                phone = str.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            } else if (!str.includes('@') && str.replace(/[^0-9]/g, '').length > 5) {
                phone = str.split(':')[0].replace(/[^0-9]/g, '');
            }
        }

        if (lid && phone) {
            global.lidMap[lid] = phone;
        }
    }
};

const resolveLidToPhone = (jid, metadata) => {
    if (!jid || typeof jid !== 'string') return jid;
    const cleanJid = jid.split(':')[0];
    const rawNum = cleanJid.split('@')[0].replace(/[^0-9]/g, '');
    if (!rawNum) return cleanJid;
    
    if (metadata?.participants) {
        recordLidMapping(metadata.participants, metadata);
        const found = metadata.participants.find(p => {
            const fields = [p.id, p.jid, p.lid, p.phoneNumber].filter(Boolean).map(x => String(x).split('@')[0].split(':')[0].replace(/[^0-9]/g, ''));
            return fields.includes(rawNum);
        });
        if (found) {
            const fields = [found.jid, found.id, found.phoneNumber, found.lid].filter(Boolean);
            for (const f of fields) {
                const str = String(f);
                if (str.includes('@s.whatsapp.net')) {
                    return str.split(':')[0];
                }
            }
            for (const f of fields) {
                const str = String(f);
                if (!str.includes('@lid')) {
                    const num = str.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                    if (num) return num + '@s.whatsapp.net';
                }
            }
        }
    }
    
    if (global.lidMap && global.lidMap[rawNum]) {
        return global.lidMap[rawNum] + '@s.whatsapp.net';
    }
    
    return cleanJid;
};

const isSenderOwner = (m, shorekeeper) => {
    if (!m) return false;
    if (m.key?.fromMe || m.fromMe) return true;
    if (m.isDeveloper) return true;

    const ownerNums = getOwnerNumbers();
    const botNumberOnly = shorekeeper?.user?.id ? shorekeeper.decodeJid(shorekeeper.user.id).split(':')[0].replace(/[^0-9]/g, '') : '';
    const botLid = shorekeeper?.user?.lid ? shorekeeper.decodeJid(shorekeeper.user.lid).split(':')[0].replace(/[^0-9]/g, '') : '';

    const checkNumber = (raw) => {
        if (!raw) return false;
        const clean = String(raw).split(':')[0].replace(/[^0-9]/g, '');
        if (!clean) return false;
        if (botNumberOnly && clean === botNumberOnly) return true;
        if (botLid && clean === botLid) return true;
        if (ownerNums.includes(clean)) return true;
        if (global.lidMap && global.lidMap[clean]) {
            const mappedPhone = global.lidMap[clean];
            if (ownerNums.includes(mappedPhone) || (botNumberOnly && mappedPhone === botNumberOnly)) return true;
        }
        return false;
    };

    if (checkNumber(m.sender)) return true;
    if (checkNumber(m.key?.participant)) return true;
    if (checkNumber(m.participant)) return true;

    if (m.metadata?.participants) {
        recordLidMapping(m.metadata.participants, m.metadata);
        const senderRaw = (m.sender || m.key?.participant || '').split(':')[0].replace(/[^0-9]/g, '');
        const p = m.metadata.participants.find(x => {
            const fields = [x.id, x.jid, x.lid, x.phoneNumber].filter(Boolean).map(val => String(val).split('@')[0].split(':')[0].replace(/[^0-9]/g, ''));
            return fields.includes(senderRaw);
        });
        if (p) {
            const pPhone = resolveLidToPhone(p.jid || p.id || p.phoneNumber || '', m.metadata);
            const pNum = pPhone.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            if (ownerNums.includes(pNum) || (botNumberOnly && pNum === botNumberOnly)) return true;
        }
    }

    return false;
};

async function LoadDataBase(shorekeeper, m) {
	try {
		const botNumber = await shorekeeper.decodeJid(shorekeeper.user.id);
		const isNumber = x => typeof x === 'number' && !isNaN(x)
		const isBoolean = x => typeof x === 'boolean' && Boolean(x)

let setBot = global.db.settings
if (typeof setBot !== 'object') global.db.settings = {}
if (setBot) {
    if (!('autoread' in setBot)) setBot.autoread = false
    if (!('autotyping' in setBot)) setBot.autotyping = false
    if (!('isPublic' in setBot)) setBot.isPublic = true
    if (!('prefixMode' in setBot)) setBot.prefixMode = true
} else {
    global.db.settings = {
        autoread: false,
        autotyping: false,
        isPublic: true,
        prefixMode: true,
    }
}
let user = global.db.users[m.sender]
if (typeof user !== 'object') global.db.users[m.sender] = {}
if (!user) {
    global.db.users[m.sender] = {}
}
if (m.isGroup) {
  let group = global.db.groups[m.chat]
  if (typeof group !== 'object') global.db.groups[m.chat] = {}
  if (group) {
    if (!('welcome' in group)) group.welcome = false
    if (!('left' in group)) group.left = false
    if (!('welcomeMessage' in group)) group.welcomeMessage = ''
    if (!('leftMessage' in group)) group.leftMessage = ''
    if (!('antilink' in group)) group.antilink = false
    if (!('antilink2' in group)) group.antilink2 = false
    if (!('antilinkGroup' in group)) group.antilinkGroup = false
    if (!('antilinkChannel' in group)) group.antilinkChannel = false
    if (!('antilinkWa' in group)) group.antilinkWa = false
    if (!('antilinkAll' in group)) group.antilinkAll = false
    if (!('antilinkCapcut' in group)) group.antilinkCapcut = false
    if (!('antiPromosi' in group)) group.antiPromosi = false
    if (!('antibot' in group)) group.antibot = false
    if (!('antibotkick' in group)) group.antibotkick = false
    if (!('antispam' in group)) group.antispam = false
    if (!('antitagall' in group)) group.antitagall = false
    if (!('antihidetag' in group)) group.antihidetag = false
    if (!('antibadword' in group)) group.antibadword = false
    if (!('antiToxic' in group)) group.antiToxic = false
    if (!('antiToxicKick' in group)) group.antiToxicKick = false
    if (!('antiswgc' in group)) group.antiswgc = false
    if (!('antiswgc_kick' in group)) group.antiswgc_kick = false
    if (!('antitagsw' in group)) group.antitagsw = false
    if (!('antitagswkick' in group)) group.antitagswkick = false
    if (!('antifoto' in group)) group.antifoto = false
    if (!('antivideo' in group)) group.antivideo = false
    if (!('antiaudio' in group)) group.antiaudio = false
    if (!('antisticker' in group)) group.antisticker = false
    if (!('antidelete' in group)) group.antidelete = false
    if (!('autodownload' in group)) group.autodownload = false
    if (!('notifgempa' in group)) group.notifgempa = false
    if (!('onlyAdminMode' in group)) group.onlyAdminMode = false
    if (!('autoOpen' in group)) group.autoOpen = false
    if (!('autoOpenTime' in group)) group.autoOpenTime = '06:00'
    if (!('autoOpenMessage' in group)) group.autoOpenMessage = ''
    if (!('autoClose' in group)) group.autoClose = false
    if (!('autoCloseTime' in group)) group.autoCloseTime = '00:00'
    if (!('autoCloseMessage' in group)) group.autoCloseMessage = ''
    if (!('mute' in group)) group.mute = false
  } else {
    global.db.groups[m.chat] = {
        welcome: false,
        left: false,
        welcomeMessage: '',
        leftMessage: '',
        antilink: false,
        antilink2: false,
        antilinkGroup: false,
        antilinkChannel: false,
        antilinkWa: false,
        antilinkAll: false,
        antilinkCapcut: false,
        antiPromosi: false,
        antibot: false,
        antibotkick: false,
        antispam: false,
        antitagall: false,
        antihidetag: false,
        antibadword: false,
        antiToxic: false,
        antiToxicKick: false,
        antiswgc: false,
        antiswgc_kick: false,
        antitagsw: false,
        antitagswkick: false,
        antifoto: false,
        antivideo: false,
        antiaudio: false,
        antisticker: false,
        antidelete: false,
        autodownload: false,
        notifgempa: false,
        onlyAdminMode: false,
        autoOpen: false,
        autoOpenTime: '06:00',
        autoOpenMessage: '',
        autoClose: false,
        autoCloseTime: '00:00',
        autoCloseMessage: '',
        mute: false
    }
  }
}

	} catch (e) {
		throw e;
	}
}

async function MessagesUpsert(shorekeeper, message, store) {
  try {
    let botNumber = await shorekeeper.decodeJid(shorekeeper.user.id);
    const msg = message.messages[0];
    if (global.sentKeys && global.sentKeys.has(msg.key?.id)) return;
    const remoteJid = msg.key.remoteJid;

    
    store.messages[remoteJid] ??= {};
    store.messages[remoteJid].array ??= [];
    store.messages[remoteJid].keyId ??= new Set();
    
    if (!(store.messages[remoteJid].keyId instanceof Set)) {
      store.messages[remoteJid].keyId = new Set(store.messages[remoteJid].array.map(m => m.key.id));
    }
    
    if (store.messages[remoteJid].keyId.has(msg.key.id)) return;
    store.messages[remoteJid].array.push(msg);
    store.messages[remoteJid].keyId.add(msg.key.id);
    
    if (store.messages[remoteJid].array.length > (global.chatLength || 250)) {
      const removed = store.messages[remoteJid].array.shift();
      store.messages[remoteJid].keyId.delete(removed.key.id);
    }

    const type = msg.message ? (getContentType(msg.message) || Object.keys(msg.message)[0]) : '';

    if (msg.key?.remoteJid === 'status@broadcast') {
        if (global.db.settings.readsw === true) {
            await shorekeeper.readMessages([msg.key]).catch(() => {});
        }
        return; 
    }
    if (!msg.message) return;
    if (!shorekeeper.public && !msg.key.fromMe && message.type === 'notify') {
      const sender = shorekeeper.decodeJid(msg.key.participant || msg.key.remoteJid || '');
      const senderNumber = sender.replace(/[^0-9]/g, '');
      const ownerNumbers = getOwnerNumbers();
      if (!ownerNumbers.includes(senderNumber)) return;
    }

    if (global.db.settings.autoread === true) {
      await shorekeeper.readMessages([msg.key]);
    }

    if (global.db.settings.autotyping === true && !msg.key.fromMe) {
      await shorekeeper.sendPresenceUpdate('composing', msg.key.remoteJid);
    }

    // Anti Delete Restore
    const protoMsg = msg.message?.protocolMessage;
    if (protoMsg && (protoMsg.type === 0 || protoMsg.type === 'REVOKE' || protoMsg.type === proto?.Message?.ProtocolMessage?.Type?.REVOKE)) {
        const deletedKeyId = protoMsg.key?.id;
        const jid = msg.key?.remoteJid;
        if (jid && jid.endsWith('@g.us') && global.db?.groups?.[jid]?.antidelete && deletedKeyId) {
            const cached = global.db.groups[jid]?.antideleteMessages?.[deletedKeyId];
            if (cached) {
                delete global.db.groups[jid].antideleteMessages[deletedKeyId];
                let caption = `╭┈┈⬡「 ᴀɴᴛɪ ᴅᴇʟᴇᴛᴇ 」\n`;
                caption += `┃ ✧ ᴘᴇɴɢɪʀɪᴍ : @${cached.sender.split('@')[0]}\n`;
                caption += `┃ ✧ ᴡᴀᴋᴛᴜ    : ${cached.time} WIB\n`;
                caption += `┃ ✧ ᴘᴇsᴀɴ    : ${cached.text || '(Non-teks / Media)'}\n`;
                caption += `╰┈┈┈┈┈┈┈┈┈⬡`;
                await shorekeeper.sendMessage(jid, { text: caption, mentions: [cached.sender] }).catch(() => {});
            }
        }
        return;
    }

    const m = await Serialize(shorekeeper, msg, store);

    // Anti Delete Record
    if (m.isGroup && global.db?.groups?.[m.chat]?.antidelete && m.id) {
        if (!global.db.groups[m.chat].antideleteMessages) global.db.groups[m.chat].antideleteMessages = {};
        global.db.groups[m.chat].antideleteMessages[m.id] = {
            text: m.body || m.text || '',
            type: m.type,
            sender: m.sender,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
        setTimeout(() => {
            if (global.db?.groups?.[m.chat]?.antideleteMessages?.[m.id]) {
                delete global.db.groups[m.chat].antideleteMessages[m.id];
            }
        }, 5 * 60 * 1000);
    }

    const isGroupBotTarget = m.isGroup && (global.db?.groups?.[m.chat]?.antibot || global.db?.groups?.[m.chat]?.antibotkick);
    if (m.isBaileys && !isGroupBotTarget) return;

    // Sewa GC check
    if (m.isGroup) {
        const isOwner = isSenderOwner(m, shorekeeper);
        
        if (!isOwner) {
            try {
                const sistemSewaPath = './library/database/sistemsewa.json';
                const sewaPath = './library/database/sewagrup.json';
                
                let isSewaEnabled = true;
                if (fs.existsSync(sistemSewaPath)) {
                    isSewaEnabled = JSON.parse(fs.readFileSync(sistemSewaPath)).enabled === true;
                }
                
                if (isSewaEnabled) {
                    let isSewa = false;
                    if (fs.existsSync(sewaPath)) {
                        const sewagrup = JSON.parse(fs.readFileSync(sewaPath));
                        isSewa = sewagrup.some(v => v.jid === m.chat && v.expired > Date.now());
                    }
                    if (!isSewa) {
                        const commandModule = require('../kurezamd.js');
                        const validCommands = commandModule.validCommands || [];
                        
                        let isCmd = false;
                        if (typeof m.body === 'string' && m.body.length > 0) {
                            const trimmedBody = m.body.trim();
                            const hasPrefix = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^/]/i.test(trimmedBody);
                            if (!hasPrefix) {
                                const rawCmd = trimmedBody.split(/ +/)[0].toLowerCase();
                                isCmd = validCommands.includes(rawCmd);
                            }
                        }

                        if (isCmd) {
                            // Blokir command dari member biasa, tapi lanjutkan jika owner
                            if (!global.expiredSewaNotify) global.expiredSewaNotify = {};
                            const lastNotified = global.expiredSewaNotify[m.chat] || 0;
                            const now = Date.now();
                            
                            // 12 hours cooldown
                            if (now - lastNotified > 12 * 60 * 60 * 1000) {
                                global.expiredSewaNotify[m.chat] = now;
                                await shorekeeper.sendMessage(m.chat, {
                                    text: `\`⌜ Verification Group ⌟\`\n> ◦ Status : *Belum Terdaftar Sewa*\n> ◦ Hubungi : *wa.me/${global.owner}*`
                                }, { quoted: m });
                            }
                            return; // Blokir command untuk non-owner di grup non-sewa
                        }
                        // Bukan command (pesan biasa) di grup non-sewa → lanjutkan processing
                    }
                }
            } catch (e) {
                console.error("Error in sewa check:", e);
            }
        }
    }

    // Mute check
    if (m.isGroup && global.db.groups[m.chat]?.mute === true) {
        const isOwner = isSenderOwner(m, shorekeeper);
        if (!isOwner) return; // Ignore message if bot is muted
    }

    // Only Admin Mode check
    if (m.isGroup && global.db.groups[m.chat]?.onlyAdminMode === true) {
        const isOwner = isSenderOwner(m, shorekeeper);
        if (!m.isAdmin && !isOwner) {
            const isCmdText = typeof m.body === 'string' && /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^/]/.test(m.body.trim());
            if (isCmdText) return; // Silent block commands from non-admin
        }
    }

    // Auto-responders for group settings
    if (m.isGroup && global.db.groups[m.chat] && !m.isAdmin && !isSenderOwner(m, shorekeeper) && shorekeeper.user && m.sender !== shorekeeper.decodeJid(shorekeeper.user.id) && !m.key.fromMe) {
        const groupData = global.db.groups[m.chat];
        const isBotAdmin = m.isBotAdmin;
        
        if (isBotAdmin) {
            // 1. Anti Bot Check
            const isBotDetected = m.isBot || (m.isBaileys && !m.key.fromMe);
            if (isBotDetected) {
                if (groupData.antibotkick) {
                    await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                    await shorekeeper.sendMessage(m.chat, {
                        text: `╭┈┈⬡「 ᴀɴᴛɪ ʙᴏᴛ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ ɪɴꜰᴏ   : Bot lain terdeteksi\n┃ ✧ ᴀᴋsɪ   : Dikeluarkan dari grup\n╰┈┈┈┈┈┈┈┈┈⬡`,
                        mentions: [m.sender]
                    }).catch(() => {});
                    await shorekeeper.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {});
                    return;
                } else if (groupData.antibot) {
                    await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                    await shorekeeper.sendMessage(m.chat, {
                        text: `╭┈┈⬡「 ᴀɴᴛɪ ʙᴏᴛ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ ɪɴꜰᴏ   : Bot lain terdeteksi\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                        mentions: [m.sender]
                    }).catch(() => {});
                    return;
                }
            }

            // 2. Media Restrictions
            if (groupData.antifoto && (m.type === 'imageMessage' || m.message?.imageMessage)) {
                await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                await shorekeeper.sendMessage(m.chat, {
                    text: `╭┈┈⬡「 ᴀɴᴛɪ ꜰᴏᴛᴏ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ ɪɴꜰᴏ   : Pengiriman foto dilarang di grup ini\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                    mentions: [m.sender]
                }).catch(() => {});
                return;
            }

            if (groupData.antivideo && (m.type === 'videoMessage' || m.message?.videoMessage)) {
                await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                await shorekeeper.sendMessage(m.chat, {
                    text: `╭┈┈⬡「 ᴀɴᴛɪ ᴠɪᴅᴇᴏ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ ɪɴꜰᴏ   : Pengiriman video dilarang di grup ini\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                    mentions: [m.sender]
                }).catch(() => {});
                return;
            }

            if (groupData.antiaudio && (m.type === 'audioMessage' || m.message?.audioMessage)) {
                await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                await shorekeeper.sendMessage(m.chat, {
                    text: `╭┈┈⬡「 ᴀɴᴛɪ ᴀᴜᴅɪᴏ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ ɪɴꜰᴏ   : Pengiriman pesan suara dilarang di grup ini\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                    mentions: [m.sender]
                }).catch(() => {});
                return;
            }

            if (groupData.antisticker && (m.type === 'stickerMessage' || m.message?.stickerMessage)) {
                await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                await shorekeeper.sendMessage(m.chat, {
                    text: `╭┈┈⬡「 ᴀɴᴛɪ sᴛɪᴋᴇʀ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ ɪɴꜰᴏ   : Pengiriman stiker dilarang di grup ini\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                    mentions: [m.sender]
                }).catch(() => {});
                return;
            }

            // 3. Anti Promosi
            if (groupData.antiPromosi && m.body) {
                const kataPromosi = [
                    "ijin jual", "lagi jual", "jual murah", "jual cepat", "jualan", "jualan online",
                    "jual barang", "jual produk", "jual jasa", "buka lapak", "lapak jualan", "open order",
                    "promo spesial", "promo besar", "promo gila", "diskon spesial", "harga miring",
                    "cuci gudang", "clearance sale", "open po", "pre order", "stock terbatas",
                    "ready stock", "stok terbatas", "barang ready", "order sekarang", "official store"
                ];
                if (kataPromosi.some(kw => m.body.toLowerCase().includes(kw))) {
                    await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                    await shorekeeper.sendMessage(m.chat, {
                        text: `╭┈┈⬡「 ᴀɴᴛɪ ᴘʀᴏᴍᴏsɪ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ ɪɴꜰᴏ   : Iklan/promosi dilarang di grup ini\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                        mentions: [m.sender]
                    }).catch(() => {});
                    return;
                }
            }

            // 4. Anti Spam
            if (groupData.antispam) {
                const now = Date.now();
                if (!global.spamWarnings) global.spamWarnings = {};
                if (!global.lastMessages) global.lastMessages = {};
                if (!global.spamWarnings[m.chat]) global.spamWarnings[m.chat] = {};
                if (!global.lastMessages[m.chat]) global.lastMessages[m.chat] = {};

                const userKey = m.sender;
                const userLastMsg = global.lastMessages[m.chat][userKey] || { time: 0, count: 0 };
                const timeDiff = now - userLastMsg.time;

                if (timeDiff < 2000) {
                    userLastMsg.count++;
                    if (userLastMsg.count >= 3) {
                        const userWarnings = (global.spamWarnings[m.chat][userKey] || 0) + 1;
                        global.spamWarnings[m.chat][userKey] = userWarnings;
                        const maxWarn = 3;

                        if (userWarnings < maxWarn) {
                            await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                            await shorekeeper.sendMessage(m.chat, {
                                text: `╭┈┈⬡「 ᴀɴᴛɪ sᴘᴀᴍ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ sᴛᴀᴛᴜs : Peringatan (${userWarnings}/${maxWarn})\n┃ ✧ ᴀᴋsɪ   : Pesan spam dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                                mentions: [m.sender]
                            }).catch(() => {});
                        } else {
                            await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                            await shorekeeper.sendMessage(m.chat, {
                                text: `╭┈┈⬡「 ᴀɴᴛɪ sᴘᴀᴍ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ sᴛᴀᴛᴜs : Peringatan ke-${maxWarn} tercapai\n┃ ✧ ᴀᴋsɪ   : Dikeluarkan dari grup\n╰┈┈┈┈┈┈┈┈┈⬡`,
                                mentions: [m.sender]
                            }).catch(() => {});
                            await shorekeeper.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {});
                            delete global.spamWarnings[m.chat][userKey];
                            delete global.lastMessages[m.chat][userKey];
                        }
                        userLastMsg.count = 0;
                        return;
                    }
                } else {
                    userLastMsg.count = 1;
                }
                userLastMsg.time = now;
                global.lastMessages[m.chat][userKey] = userLastMsg;
            }

            // 5. Badword / Toxic check
            if ((groupData.antibadword === true || groupData.antiToxic === true || groupData.antiToxicKick === true) && m.body) {
                const badwordsPath = './library/database/badwords.json';
                let badwords = { words: [] };
                if (fs.existsSync(badwordsPath)) {
                    try { badwords = JSON.parse(fs.readFileSync(badwordsPath)); } catch(e) {}
                }
                const words = m.body.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
                let isToxic = false;
                for (const word of words) {
                    const cleanWord = word.replace(/[^a-z0-9]/gi, '');
                    if (badwords.words.includes(cleanWord)) {
                        isToxic = true;
                        break;
                    }
                }
                
                if (isToxic) {
                    await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                    if (groupData.antiToxicKick === true) {
                        await shorekeeper.sendMessage(m.chat, {
                            text: `╭┈┈⬡「 ᴀɴᴛɪ ᴛᴏxɪᴄ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split("@")[0]}\n┃ ✧ ɪɴꜰᴏ   : Menggunakan kata kasar terlarang\n┃ ✧ ᴀᴋsɪ   : Pesan dihapus & dikeluarkan dari grup\n╰┈┈┈┈┈┈┈┈┈⬡`,
                            mentions: [m.sender]
                        }).catch(() => {});
                        await shorekeeper.groupParticipantsUpdate(m.chat, [m.sender], "remove").catch(() => {});
                    } else {
                        await shorekeeper.sendMessage(m.chat, {
                            text: `╭┈┈⬡「 ᴀɴᴛɪ ᴛᴏxɪᴄ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split("@")[0]}\n┃ ✧ ɪɴꜰᴏ   : Menggunakan kata kasar terlarang\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                            mentions: [m.sender]
                        }).catch(() => {});
                    }
                    return;
                }
            }

            // 6. Anti SWGC Check (Share Story / Status WhatsApp to Group)
            const isSwgc = m.type === 'groupStatusMentionMessage' || 
                           Boolean(m.message?.groupStatusMentionMessage) || 
                           Boolean(m.message?.broadcastMessage) || 
                           m.msg?.contextInfo?.remoteJid === 'status@broadcast' || 
                           m.quoted?.chat === 'status@broadcast' ||
                           m.msg?.contextInfo?.participant === 'status@broadcast';

            if (isSwgc) {
                if (groupData.antiswgc_kick === true || groupData.antiswgc === 'kick') {
                    await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                    await shorekeeper.sendMessage(m.chat, {
                        text: `╭┈┈⬡「 ᴀɴᴛɪ sᴡ ɢᴄ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ ɪɴꜰᴏ   : Membagikan status WhatsApp ke grup\n┃ ✧ ᴀᴋsɪ   : Pesan dihapus & dikeluarkan dari grup\n╰┈┈┈┈┈┈┈┈┈⬡`,
                        mentions: [m.sender]
                    }).catch(() => {});
                    await shorekeeper.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {});
                    return;
                } else if (groupData.antiswgc === true || groupData.antiswgc === 'delete') {
                    await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                    await shorekeeper.sendMessage(m.chat, {
                        text: `╭┈┈⬡「 ᴀɴᴛɪ sᴡ ɢᴄ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ ɪɴꜰᴏ   : Membagikan status WhatsApp ke grup\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                        mentions: [m.sender]
                    }).catch(() => {});
                    return;
                }
            }

            // 7. Anti Tag SW Check (Mention / Tag Status WhatsApp)
            const isTagSw = m.type === 'groupStatusMentionMessage' || 
                            Boolean(m.message?.groupStatusMentionMessage) || 
                            (m.msg?.contextInfo?.remoteJid === 'status@broadcast' && (m.mentionedJid?.length > 0 || m.msg?.contextInfo?.mentionedJid?.length > 0));

            if (isTagSw) {
                if (groupData.antitagswkick === true || groupData.antitagsw === 'kick') {
                    await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                    await shorekeeper.sendMessage(m.chat, {
                        text: `╭┈┈⬡「 ᴀɴᴛɪ ᴛᴀɢ sᴡ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ ɪɴꜰᴏ   : Mention status WhatsApp ke grup\n┃ ✧ ᴀᴋsɪ   : Pesan dihapus & dikeluarkan dari grup\n╰┈┈┈┈┈┈┈┈┈⬡`,
                        mentions: [m.sender]
                    }).catch(() => {});
                    await shorekeeper.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {});
                    return;
                } else if (groupData.antitagsw === true || groupData.antitagsw === 'delete') {
                    await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                    await shorekeeper.sendMessage(m.chat, {
                        text: `╭┈┈⬡「 ᴀɴᴛɪ ᴛᴀɢ sᴡ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ ɪɴꜰᴏ   : Mention status WhatsApp ke grup\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                        mentions: [m.sender]
                    }).catch(() => {});
                    return;
                }
            }
        
            // 8. Antihidetag
            if (groupData.antihidetag === true && m.mentionedJid && m.mentionedJid.length > 10) {
                await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                await shorekeeper.sendMessage(m.chat, {
                    text: `╭┈┈⬡「 ᴀɴᴛɪ ʜɪᴅᴇᴛᴀɢ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ ɪɴꜰᴏ   : Hidetag / tag massal terdeteksi\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                    mentions: [m.sender]
                }).catch(() => {});
                return;
            }

            // 9. Anti Tag All
            if (groupData.antitagall === true && m.mentionedJid && m.mentionedJid.length > 5) {
                await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                await shorekeeper.sendMessage(m.chat, {
                    text: `╭┈┈⬡「 ᴀɴᴛɪ ᴛᴀɢ ᴀʟʟ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split('@')[0]}\n┃ ✧ ɪɴꜰᴏ   : Tag massal dilarang di grup ini\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                    mentions: [m.sender]
                }).catch(() => {});
                return;
            }
            
            // 10. Links checks
            const regexLink = /(https?:\/\/)?(chat\.whatsapp\.com|wa\.me|whatsapp\.com(\/channel)?|buka\s?tautan\s?ini\s?untuk\s?bergabung\s?ke\s?grup\s?whatsapp)/gi;
            const regexWaLink = /wa\.me|api\.whatsapp\.com\/send|wa\.link/i;
            const regexAllLinks = /(https?:\/\/[^\s]+)/gi;
            const regexCapcutLink = /(https?:\/\/)?([a-z0-9-]+\.)?capcut\.com\/(t\/|template\/)/i;
            const regexChannelLink = /whatsapp\.com\/channel\/[a-zA-Z0-9]+/i;
            const regexGroupLink = /chat\.whatsapp\.com\/[a-zA-Z0-9]+/i;
            
            const isThisGroupLink = async (text, chatId) => {
                try {
                    const gclink = `https://chat.whatsapp.com/${await shorekeeper.groupInviteCode(chatId)}`;
                    const isLinkThisGc = new RegExp(gclink, 'i');
                    return isLinkThisGc.test(text);
                } catch {
                    return false;
                }
            };
            
            if (m.body) {
                const hasLink = regexLink.test(m.body);
                const hasWaLink = regexWaLink.test(m.body);
                const hasAllLink = regexAllLinks.test(m.body);
                const hasCapcut = regexCapcutLink.test(m.body);
                const hasChannel = regexChannelLink.test(m.body);
                const hasGcLink = regexGroupLink.test(m.body);
                
                // Antilink CapCut
                if (groupData.antilinkCapcut === true && hasCapcut) {
                    await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                    await shorekeeper.sendMessage(m.chat, {
                        text: `╭┈┈⬡「 ᴀɴᴛɪ ʟɪɴᴋ ᴄᴀᴘᴄᴜᴛ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split("@")[0]}\n┃ ✧ ɪɴꜰᴏ   : Link template CapCut terdeteksi\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                        mentions: [m.sender]
                    }).catch(() => {});
                    return;
                }

                // Antilink Saluran
                if (groupData.antilinkChannel === true && hasChannel) {
                    await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                    await shorekeeper.sendMessage(m.chat, {
                        text: `╭┈┈⬡「 ᴀɴᴛɪ ʟɪɴᴋ sᴀʟᴜʀᴀɴ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split("@")[0]}\n┃ ✧ ɪɴꜰᴏ   : Link saluran WhatsApp terdeteksi\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                        mentions: [m.sender]
                    }).catch(() => {});
                    return;
                }

                // Antilink Kick
                if (groupData.antilink === true && hasLink) {
                    if (!(await isThisGroupLink(m.body, m.chat))) {
                        await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                        await shorekeeper.sendMessage(m.chat, {
                            text: `╭┈┈⬡「 ᴀɴᴛɪ ʟɪɴᴋ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split("@")[0]}\n┃ ✧ ɪɴꜰᴏ   : Link grup luar terdeteksi\n┃ ✧ ᴀᴋsɪ   : Pesan dihapus & dikeluarkan dari grup\n╰┈┈┈┈┈┈┈┈┈⬡`,
                            mentions: [m.sender]
                        }).catch(() => {});
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await shorekeeper.groupParticipantsUpdate(m.chat, [m.sender], "remove").catch(() => {});
                        return;
                    }
                }
                
                // Antilink 2 / Group (delete only)
                if ((groupData.antilink2 === true || groupData.antilinkGroup === true) && (hasLink || hasGcLink)) {
                    if (!(await isThisGroupLink(m.body, m.chat))) {
                        await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                        await shorekeeper.sendMessage(m.chat, {
                            text: `╭┈┈⬡「 ᴀɴᴛɪ ʟɪɴᴋ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split("@")[0]}\n┃ ✧ ɪɴꜰᴏ   : Link grup luar terdeteksi\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                            mentions: [m.sender]
                        }).catch(() => {});
                        return;
                    }
                }
                
                // Antilink Wa
                if (groupData.antilinkWa === true && hasWaLink) {
                    await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                    await shorekeeper.sendMessage(m.chat, {
                        text: `╭┈┈⬡「 ᴀɴᴛɪ ʟɪɴᴋ ᴡᴀ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split("@")[0]}\n┃ ✧ ɪɴꜰᴏ   : Link wa.me terdeteksi\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                        mentions: [m.sender]
                    }).catch(() => {});
                    return;
                }
                
                // Antilink All
                if (groupData.antilinkAll === true && hasAllLink) {
                    if (!(await isThisGroupLink(m.body, m.chat))) {
                        await shorekeeper.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                        await shorekeeper.sendMessage(m.chat, {
                            text: `╭┈┈⬡「 ᴀɴᴛɪ ʟɪɴᴋ ᴀʟʟ 」\n┃ ✧ ᴜsᴇʀ   : @${m.sender.split("@")[0]}\n┃ ✧ ɪɴꜰᴏ   : Tautan URL terdeteksi\n┃ ✧ ᴀᴋsɪ   : Pesan otomatis dihapus\n╰┈┈┈┈┈┈┈┈┈⬡`,
                            mentions: [m.sender]
                        }).catch(() => {});
                        return;
                    }
                }
            }
        }
    }

    // ==================== AFK HANDLER ====================
    if (m.isGroup && !m.key.fromMe) {
        // 1. Jika pengirim sebelumnya AFK dan sekarang mengirim pesan (bukan command afk baru), kembalikan dari AFK
        const afkSender = getAfk(m.sender);
        const isAfkCmd = typeof m.body === 'string' && m.body.trim().toLowerCase().startsWith('afk');
        
        if (afkSender && !isAfkCmd) {
            const prevAfk = removeAfk(m.sender);
            if (prevAfk) {
                const durationStr = formatAfkDuration(Date.now() - prevAfk.time);
                await shorekeeper.sendMessage(m.chat, {
                    text: `\`⌜ Berhenti AFK 👋 ⌟\`\n> ◦ *User :* @${m.sender.split('@')[0]}\n> ◦ *Alasan Sebelumnya :* ${prevAfk.reason}\n> ◦ *Durasi AFK :* ${durationStr}\n> ◦ *Status :* Kembali Online`,
                    mentions: [m.sender]
                }, { quoted: m }).catch(() => {});
            }
        }

        // 2. Jika ada orang lain yang me-mention / me-reply user yang sedang AFK
        const mentionedJids = [...(m.mentionedJid || [])];
        if (m.quoted?.sender && !mentionedJids.includes(m.quoted.sender)) {
            mentionedJids.push(m.quoted.sender);
        }

        for (const jid of mentionedJids) {
            if (jid === m.sender) continue;
            const targetAfk = getAfk(jid);
            if (targetAfk) {
                const durationStr = formatAfkDuration(Date.now() - targetAfk.time);
                await shorekeeper.sendMessage(m.chat, {
                    text: `\`⌜ Pengguna Sedang AFK 💤 ⌟\`\n> ◦ *User :* @${jid.split('@')[0]}\n> ◦ *Alasan :* ${targetAfk.reason}\n> ◦ *Sejak :* ${durationStr} yang lalu\n\n> ◦ *Catatan :* Jangan tag dia sampai kembali aktif!`,
                    mentions: [jid]
                }, { quoted: m }).catch(() => {});
                break; // Cukup beritahu 1 kali per pesan
            }
        }
    }

    try {
        delete require.cache[require.resolve('../kurezamd.js')];
        delete require.cache[require.resolve('../source/game.js')];
    } catch (e) {}
    require('../kurezamd.js')(shorekeeper, m, message, store);

    if (type === 'interactiveResponseMessage' && m.quoted && m.quoted.fromMe) {
      const parsedId = JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id;

      let apb = await generateWAMessage(
        m.chat,
        { text: parsedId, mentions: m.mentionedJid },
        { userJid: shorekeeper.user.id, quoted: m.quoted }
      );

      apb.key = msg.key;
      apb.key.fromMe = areJidsSameUser(m.sender, shorekeeper.user.id);
      if (m.isGroup) apb.participant = m.sender;

      let pbr = {
        ...msg,
        messages: [proto.WebMessageInfo.fromObject(apb)],
        type: 'append'
      };

      shorekeeper.ev.emit('messages.upsert', pbr);
    }
  } catch (e) {
    throw e;
  }
}

async function Solving(shorekeeper, store) {
    shorekeeper.public = global.db.settings.isPublic;
    
    shorekeeper.serializeM = (m) => MessagesUpsert(shorekeeper, m, store)
	
	shorekeeper.decodeJid = (jid) => {
		if (!jid) return jid
		if (/:\d+@/gi.test(jid)) {
			let decode = jidDecode(jid) || {}
			return decode.user && decode.server && decode.user + '@' + decode.server || jid
		} else return jid
	}
	
	shorekeeper.getName = async (jid, withoutContact = false) => {
		try {
			const id = shorekeeper.decodeJid(jid);
			if (id.endsWith('@g.us')) {
				const groupInfo = store.contacts[id] || await shorekeeper.groupMetadata(id).catch(_ => ({})) || {};
				return groupInfo.subject || groupInfo.name || PhoneNumber('+' + id.replace('@g.us', '')).getNumber('international');
			} else {
				if (id === '0@s.whatsapp.net') return 'WhatsApp';
				const contactInfo = store.contacts[id] || {};
				return withoutContact ? '' : contactInfo.name || contactInfo.verifiedName || contactInfo.notify || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international');
			}
		} catch {
			return jid.split('@')[0];
		}
	}
	
	shorekeeper.sendContactV2 = async (jid, kon, desk = "Developer Bot", quoted = '', opts = {}) => {
let list = []
for (let i of kon) {
list.push({
displayName: namaOwner,
  vcard: 'BEGIN:VCARD\n' +
    'VERSION:3.0\n' +
    `N:;${namaOwner};;;\n` +
    `FN:${namaOwner}\n` +
    'ORG:null\n' +
    'TITLE:\n' +
    `item1.TEL;waid=${i}:${i}\n` +
    'item1.X-ABLabel:Ponsel\n' +
    `X-WA-BIZ-DESCRIPTION:${desk}\n` +
    `X-WA-BIZ-NAME:${namaOwner}\n` +
    'END:VCARD'
})
}
shorekeeper.sendMessage(jid, { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts }, { quoted })
}
	
	shorekeeper.sendContact = async (jid, kon, quoted = '', opts = {}) => {
		let list = []
		for (let i of kon) {
			list.push({
				displayName: await shorekeeper.getName(i + '@s.whatsapp.net'),
				vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await shorekeeper.getName(i + '@s.whatsapp.net')}\nFN:${await shorekeeper.getName(i + '@s.whatsapp.net')}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Ponsel\nitem2.ADR:;;Indonesia;;;;\nitem2.X-ABLabel:Region\nEND:VCARD`
			})
		}
		shorekeeper.sendMessage(jid, { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts }, { quoted })
	}
	
	shorekeeper.profilePictureUrl = async (jid, type = 'image', timeoutMs) => {
		try {
			const result = await shorekeeper.query({
				tag: 'iq',
				attrs: {
					target: jidNormalizedUser(jid),
					to: '@s.whatsapp.net',
					type: 'get',
					xmlns: 'w:profile:picture'
				},
				content: [{
					tag: 'picture',
					attrs: {
						type, query: 'url'
					},
				}]
			}, timeoutMs);
			const child = getBinaryNodeChild(result, 'picture');
			return child?.attrs?.url;
		} catch {
			return null;
		}
	}
	
	shorekeeper.setStatus = (status) => {
		shorekeeper.query({
			tag: 'iq',
			attrs: {
				to: '@s.whatsapp.net',
				type: 'set',
				xmlns: 'status',
			},
			content: [{
				tag: 'status',
				attrs: {},
				content: Buffer.from(status, 'utf-8')
			}]
		})
		return status
	}
	
	shorekeeper.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
		const quotedOptions = { quoted }
		async function getFileUrl(res, mime) {
			if (mime && mime.includes('gif')) {
				return shorekeeper.sendMessage(jid, { video: res.data, caption: caption, gifPlayback: true, ...options }, quotedOptions);
			} else if (mime && mime === 'application/pdf') {
				return shorekeeper.sendMessage(jid, { document: res.data, mimetype: 'application/pdf', caption: caption, ...options }, quotedOptions);
			} else if (mime && mime.includes('image')) {
				return shorekeeper.sendMessage(jid, { image: res.data, caption: caption, ...options }, quotedOptions);
			} else if (mime && mime.includes('video')) {
				return shorekeeper.sendMessage(jid, { video: res.data, caption: caption, mimetype: 'video/mp4', ...options }, quotedOptions);
			} else if (mime && mime.includes('webp') && !/.jpg|.jpeg|.png/.test(url)) {
				return shorekeeper.sendAsSticker(jid, res.data, quoted, options);
			} else if (mime && mime.includes('audio')) {
				return shorekeeper.sendMessage(jid, { audio: res.data, mimetype: 'audio/mpeg', ...options }, quotedOptions);
			} else {
				return shorekeeper.sendMessage(jid, { document: res.data, mimetype: mime, fileName: url.split('/').pop(), caption: caption, ...options }, quotedOptions);
			}
		}
		
		try {
			const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
			let mime = res.headers['content-type'];
			if (!mime || mime.includes('octet-stream')) {
				const fileType = await FileType.fromBuffer(res.data);
				mime = fileType ? fileType.mime : 'application/octet-stream';
			}
			const hasil = await getFileUrl(res, mime);
			return hasil
		} catch (error) {
			throw new Error(`Failed to download file: ${error.message}`);
		}
	}
	
	shorekeeper.sendTextMentions = async (jid, text, quoted, options = {}) => shorekeeper.sendMessage(jid, { text: text, mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), ...options }, { quoted })
	
	shorekeeper.sendAsSticker = async (jid, path, quoted, options = {}) => {
		const buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
		let buffer
	 if (options && (options.packname || options.author)) {
            buffer = await writeExif(buff, options);
        } else {
            buffer = await videoToWebp(buff);
        }
		await shorekeeper.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
		return buff;
	}
	
	shorekeeper.downloadMediaMessage = async (message) => {
		try {
			const msg = message.msg || message;
			const mime = msg.mimetype || '';
			const messageType = (message.type || mime.split('/')[0]).replace(/Message/gi, '');
			const stream = await downloadContentFromMessage(msg, messageType);
			let buffer = Buffer.from([]);
			for await (const chunk of stream) {
				buffer = Buffer.concat([buffer, chunk]);
			}
			return buffer
		} catch (error) {
			throw new Error(`Failed to download media: ${error.message}`);
		}
	}
	
	shorekeeper.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
		const buffer = await shorekeeper.downloadMediaMessage(message);
		const type = await FileType.fromBuffer(buffer);
		const trueFileName = attachExtension ? `./library/database/sampah/${filename ? filename : Date.now()}.${type.ext}` : filename;
		await fs.promises.writeFile(trueFileName, buffer);
		return trueFileName;
	}
	
	shorekeeper.getFile = async (PATH, save) => {
		let res;
		let filename;
		let data = Buffer.isBuffer(PATH) ? PATH : 
				   /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : 
				   /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : 
				   fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : 
				   typeof PATH === 'string' ? PATH : Buffer.alloc(0)
		
		let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' }
		filename = path.join(__filename, '../library/database/sampah/' + new Date * 1 + '.' + type.ext)
		if (data && save) fs.promises.writeFile(filename, data)
		return {
			res,
			filename,
			size: await getSizeMedia(data),
			...type,
			data
		}
	}
	
	shorekeeper.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
		const { mime, data, filename } = await shorekeeper.getFile(path, true);
		const isWebpSticker = options.asSticker || /webp/.test(mime);
		let type = 'document', mimetype = mime, pathFile = filename;
		
		if (isWebpSticker) {
			const { writeExif } = require('../library/exif');
			const media = { mimetype: mime, data };
			pathFile = await writeExif(media, {
				packname: options.packname || global.packname,
				author: options.author || global.author,
				categories: options.categories || [],
			})
			await fs.promises.unlink(filename);
			type = 'sticker';
			mimetype = 'image/webp';
		} else if (/image|video|audio/.test(mime)) {
			type = mime.split('/')[0];
			mimetype = type == 'video' ? 'video/mp4' : type == 'audio' ? 'audio/mpeg' : mime
		}
		
		let anu = await shorekeeper.sendMessage(jid, { [type]: { url: pathFile }, caption, mimetype, fileName, ...options }, { quoted, ...options });
		await fs.promises.unlink(pathFile);
		return anu;
	}
	
	shorekeeper.appendResponseMessage = async (m, text) => {
		let apb = await generateWAMessage(m.chat, { text, mentions: m.mentionedJid }, { userJid: shorekeeper.user.id, quoted: m.quoted && m.quoted.fakeObj });
		apb.key = m.key
		apb.key.id = [...Array(32)].map(() => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('');
		apb.key.fromMe = areJidsSameUser(m.sender, shorekeeper.user.id);
		if (m.isGroup) apb.participant = m.sender;
		shorekeeper.ev.emit('messages.upsert', {
			...m,
			messages: [proto.WebMessageInfo.fromObject(apb)],
			type: 'append'
		});
	}
	
	return shorekeeper
}

async function Serialize(shorekeeper, msg, store) {
    const botNumber = shorekeeper.decodeJid(shorekeeper.user.id);
    const botrunning = global.owner + '@s.whatsapp.net';
    if (!msg) return msg
    const m = { ...msg };

    if (m.key) {
        m.id = m.key.id
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isBaileys = m.id ? (m.id.startsWith('3EB0') || m.id.startsWith('B1E') || m.id.startsWith('BAE') || m.id.startsWith('3F8')) : false
        
        m.isBot = ['HSK', 'BAE', 'B1E', '3EB0', 'B24E', 'WA'].some(a => m.id.startsWith(a) && [12, 16, 20, 22, 40].includes(m.id.length)) || /(.)\1{5,}|[^a-zA-Z0-9]|[^0-9A-F]/.test(m.id) || false
        
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = shorekeeper.decodeJid(m.fromMe && shorekeeper.user.id || m.key.participant || m.chat || '')

        if (m.isGroup) {
            try {
                m.metadata = shorekeeper.safeGroupMetadata ? await shorekeeper.safeGroupMetadata(m.chat) : await shorekeeper.groupMetadata(m.chat);
            } catch {
                m.metadata = {};
            }

            if (m.metadata?.participants) {
                recordLidMapping(m.metadata.participants, m.metadata);
            }

            if (m.metadata.addressingMode === 'lid' || (m.sender && m.sender.endsWith('@lid')) || (m.key.participant && m.key.participant.endsWith('@lid'))) {
                const resolvedSender = resolveLidToPhone(m.sender || m.key.participant, m.metadata);
                if (resolvedSender && !resolvedSender.endsWith('@lid')) {
                    m.key.participant = m.sender = resolvedSender;
                }
            }
            
            const admins = []
            if (m.metadata?.participants) {
                for (let p of m.metadata.participants) {
                    if (p.admin !== null) {
                        if (p.jid) admins.push(p.jid)
                        if (p.id) admins.push(p.id)
                        if (p.lid) admins.push(p.lid)
                    }
                }
            }
            m.admins = admins
            const checkAdmin = (jid, list) =>
                list.some(x => {
                    const cleanX = (x || '').split(':')[0];
                    const cleanJid = (jid || '').split(':')[0];
                    return cleanX === cleanJid ||
                        (cleanJid.endsWith('@s.whatsapp.net') && cleanX === cleanJid.replace('@s.whatsapp.net', '@lid')) ||
                        (cleanJid.endsWith('@lid') && cleanX === cleanJid.replace('@lid', '@s.whatsapp.net'));
                })
            m.isAdmin = checkAdmin(m.sender, m.admins)
            m.isBotAdmin = checkAdmin(botNumber, m.admins)
            m.participant = m.key.participant || ""
        }

        const ownerNums = getOwnerNumbers();
        const senderNumOnly = (m.sender || '').split(':')[0].replace(/[^0-9]/g, '');
        const botNumOnly = botNumber.split(':')[0].replace(/[^0-9]/g, '');
        const mappedSenderNum = global.lidMap ? global.lidMap[senderNumOnly] : null;
        m.isDeveloper = (m.fromMe || (botNumOnly && senderNumOnly === botNumOnly) || ownerNums.includes(senderNumOnly) || (mappedSenderNum && (ownerNums.includes(mappedSenderNum) || mappedSenderNum === botNumOnly))) ? true : false;
    }

    if (m.message) {
        m.type = getContentType(m.message) || Object.keys(m.message)[0]
        m.msg = (/viewOnceMessage|viewOnceMessageV2Extension|editedMessage|ephemeralMessage/i.test(m.type) 
            ? m.message[m.type].message[getContentType(m.message[m.type].message)] 
            : (extractMessageContent(m.message[m.type]) || m.message[m.type]))

        let interactiveData = {}

        if (m.msg?.interactiveResponseMessage?.paramsJson) {
            try {
                interactiveData = JSON.parse(m.msg.interactiveResponseMessage.paramsJson)
            } catch (e) {
                interactiveData = {}
            }
        }

        if (m.msg?.nativeFlowResponseMessage?.paramsJson) {
            try {
                const nativeParams = JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson)
                interactiveData = { ...interactiveData, ...nativeParams }
            } catch (e) {
            }
        }

        m.interactive = interactiveData
        
        m.body = m.message?.conversation || 
                 m.msg?.text || 
                 m.msg?.conversation || 
                 m.msg?.caption || 
                 m.msg?.selectedButtonId || 
                 m.msg?.singleSelectReply?.selectedRowId || 
                 m.msg?.selectedId || 
                 m.msg?.contentText || 
                 m.msg?.selectedDisplayText || 
                 m.msg?.title || 
                 m.msg?.name || 
                 m.msg?.description || 
                 ''

		m.mentionedJid = (m.msg?.contextInfo?.mentionedJid || []).map(j => resolveLidToPhone(j, m.metadata));
 		m.text = m.msg?.text || 
                  m.msg?.caption || 
                  m.message?.conversation || 
                  m.msg?.contentText || 
                  m.msg?.selectedDisplayText || 
                  m.msg?.title || 
                  m.msg?.description || 
                  '';

        m.prefix = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(m.body) ? 
                   m.body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : 
                   /[\uD800-\uDBFF][\uDC00-\uDFFF]/gi.test(m.body) ? 
                   m.body.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/gi)[0] : ''

        m.command = m.body && m.body.replace(m.prefix, '').trim().split(/ +/).shift()
        m.args = m.body?.trim().replace(new RegExp("^" + m.prefix?.replace(/[.*=+:\-?^${}()|[\]\\]|\s/g, '\\$&'), 'i'), '')
                    .replace(m.command, '').split(/ +/).filter(a => a) || []

        m.device = getDevice(m.id)
        m.expiration = m.msg?.contextInfo?.expiration || 0
        
        m.timestamp = (typeof m.messageTimestamp === 'number' 
            ? m.messageTimestamp 
            : m.messageTimestamp?.low 
            ? m.messageTimestamp.low 
            : m.messageTimestamp?.high) || m.msg.timestampMs * 1000

        m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath || !!m.msg?.jpegThumbnail
        if (m.isMedia) {
            m.mime = m.msg?.mimetype
            m.size = m.msg?.fileLength
            m.height = m.msg?.height || ''
            m.width = m.msg?.width || ''
            if (/webp/i.test(m.mime)) {
                m.isAnimated = m.msg?.isAnimated
            }
        }

        m.quoted = m.msg?.contextInfo?.quotedMessage || null
        if (m.quoted) {
            if (m.msg?.contextInfo?.participant) { 
                m.msg.contextInfo.participant = resolveLidToPhone(m.msg.contextInfo.participant, m.metadata);
            }
            
            m.quoted.message = extractMessageContent(m.msg?.contextInfo?.quotedMessage)
            m.quoted.type = getContentType(m.quoted.message) || Object.keys(m.quoted.message)[0]
            m.quoted.id = m.msg.contextInfo.stanzaId
            m.quoted.device = getDevice(m.quoted.id)
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
            
            m.quoted.isBot = m.quoted.id ? 
                ['HSK', 'BAE', 'B1E', '3EB0', 'B24E', 'WA'].some(a => m.quoted.id.startsWith(a) && [12, 16, 20, 22, 40].includes(m.quoted.id.length)) || 
                /(.)\1{5,}|[^a-zA-Z0-9]|[^0-9A-F]/.test(m.quoted.id) : false
            
            m.quoted.sender = shorekeeper.decodeJid(m.msg.contextInfo.participant)
            m.quoted.fromMe = m.quoted.sender === shorekeeper.decodeJid(shorekeeper.user.id)
            m.quoted.msg = extractMessageContent(m.quoted.message[m.quoted.type]) || m.quoted.message[m.quoted.type]
            m.quoted.text = m.quoted.msg?.text ||
                            m.quoted.msg?.caption ||
                            m.quoted.message?.conversation ||
                            m.quoted.msg?.contentText ||
                            m.quoted.msg?.selectedDisplayText ||
                            m.quoted.msg?.title ||
                            m.quoted.msg?.description ||
                            ''
            m.quoted.mentionedJid = (m.quoted?.msg?.contextInfo?.mentionedJid || []).map(j => resolveLidToPhone(j, m.metadata))
            
            m.quoted.body = m.quoted.msg?.text || 
                           m.quoted.msg?.caption || 
                           m.quoted?.message?.conversation || 
                           m.quoted.msg?.selectedButtonId || 
                           m.quoted.msg?.singleSelectReply?.selectedRowId || 
                           m.quoted.msg?.selectedId || 
                           m.quoted.msg?.contentText || 
                           m.quoted.msg?.selectedDisplayText || 
                           m.quoted.msg?.title || 
                           m.quoted?.msg?.name || 
                           m.quoted.msg?.description || 
                           ''

			m.getQuotedObj = async () => {
				if (!m.quoted.id) return false
				let q = await store.loadMessage(m.chat, m.quoted.id, shorekeeper)
				return await Serialize(shorekeeper, q, store)
			}
            
            m.quoted.key = {
                remoteJid: m.msg?.contextInfo?.remoteJid || m.chat,
                participant: m.quoted.sender,
                fromMe: areJidsSameUser(shorekeeper.decodeJid(m.msg?.contextInfo?.participant), shorekeeper.decodeJid(shorekeeper?.user?.id)),
                id: m.msg?.contextInfo?.stanzaId,
            }
            
            m.quoted.isGroup = m.quoted.chat.endsWith('@g.us')
            m.quoted.mentions = m.quoted.msg?.contextInfo?.mentionedJid || []
            
            m.quoted.prefix = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(m.quoted.body) ? 
                             m.quoted.body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : 
                             /[\uD800-\uDBFF][\uDC00-\uDFFF]/gi.test(m.quoted.body) ? 
                             m.quoted.body.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/gi)[0] : ''

            m.quoted.command = m.quoted.body && m.quoted.body.replace(m.quoted.prefix, '').trim().split(/ +/).shift()
            m.quoted.isMedia = !!m.quoted.msg?.mimetype || !!m.quoted.msg?.thumbnailDirectPath || !!m.quoted.msg?.jpegThumbnail
            
            if (m.quoted.isMedia) {
                m.quoted.mime = m.quoted.msg?.mimetype
                m.quoted.size = m.quoted.msg?.fileLength
                m.quoted.height = m.quoted.msg?.height || ''
                m.quoted.width = m.quoted.msg?.width || ''
                if (/webp/i.test(m.quoted.mime)) {
                    m.quoted.isAnimated = m?.quoted?.msg?.isAnimated || false
                }
            }
            
            m.quoted.fakeObj = proto.WebMessageInfo.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id,
                },
                message: m.quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {}),
            })
            
            m.quoted.download = () => shorekeeper.downloadMediaMessage(m.quoted)
            m.quoted.delete = () => {
                shorekeeper.sendMessage(m.quoted.chat, {
                    delete: {
                        remoteJid: m.quoted.chat,
                        fromMe: m.isBotAdmin ? false : true,
                        id: m.quoted.id,
                        participant: m.quoted.sender,
                    },
                })
            }
        }
    }

    m.download = () => shorekeeper.downloadMediaMessage(m)
    
    m.copy = () => Serialize(shorekeeper, proto.WebMessageInfo.fromObject(proto.WebMessageInfo.toObject(m)))
    
    m.react = (u) => shorekeeper.sendMessage(m.chat, { react: { text: u, key: m.key }})
    
    m.reply = async (content, options = {}) => {
        const { quoted = m, chat = m.chat, caption = '', ...validate } = options;
        
        if (typeof content === 'object') {
            return shorekeeper.sendMessage(chat, content, { ...options, quoted })
        } else if (typeof content === 'string') {
            try {
                if (/^https?:\/\//.test(content)) {
                    const data = await axios.get(content, { responseType: 'arraybuffer', timeout: 30000 });
                    const mime = data.headers['content-type'] || (await FileType.fromBuffer(data.data))?.mime
                    if (/gif|image|video|audio|pdf/i.test(mime)) {
                        return shorekeeper.sendFileUrl(chat, content, caption, quoted, options)
                    } else {
                        return shorekeeper.sendMessage(chat, { 
                            text: content, 
                            mentions: [...content.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), 
                            ...options 
                        }, { quoted })
                    }
                } else {
                    return shorekeeper.sendMessage(chat, { 
                        text: content, 
                        mentions: [...content.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), 
                        ...options 
                    }, { quoted })
                }
            } catch (e) {
                return shorekeeper.sendMessage(chat, { 
                    text: content, 
                    mentions: [...content.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), 
                    ...options 
                }, { quoted })
            }
        }
    }

    m.pushName = m.pushName || m.verifiedBizName || 'User'

    return m
}

module.exports = { LoadDataBase, MessagesUpsert, Solving }

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
});