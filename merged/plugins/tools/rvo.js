/**
 * © Kureza MD — Hitoshi MD V1
 * .rvo — Read View Once (plugin, menggantikan case "rvo" lama di kurezamd.js)
 *
 * Kenapa ditulis ulang, bukan tempel langsung file yang dikasih:
 * - Project ini CommonJS ("type": "commonjs" di package.json), jadi import/export
 *   ESM di file aslinya tidak akan jalan — sudah diubah ke require()/module.exports.
 * - conn.sendFile, conn.loadMessage, global._viewOnceCache tidak ada di project ini.
 *   Diganti ke yang beneran ada: shorekeeper.sendMessage, global.crmstore, dan
 *   global.rvoCache (cache view-once yang sudah dipasang di index.js, diisi dari
 *   event messages.upsert SEBELUM WA menghapus media-nya).
 * - handler.command harus berupa array (loader plugin cuma baca Array.isArray(plugin.command)),
 *   bukan regex seperti di file asli — makanya diganti ke array.
 *
 * Plugin di folder plugins/ dieksekusi SEBELUM switch-case besar di kurezamd.js dan
 * langsung `return` kalau match — jadi naruh file ini otomatis "mengganti" case lama,
 * tanpa perlu edit kurezamd.js sama sekali.
 */
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

function ensureBuffer(val) {
  if (!val) return null;
  if (Buffer.isBuffer(val)) return val;
  if (val instanceof Uint8Array) return Buffer.from(val);
  if (val?.type === 'Buffer' && Array.isArray(val.data)) return Buffer.from(val.data);
  if (typeof val === 'string') return Buffer.from(val, 'base64');
  return null;
}

// Lepas semua wrapper viewOnce / ephemeral / documentWithCaption, baliin isi aslinya
function unwrapMessage(msg) {
  let curr = msg;
  for (let i = 0; i < 6 && curr; i++) {
    const next =
      curr.viewOnceMessageV2?.message ||
      curr.viewOnceMessageV2Extension?.message ||
      curr.viewOnceMessage?.message ||
      curr.ephemeralMessage?.message ||
      curr.documentWithCaptionMessage?.message;
    if (!next) break;
    curr = next;
  }
  return curr;
}

// Ambil { mediaObj, mediaType, mime, caption, ptt } dari struktur WAMessage biasa
// (dipakai untuk hasil crmstore.loadMessage, m.getQuotedObj(), m.quoted mentah)
function extractFromWaMessage(msgLike) {
  const raw = msgLike?.message || msgLike?.msg || msgLike;
  const unwrapped = unwrapMessage(raw);
  if (!unwrapped) return null;

  if (unwrapped.imageMessage) {
    const o = unwrapped.imageMessage;
    return { mediaObj: o, mediaType: 'imageMessage', mime: o.mimetype || 'image/jpeg', caption: o.caption || '', ptt: false };
  }
  if (unwrapped.videoMessage) {
    const o = unwrapped.videoMessage;
    return { mediaObj: o, mediaType: 'videoMessage', mime: o.mimetype || 'video/mp4', caption: o.caption || '', ptt: false };
  }
  if (unwrapped.audioMessage) {
    const o = unwrapped.audioMessage;
    return { mediaObj: o, mediaType: 'audioMessage', mime: o.mimetype || 'audio/mp4', caption: '', ptt: !!o.ptt };
  }
  if (unwrapped.documentMessage) {
    const o = unwrapped.documentMessage;
    return {
      mediaObj: o,
      mediaType: 'documentMessage',
      mime: o.mimetype || 'application/octet-stream',
      caption: o.caption || '',
      fileName: o.fileName || 'file.bin',
      ptt: false
    };
  }
  return null;
}

