/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const { getReplyStyle } = require('./replystyle');

let cachedThumbBuf = null;
let cachedThumbSrc = null;

function getReplyImgSrc() {
    return (typeof global.image === 'object' && global.image && (global.image.reply || global.image.thumb || global.image.menu))
        ? (global.image.reply || global.image.thumb || global.image.menu)
        : null;
}

async function getDocThumbDZ() {
    const thumbSrc = getReplyImgSrc();
    if (cachedThumbSrc === thumbSrc && cachedThumbBuf && cachedThumbBuf.length > 0) {
        return cachedThumbBuf;
    }
    return await loadConfigImageDZ(thumbSrc);
}

async function loadConfigImageDZ(src, fallbackPath = './source/media/foto/imgdokumen.jpg') {
    const target = src || fallbackPath;
    if (cachedThumbSrc === target && cachedThumbBuf && cachedThumbBuf.length > 0) {
        return cachedThumbBuf;
    }
    try {
        if (typeof target === 'string' && /^https?:\/\//.test(target)) {
            const res = await axios.get(target, { responseType: 'arraybuffer', timeout: 15000 });
            const buf = Buffer.from(res.data);
            if (buf && buf.length > 0) {
                cachedThumbSrc = target;
                cachedThumbBuf = buf;
                return buf;
            }
        }
        if (typeof target === 'string' && fs.existsSync(target)) {
            const buf = fs.readFileSync(target);
            if (buf && buf.length > 0) {
                cachedThumbSrc = target;
                cachedThumbBuf = buf;
                return buf;
            }
        }
    } catch (e) {}
    try {
        const fallbackBuf = fs.existsSync(fallbackPath) ? fs.readFileSync(fallbackPath) : Buffer.alloc(0);
        return fallbackBuf;
    } catch (e) {
        return Buffer.alloc(0);
    }
}

function stripBoxCharsDZ(text) {
    return String(text || '')
        .split('\n')
        .map((line) => line.replace(/^[╭╰┃│┊┈┄⬡「」⌜⌟>◦\s]+|[╭╰┃│┊┈┄⬡」⌜⌟\s]+$/g, '').trim())
        .filter((line) => line.length > 0)
        .join('\n')
        .trim();
}

function extractCopyrightFooterDZ(text) {
    const lines = String(text || '').split('\n');
    let lastIdx = lines.length - 1;
    while (lastIdx >= 0 && lines[lastIdx].replace(/[╭╰┃│┊┈┄⬡「」⌜⌟\s]/g, '').length === 0) {
        lastIdx--;
    }
    if (lastIdx < 0) return { body: text, footer: null };
    const candidate = lines[lastIdx].trim();
    if (/^©/.test(candidate)) {
        return { body: lines.slice(0, lastIdx).join('\n'), footer: candidate };
    }
    return { body: text, footer: null };
}