async function downloadFromMediaObj(mediaObj, mediaType) {
  if (mediaObj.mediaKey) mediaObj.mediaKey = ensureBuffer(mediaObj.mediaKey);
  if (mediaObj.fileSha256) mediaObj.fileSha256 = ensureBuffer(mediaObj.fileSha256);
  if (mediaObj.fileEncSha256) mediaObj.fileEncSha256 = ensureBuffer(mediaObj.fileEncSha256);
  if (!mediaObj.mediaKey || !mediaObj.mediaKey.length) return null;

  const type = mediaType.replace('Message', '').toLowerCase();
  const stream = await downloadContentFromMessage(mediaObj, type);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const numOnly = (jid) => String(jid || '').split('@')[0].split(':')[0];

let handler = async (m, { shorekeeper, command, Reply, checkLimit, addLimit, isCreator }) => {
  const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {});

  if (typeof checkLimit === 'function' && checkLimit(m.sender, isCreator)) {
    return Reply(global.mess?.limit || '❌ Limit habis.');
  }

  if (!global.rvoCache) global.rvoCache = new Map();
  if (!global.rvoCacheMeta) global.rvoCacheMeta = new Map();

  if (!m.quoted) {
    return Reply(
      `\`⌜ Read View Once ⌟\`\n` +
      `> ◦ *Format :* reply pesan view once/media dengan *${command}*\n` +
      `> ◦ *Cache  :* ${global.rvoCache.size} pesan tersimpan`
    );
  }

  react('🕕');

  try {
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    const stanzaId = ctx?.stanzaId || m.quoted.id;

    let found = null; // { mediaObj, mediaType, mime, caption, ptt, fileName, buffer? }
    let senderTag = m.quoted?.sender ? `@${numOnly(m.quoted.sender)}` : 'Pengirim';

    // ── 1. Cache view-once milik project ini (global.rvoCache) — paling reliable,
    //       karena disimpan SAAT pesan masuk, sebelum WA hapus media-nya.
    let cachedId = stanzaId && global.rvoCache.has(stanzaId) ? stanzaId : null;

    if (!cachedId) {
      // fallback: entri terbaru dari pengirim yang sama di chat yang sama (maks 30 menit)
      const qNum = numOnly(ctx?.participant || m.quoted?.sender);
      let best = null;
      for (const [id, e] of global.rvoCache) {
        if (e.chat !== m.chat) continue;
        if (Date.now() - e.cachedAt > 30 * 60 * 1000) continue;
        if (qNum && numOnly(e.sender) !== qNum) continue;
        if (!best || e.cachedAt > best.cachedAt) best = { id, cachedAt: e.cachedAt };
      }
      if (best) cachedId = best.id;
    }

    if (cachedId) {
      const cached = global.rvoCache.get(cachedId);
      if (cached) {
        let buffer = cached.buffer;
        if (!buffer && cached.content?.mediaKey?.length) {
          buffer = await downloadFromMediaObj(cached.content, cached.type).catch(() => null);
        }
        if (buffer && buffer.length) {
          const meta = global.rvoCacheMeta.get(cachedId) || {};
          if (meta.sender) senderTag = `@${numOnly(meta.sender)}`;
          found = {
            buffer,
            mediaType: cached.type,
            mime: cached.mimetype || '',
            caption: cached.caption || '',
            ptt: cached.ptt || false
          };
        }
      }
    }

    // ── 2. Fallback: crmstore (penyimpan histori pesan milik project ini)
    if (!found && global.crmstore) {
      try {
        const loaded = global.crmstore.loadMessage(stanzaId, m.chat) || global.crmstore.loadMessageById(stanzaId);
        const extracted = extractFromWaMessage(loaded);
        if (extracted) {
          const buffer = await downloadFromMediaObj(extracted.mediaObj, extracted.mediaType).catch(() => null);
          if (buffer && buffer.length) found = { ...extracted, buffer };
        }
      } catch (_) {}
    }

    // ── 3. Fallback: ambil ulang objek quoted lewat getQuotedObj()
    if (!found && typeof m.getQuotedObj === 'function') {
      try {
        const qObj = await m.getQuotedObj();
        const extracted = extractFromWaMessage(qObj);
        if (extracted) {
          const buffer = await downloadFromMediaObj(extracted.mediaObj, extracted.mediaType).catch(() => null);
          if (buffer && buffer.length) found = { ...extracted, buffer };
        }
      } catch (_) {}
    }

    // ── 4. Fallback terakhir: m.quoted mentah
    if (!found) {
      const extracted = extractFromWaMessage(m.quoted);
      if (extracted) {
        let buffer = await downloadFromMediaObj(extracted.mediaObj, extracted.mediaType).catch(() => null);
        if (!buffer && typeof m.quoted.download === 'function') {
          buffer = await m.quoted.download().catch(() => null);
        }
        if (buffer && buffer.length) found = { ...extracted, buffer };
      }
    }

    if (!found || !found.buffer || !found.buffer.length) {
      react('❌');
      return Reply(
        '❌ *Media tidak ditemukan / gagal diunduh.*\n\n' +
        '> Biasanya karena bot baru restart setelah pesan view once dikirim,\n' +
        '> atau media sudah tidak ada lagi di cache. Minta kirim ulang lalu langsung reply .rvo.'
      );
    }

    const infoCaption =
      `\`⌜ Read View Once ⌟\`\n` +
      `> ◦ *Dari :* ${senderTag}` +
      (found.caption ? `\n> ◦ *Caption :* ${found.caption}` : '');

    const opts = { quoted: m, mentions: m.quoted?.sender ? [m.quoted.sender] : [] };

    if (found.mediaType === 'videoMessage') {
      await shorekeeper.sendMessage(m.chat, { video: found.buffer, caption: infoCaption, mimetype: found.mime || 'video/mp4' }, opts);
    } else if (found.mediaType === 'audioMessage') {
      await shorekeeper.sendMessage(m.chat, { audio: found.buffer, mimetype: found.mime || 'audio/mp4', ptt: found.ptt || false }, { quoted: m });
    } else if (found.mediaType === 'documentMessage') {
      await shorekeeper.sendMessage(m.chat, { document: found.buffer, mimetype: found.mime || 'application/octet-stream', fileName: found.fileName || 'file.bin', caption: infoCaption }, opts);
    } else {
      await shorekeeper.sendMessage(m.chat, { image: found.buffer, caption: infoCaption, mimetype: found.mime || 'image/jpeg' }, opts);
    }

    if (typeof addLimit === 'function') addLimit(m.sender, isCreator);
    react('✅');
  } catch (err) {
    console.error('[RVO] Error:', err.message);
    react('❌');
    Reply(`❌ Gagal membaca View Once: ${err.message}`);
  }
};

handler.help = ['rvo'];
handler.tags = ['tools'];
handler.command = ['rvo', 'rvo2', 'readviewonce', 'readvo', 'openvo', 'viewonce'];

module.exports = handler;