let fkontakCacheDZ = null;
let fkontakExpireAtDZ = 0;
async function buildFkontakDZ(diezy) {
    const now = Date.now();
    if (fkontakCacheDZ && now < fkontakExpireAtDZ) return fkontakCacheDZ;
    const botName = global.botname || 'Diezy AI';
    const metaAiNumber = '13135550002';
    const metaAiJid = `${metaAiNumber}@s.whatsapp.net`;
    let photo = Buffer.alloc(0);
    try {
        const url = await diezy.profilePictureUrl(metaAiJid, 'image');
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
        photo = Buffer.from(res.data);
    } catch (e) {}
    const contact = {
        key: { participant: '0@s.whatsapp.net', fromMe: false, id: 'StatusBiz', remoteJid: 'status@broadcast' },
        message: {
            contactMessage: {
                displayName: botName,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${botName} Multidevice\nFN:${botName} Multidevice\nORG:${botName};\nTEL;type=CELL;type=VOICE;waid=${metaAiNumber}:+${metaAiNumber}\nEND:VCARD`,
                jpegThumbnail: photo,
            },
        },
    };
    fkontakCacheDZ = contact;
    fkontakExpireAtDZ = now + 10 * 60 * 1000;
    return contact;
}

async function sendLegacyDocReply(diezy, m, teks, mentions) {
    try {
        const thumbPath = "./source/media/foto/imgdokumen.jpg";
        let thumbBuf = null;
        try {
            thumbBuf = await getDocThumbDZ();
        } catch (e) {}
        if (!thumbBuf || !thumbBuf.length) {
            if (fs.existsSync(thumbPath)) {
                try {
                    const jimp = require('jimp');
                    const img = await jimp.read(thumbPath);
                    if (img.bitmap.width !== 300 || img.bitmap.height !== 300) {
                        img.cover(300, 300);
                        await img.writeAsync(thumbPath);
                    }
                    thumbBuf = fs.readFileSync(thumbPath);
                } catch (e) {}
            }
        }
        return await diezy.sendMessage(m.chat, {
            document: fs.existsSync("./package.json") ? fs.readFileSync("./package.json") : Buffer.from('{}'),
            fileName: ` ⏤͟͟͞͞ ${global.botname || 'Diezy AI'}`,
            mimetype: "image/png",
            fileLength: 999000000000,
            pageCount: 100, headerType: 1, viewOnce: true,
            jpegThumbnail: (typeof global.pathThumbHeader === 'string' && global.pathThumbHeader && fs.existsSync(global.pathThumbHeader)) ? fs.readFileSync(global.pathThumbHeader) : (thumbBuf || (fs.existsSync(thumbPath) ? fs.readFileSync(thumbPath) : Buffer.alloc(0))),
            caption: teks,
            contextInfo: {
                mentionedJid: mentions,
                isForwarded: true,
                forwardingScore: 1,
                businessMessageForwardInfo: { businessOwnerJid: global.owner + "@s.whatsapp.net" },
                forwardedNewsletterMessageInfo: {
                    newsletterName: global.namaSaluran,
                    newsletterJid: global.idSaluran,
                },
            },
        }, { quoted: m });
    } catch (docErr) {
        return await diezy.sendMessage(m.chat, {
            text: teks,
            contextInfo: { mentionedJid: mentions }
        }, { quoted: m }).catch(() => {});
    }
}

function generateReplyMsgId(diezy) {
    if (diezy && typeof diezy.generateMessageTag === 'function') {
        const tag = String(diezy.generateMessageTag()).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        return 'DZ' + tag + crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    return '3EB0' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

const makeReply = (diezy, m) => {
    return async (teks, mentions = [m.sender]) => {
        const style = getReplyStyle();
        try {
            const ownerName = global.namaOwner || 'Owner';
            const botName = global.botname || 'Diezy AI';
            const replyImg = getReplyImgSrc();

            if (style === 'v2') {
                const { body: bodyRawV2, footer: footerLineV2 } = extractCopyrightFooterDZ(teks);
                const bodyTextV2 = stripBoxCharsDZ(bodyRawV2);
                const channelUrl = global.linkSaluran || global.linkGrup || 'https://whatsapp.com';
                const channelName = global.namaSaluran || 'Official Channel';
                const messageContent = {
                    interactiveMessage: {
                        header: { title: '', subtitle: '', hasMediaAttachment: false },
                        body: { text: footerLineV2 ? `${bodyTextV2}\n\n\n${footerLineV2}` : bodyTextV2 },
                        footer: { text: `${ownerName}` },
                        nativeFlowMessage: {
                            buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: channelName, url: channelUrl }) }],
                            messageParamsJson: '{}',
                        },
                        contextInfo: {
                            mentionedJid: mentions,
                            isForwarded: false,
                            forwardingScore: 0,
                            participant: '13135550002@s.whatsapp.net',
                            quotedMessage: {
                                groupInviteMessage: {
                                    groupJid: '0@g.us',
                                    inviteCode: 'abdinr',
                                    caption: botName,
                                },
                            },
                            remoteJid: 'status@broadcast',
                            expiration: 0,
                            quotedType: 'EXPLICIT',
                        },
                    },
                };
                const msgId_v2 = generateReplyMsgId(diezy);
                await diezy.relayMessage(m.chat, messageContent, { messageId: msgId_v2 });
                return { key: { remoteJid: m.chat, fromMe: true, id: msgId_v2 }, message: messageContent };
            }

            if (style === 'v3') {
                const { body: bodyRaw } = extractCopyrightFooterDZ(teks);
                const imgBuf = await loadConfigImageDZ(replyImg);
                const channelUrl = global.linkSaluran || global.linkGrup || 'https://whatsapp.com';
                const channelName = global.namaSaluran || 'Official Channel';
                const messageContent = {
                    interactiveMessage: {
                        header: { title: botName, hasMediaAttachment: false },
                        body: { text: stripBoxCharsDZ(bodyRaw) },
                        nativeFlowMessage: { buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: channelName, url: channelUrl }) }] },
                        contextInfo: {
                            mentionedJid: mentions,
                            quotedMessage: {
                                orderMessage: {
                                    orderId: String(Date.now()),
                                    thumbnail: imgBuf,
                                    itemCount: 2026,
                                    status: 'INQUIRY',
                                    surface: 'CATALOG',
                                    message: `© ${botName}`,
                                    orderTitle: botName,
                                    sellerJid: '0@s.whatsapp.net',
                                    totalAmount1000: '0',
                                    totalCurrencyCode: 'IDR',
                                },
                            },
                            participant: '0@s.whatsapp.net',
                            remoteJid: 'status@broadcast',
                            isForwarded: false,
                            forwardingScore: 0,
                        },
                    },
                };
                const msgId_v3 = generateReplyMsgId(diezy);
                await diezy.relayMessage(m.chat, messageContent, { messageId: msgId_v3 });
                return { key: { remoteJid: m.chat, fromMe: true, id: msgId_v3 }, message: messageContent };
            }

            if (style === 'v4') {
                /*
                 * V4 — dikirim sebagai pesan dokumen dengan thumbnail kecil.
                 */
                const SMALL_THUMB_SIZE_V4 = 120;
                const DOC_THUMB_SIZE_V4 = 300;

                const resizeThumbV4 = async (sourceBuffer, size, quality) => {
                    if (!sourceBuffer || !sourceBuffer.length) return sourceBuffer;
                    try {
                        const jimp = require('jimp');
                        const img = await jimp.read(sourceBuffer);
                        img.cover(size, size).quality(quality);
                        return await img.getBufferAsync(jimp.MIME_JPEG);
                    } catch (e) {
                        return sourceBuffer;
                    }
                };

                const { body: bodyRawV4, footer: footerLineV4 } = extractCopyrightFooterDZ(teks);
                const bodyTextV4 = stripBoxCharsDZ(bodyRawV4);
                const captionV4 = footerLineV4 ? `${bodyTextV4}\n\n\n${footerLineV4}` : bodyTextV4;

                const thumbBufV4 = await loadConfigImageDZ(replyImg);
                const headerSourceV4 = (typeof global.pathThumbHeader === 'string' && global.pathThumbHeader && fs.existsSync(global.pathThumbHeader))
                    ? fs.readFileSync(global.pathThumbHeader)
                    : thumbBufV4;

                const docBufV4 = await resizeThumbV4(thumbBufV4, DOC_THUMB_SIZE_V4, 80);
                const smallThumbV4 = await resizeThumbV4(headerSourceV4, SMALL_THUMB_SIZE_V4, 60);

                const messageContent = {
                    document: docBufV4,
                    fileName: ` ╼${botName}`,
                    mimetype: 'image/jpeg',
                    fileLength: 999000000000,
                    pageCount: 100,
                    headerType: 1,
                    viewOnce: true,
                    jpegThumbnail: smallThumbV4,
                    thumbnailWidth: SMALL_THUMB_SIZE_V4,
                    thumbnailHeight: SMALL_THUMB_SIZE_V4,
                    caption: captionV4,
                    mentions,
                    contextInfo: {
                        mentionedJid: mentions,
                    },
                };
                return await diezy.sendMessage(m.chat, messageContent, { quoted: m });
            }

            if (style === 'v5') {
                const { body: bodyRawV5, footer: footerLineV5 } = extractCopyrightFooterDZ(teks);
                const bodyTextV5 = stripBoxCharsDZ(bodyRawV5);
                const thumb = await getDocThumbDZ();
                const imgBufV5 = await loadConfigImageDZ(replyImg);
                const messageContent = {
                    extendedTextMessage: {
                        text: `https://google.com\n\n${footerLineV5 ? `${bodyTextV5}\n\n\n${footerLineV5}` : bodyTextV5}`,
                        matchedText: 'https://google.com',
                        title: '',
                        description: `${ownerName}`,
                        previewType: 'NONE',
                        jpegThumbnail: thumb,
                        contextInfo: {
                            mentionedJid: mentions,
                            quotedMessage: {
                                orderMessage: {
                                    orderId: String(Date.now()),
                                    thumbnail: imgBufV5,
                                    itemCount: 2026,
                                    status: 'INQUIRY',
                                    surface: 'CATALOG',
                                    message: `© ${botName}`,
                                    orderTitle: botName,
                                    sellerJid: '13135550002@s.whatsapp.net',
                                    totalAmount1000: '0',
                                    totalCurrencyCode: 'IDR',
                                },
                            },
                            participant: '13135550002@s.whatsapp.net',
                            remoteJid: 'status@broadcast',
                        },
                    },
                };
                const msgId_v5 = generateReplyMsgId(diezy);
                await diezy.relayMessage(m.chat, messageContent, { messageId: msgId_v5 });
                return { key: { remoteJid: m.chat, fromMe: true, id: msgId_v5 }, message: messageContent };
            }

            const { body: bodyRawV1, footer: footerLineV1 } = extractCopyrightFooterDZ(teks);
            const bodyTextV1 = stripBoxCharsDZ(bodyRawV1);
            const thumb = await getDocThumbDZ();
            const quotedRef = await buildFkontakDZ(diezy);
            const messageContent = {
                extendedTextMessage: {
                    text: `https://google.com\n\n${footerLineV1 ? `${bodyTextV1}\n\n\n${footerLineV1}` : bodyTextV1}`,
                    matchedText: 'https://google.com',
                    title: '',
                    description: `${ownerName}`,
                    previewType: 'NONE',
                    jpegThumbnail: thumb,
                    contextInfo: {
                        mentionedJid: mentions,
                        quotedMessage: quotedRef?.message,
                        participant: quotedRef?.key?.participant,
                        stanzaId: quotedRef?.key?.id,
                        remoteJid: quotedRef?.key?.remoteJid,
                    },
                },
            };
            const msgId_v1 = generateReplyMsgId(diezy);
            await diezy.relayMessage(m.chat, messageContent, { messageId: msgId_v1 });
            return { key: { remoteJid: m.chat, fromMe: true, id: msgId_v1 }, message: messageContent };
        } catch (e) {
            try { console.error('[Reply style] gagal kirim gaya ' + style + ', fallback ke kartu dokumen/teks:', e?.message); } catch (e2) {}
            try {
                return await sendLegacyDocReply(diezy, m, teks, mentions);
            } catch (errFallback) {
                return await diezy.sendMessage(m.chat, {
                    text: teks,
                    contextInfo: { mentionedJid: mentions }
                }, { quoted: m }).catch(() => {});
            }
        }
    };
};

module.exports = makeReply;
