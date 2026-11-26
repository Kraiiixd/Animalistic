/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * .bpr — Batch Private Relay: kirim pesan privat di dalam grup (member lain lihat placeholder).
 * Credit: Kureza (port ke Hitoshi) • konsep sBPR: Nixel • fitur asal: Ichigo MD
 */
const crypto = require('crypto')
const B = require('@whiskeysockets/baileys')
const { encodeWAMessage, generateMessageIDV2, encodeSignedDeviceIdentity, prepareWAMessageMedia } = B

const MAX_BATCH_SIZE = 500;
const ENCRYPTION_TIMEOUT = 30000;
const DEFAULT_PLACEHOLDER = "pesan rahasia";
const SESSION_DISTRIBUTION_DELAY = 1500;
const ASSERT_MAX_RETRY = 3;
const ASSERT_RETRY_DELAY = 500;
const IMAGE_FETCH_TIMEOUT = 15000;
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const RANDOM_IMAGE_PATTERN = "https://picsum.photos/seed/{seed}/400/400";

// =====================================================================
// HELPER DASAR
// =====================================================================

const normalizeJid = (jid = "") => jid ? jid.split(":")[0].split("@")[0] : "";
const extractPhoneNumber = (jid) => String(jid || "").split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
const isValidJid = (jid) => typeof jid === "string" && (jid.includes("@s.whatsapp.net") || jid.includes("@lid") || jid.includes("@g.us"));
const isLidJid = (jid) => String(jid || "").includes("@lid");

function toPnJid(jid) {
  const phone = extractPhoneNumber(jid);
  return (phone && phone.length >= 8) ? phone + "@s.whatsapp.net" : null;
}

function buildHideTagMentions(targetJids = []) {
  const set = new Set();
  for (const jid of targetJids || []) {
    if (!isValidJid(jid) || jid.includes("@g.us")) continue;
    const pn = toPnJid(jid);
    if (pn) set.add(pn);
  }
  return [...set];
}

function newMessageId(sock) {
  try {
    const userId = sock?.user?.id || sock?.authState?.creds?.me?.id;
    if (!userId) throw new Error("user id tidak ada");
    return generateMessageIDV2(userId);
  } catch (e) {
    return crypto.randomBytes(16).toString("hex").toUpperCase();
  }
}

async function resolveTargetsFromGroup(sock, participants, targetJids) {
  if (!participants?.length || !targetJids?.length) return [];
  const targetPhones = new Set();

  for (const jid of targetJids) {
    if (!jid) continue;
    const phone = extractPhoneNumber(jid);
    if (phone) targetPhones.add(phone);
    try {
      const lid = await sock.signalRepository?.lidMapping?.getLIDForPN(jid);
      if (lid) { const p = extractPhoneNumber(lid); if (p) targetPhones.add(p); }
    } catch {}
    try {
      const pn = await sock.signalRepository?.lidMapping?.getPNForLID(jid);
      if (pn) { const p = extractPhoneNumber(pn); if (p) targetPhones.add(p); }
    } catch {}
  }

  return participants.filter(p => {
    const candidates = [
      extractPhoneNumber(p.id),
      extractPhoneNumber(p.jid),
      extractPhoneNumber(p.phoneNumber)
    ].filter(Boolean);
    return candidates.some(c => targetPhones.has(c));
  });
}

async function resolveParticipantPn(sock, participant) {
  if (!participant) return null;
  if (participant.phoneNumber && !isLidJid(participant.phoneNumber)) {
    const pn = toPnJid(participant.phoneNumber);
    if (pn) return pn;
  }
  if (participant.id && !isLidJid(participant.id)) {
    const pn = toPnJid(participant.id);
    if (pn) return pn;
  }
  try {
    const pn = await sock.signalRepository?.lidMapping?.getPNForLID(participant.id);
    if (pn && !isLidJid(pn)) {
      const converted = toPnJid(pn);
      if (converted) return converted;
    }
  } catch {}
  return null;
}

async function ensureSessionsReady(sock, targetJids) {
  for (let attempt = 0; attempt < ASSERT_MAX_RETRY; attempt++) {
    try {
      const results = await Promise.allSettled(targetJids.map(id => sock.assertSessions([id], true)));
      if (!results.some(r => r.status === "rejected")) return true;
    } catch {}
    await new Promise(r => setTimeout(r, ASSERT_RETRY_DELAY));
  }
  return false;
}

async function sendPrivateMessage(sock, targetJid, message, opts = {}) {
  if (!isValidJid(targetJid)) throw new Error("JID tidak valid: " + targetJid);
  const { additionalNodes = [] } = opts;

  await sock.assertSessions([targetJid], true);
  const encoded = encodeWAMessage(message);
  const { type, ciphertext } = await Promise.race([
    sock.signalRepository.encryptMessage({ jid: targetJid, data: encoded }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("encryption timeout")), ENCRYPTION_TIMEOUT))
  ]);

  const messageId = newMessageId(sock);
  const content = [{ tag: "enc", attrs: { v: "2", type }, content: ciphertext }];

  if (type === "pkmsg" && sock?.authState?.creds?.account) {
    content.push({
      tag: "device-identity",
      attrs: {},
      content: encodeSignedDeviceIdentity(sock.authState.creds.account, true)
    });
  }
  if (additionalNodes.length) content.push(...additionalNodes);

  await sock.query({
    tag: "message",
    attrs: { id: messageId, to: targetJid, type: "text" },
    content
  });

  return messageId;
}

async function sendBatchPrivateRelay(sock, groupJid, targets = [], opts = {}) {
  const { placeholder = null, mentions = null, chunkSize = MAX_BATCH_SIZE } = opts;

  if (!isValidJid(groupJid)) throw new Error("JID grup tidak valid");
  if (!targets?.length) throw new Error("targets kosong");

  const validTargets = targets.filter(t => t?.target && t?.message);
  if (!validTargets.length) throw new Error("tidak ada target valid");

  const groupMeta = await sock.groupMetadata(groupJid);
  const participants = groupMeta.participants || [];
  if (!participants.length) throw new Error("grup tidak punya member");

  const selfId = sock?.authState?.creds?.me?.lid || sock?.user?.id;
  const isLidGroup = (groupMeta.addressingMode || "lid") === "lid";
  if (!selfId) throw new Error("tidak bisa dapat self id");

  const resolvedTargets = [];
  for (const item of validTargets) {
    const matched = await resolveTargetsFromGroup(sock, participants, [item.target]);
    if (matched.length) {
      resolvedTargets.push({ participant: matched[0], message: item.message });
    } else if (isValidJid(item.target) && !item.target.includes("@g.us")) {
      resolvedTargets.push({ participant: { id: item.target }, message: item.message });
    }
  }

  if (!resolvedTargets.length) throw new Error("tidak ada target yang cocok");

  const chunks = [];
  for (let i = 0; i < resolvedTargets.length; i += chunkSize) {
    chunks.push(resolvedTargets.slice(i, i + chunkSize));
  }

  const messageIds = [];

  for (const chunk of chunks) {
    const targetJids = chunk.map(t => t.participant.id);
    await ensureSessionsReady(sock, targetJids);
    await new Promise(r => setTimeout(r, SESSION_DISTRIBUTION_DELAY));

    let groupCiphertext = null;
    if (placeholder) {
      const skmsgPayload = {
        extendedTextMessage: {
          text: placeholder,
          contextInfo: mentions?.length ? { mentionedJid: mentions } : {}
        }
      };
      try {
        const encoded = encodeWAMessage(skmsgPayload);
        const enc = await sock.signalRepository.encryptGroupMessage({ group: groupJid, data: encoded, meId: selfId });
        groupCiphertext = enc.ciphertext;
      } catch (e) {
        console.warn("[bpr] group encryption gagal:", e.message);
      }
    } else {
      try {
        const encoded = encodeWAMessage({ protocolMessage: { type: 0 } });
        const enc = await sock.signalRepository.encryptGroupMessage({ group: groupJid, data: encoded, meId: selfId });
        groupCiphertext = enc.ciphertext;
      } catch {}
    }

    let needDeviceIdentity = false;
    const encryptResults = await Promise.allSettled(
      chunk.map(async ({ participant, message }) => {
        try {
          const encoded = encodeWAMessage(message);
          const { type, ciphertext } = await Promise.race([
            sock.signalRepository.encryptMessage({ jid: participant.id, data: encoded }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ENCRYPTION_TIMEOUT))
          ]);
          if (type === "pkmsg") needDeviceIdentity = true;
          return {
            tag: "to",
            attrs: { jid: participant.id },
            content: [{ tag: "enc", attrs: { v: "2", type }, content: ciphertext }]
          };
        } catch (e) {
          return null;
        }
      })
    );

    const participantNodes = encryptResults.filter(r => r.status === "fulfilled" && r.value).map(r => r.value);
    if (!groupCiphertext && !participantNodes.length) continue;

    const messageId = newMessageId(sock);
    const content = [];

    if (groupCiphertext) content.push({ tag: "enc", attrs: { v: "2", type: "skmsg" }, content: groupCiphertext });
    if (participantNodes.length) content.push({ tag: "participants", attrs: {}, content: participantNodes });
    if (needDeviceIdentity && sock?.authState?.creds?.account) {
      content.push({
        tag: "device-identity", attrs: {},
        content: encodeSignedDeviceIdentity(sock.authState.creds.account, true)
      });
    }

    await sock.query({
      tag: "message",
      attrs: { id: messageId, to: groupJid, type: "text", ...(isLidGroup ? { addressing_mode: "lid" } : {}) },
      content
    });

    messageIds.push(messageId);
    if (chunks.indexOf(chunk) < chunks.length - 1) await new Promise(r => setTimeout(r, 500));
  }

  if (!messageIds.length) throw new Error("gagal kirim semua chunk");
  return messageIds;
}

function getRandomImageUrl(seed) {
  const safeSeed = String(seed || Date.now()).replace(/[^0-9]/g, "") || String(Date.now());
  return RANDOM_IMAGE_PATTERN.replace("{seed}", safeSeed);
}

async function downloadImageBuffer(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > MAX_IMAGE_SIZE) return null;
    return buf;
  } catch {
    return null;
  }
}

async function prepareImageMessageBuilder(sock, imageBuffer, caption, mentions = []) {
  if (!sock?.waUploadToServer) return null;
  try {
    const media = await prepareWAMessageMedia({ image: imageBuffer }, { upload: sock.waUploadToServer });
    if (!media?.imageMessage) return null;
    const imageMessage = { ...media.imageMessage };
    if (caption) imageMessage.caption = caption;
    if (mentions.length) imageMessage.contextInfo = { ...(imageMessage.contextInfo || {}), mentionedJid: mentions };
    return imageMessage;
  } catch (e) {
    return null;
  }
}

function buildUserInfoForJid(jid, isOwner) {
  const phone = extractPhoneNumber(jid);
  const lines = [
    `Nomor   : ${phone && phone.length >= 8 ? "+" + phone : "-"}`,
    `Nama    : ${phone && phone.length >= 8 ? "@" + phone : "-"}`,
    `Role    : ${isOwner ? "owner" : "member"}`
  ];
  return { jid, caption: lines.join("\n"), phone };
}

async function buildUserImageMessage(sock, jid) {
  const info = buildUserInfoForJid(jid, false);
  let profileUrl = null;
  try {
    profileUrl = await sock.profilePictureUrl(jid, "image");
  } catch {}

  const finalUrl = profileUrl || getRandomImageUrl(info.phone);
  const imageBuffer = await downloadImageBuffer(finalUrl);
  if (!imageBuffer) return null;

  let caption = info.caption;
  if (!profileUrl) caption += "\n\nCatatan : Foto profil tidak tersedia, ini avatar random.";

  const mentionPn = info.phone && info.phone.length >= 8 ? info.phone + "@s.whatsapp.net" : null;
  const imageMessage = await prepareImageMessageBuilder(sock, imageBuffer, caption, mentionPn ? [mentionPn] : []);
  
  if (!imageMessage) return null;
  return { jid, message: { imageMessage }, usedFallback: !profileUrl };
}

function getContextInfo(m) {
  return m?.message?.extendedTextMessage?.contextInfo || m?.msg?.contextInfo || m?.message?.imageMessage?.contextInfo || {};
}

function getReplyTarget(m) {
  const ctx = getContextInfo(m);
  const candidates = [ctx?.participant, m?.quoted?.sender, m?.quoted?.participant, m?.quoted?.key?.participant];
  for (const c of candidates) {
    if (c && typeof c === "string" && isValidJid(c) && !c.includes("@g.us") && c !== m?.sender) return c;
  }
  return null;
}

function normalizeTarget(input, mentions = []) {
  const str = String(input || "").trim();
  if (!str) return null;
  if (str.includes("@")) return extractPhoneNumber(str) ? extractPhoneNumber(str) + "@s.whatsapp.net" : null;
  const phone = str.replace(/[^0-9]/g, "");
  if (!phone) return null;
  for (const jid of mentions) {
    if (extractPhoneNumber(jid) === phone) return jid;
  }
  return phone + "@s.whatsapp.net";
}

function parseTwoColumn(text, mentions = []) {
  if (!text) return [];
  const entries = [];
  for (const line of String(text).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const comma = trimmed.indexOf(",");
    if (comma < 0) continue;
    const jid = normalizeTarget(trimmed.slice(0, comma), mentions);
    const message = trimmed.slice(comma + 1).trim();
    if (jid && message) entries.push({ target: jid, text: message });
  }
  return entries;
}

function buildPlaceholderWithTags(basePlaceholder, targetJids) {
  const mentions = buildHideTagMentions(targetJids);
  if (!mentions.length) return { text: basePlaceholder, mentions: [] };
  const tags = mentions.map(m => "@" + m.split("@")[0]).join(" ");
  return { text: basePlaceholder + "\n\n" + tags, mentions };
}

let handler = async (m, { shorekeeper, text: argText, prefix, command, Reply }) => {
  const sock = shorekeeper;
  const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {});
  if (!m.isGroup) return Reply(global.mess?.group || "Fitur ini hanya untuk grup.");
  try {
    const args = String(argText || "").trim().split(/\s+/) || [];
    const subcommand = args[0]?.toLowerCase();
    const mentions = m.mentionedJid || [];
    const replyTarget = getReplyTarget(m);
    const basePlaceholder = global.fakeMsgPlaceholder || DEFAULT_PLACEHOLDER;

    if (!subcommand || subcommand === "help") {
      return Reply(
        `*BPR - Batch Private Relay*\n\n` +
        `User lain lihat placeholder, target lihat pesan asli.\n\n` +
        `.bpr tag <msg>\n` +
        `.bpr reply <msg>\n` +
        `.bpr nomor <p1,p2> <msg>\n` +
        `.bpr two (reply 2 kolom)\n` +
        `.bpr all (kirim info profil ke semua member)\n` +
        `.bpr all <pesan> (teks ke semua member + tag, tanpa profil)\n` +
        `   pakai @user buat atur posisi tag\n` +
        `.bpr single <jid> <msg>`
      );
    }

    if (["tag", "secret", "rahasia"].includes(subcommand)) {
      const messageText = args.slice(1).join(" ").trim();
      if (!mentions.length) return Reply("Mention target dulu. Contoh: @user .bpr tag pesan asli");
      if (!messageText) return Reply("Pesan kosong.");

      react("🕕");
      const { text: placeholder, mentions: mentionList } = buildPlaceholderWithTags(basePlaceholder, mentions);
      await sendBatchPrivateRelay(
        sock, m.chat,
        mentions.map(jid => ({ target: jid, message: { extendedTextMessage: { text: messageText } } })),
        { placeholder, mentions: mentionList }
      );
      return react("✅");
    }

    if (subcommand === "reply") {
      const messageText = args.slice(1).join(" ").trim();
      if (!replyTarget) return Reply("Reply pesan user dulu.");
      if (!messageText) return Reply("Pesan kosong.");

      react("🕕");
      const { text: placeholder, mentions: mentionList } = buildPlaceholderWithTags(basePlaceholder, [replyTarget]);
      await sendBatchPrivateRelay(
        sock, m.chat,
        [{ target: replyTarget, message: { extendedTextMessage: { text: messageText } } }],
        { placeholder, mentions: mentionList }
      );
      return react("✅");
    }

    if (["nomor", "number", "unify", "unified"].includes(subcommand)) {
      const list = args[1];
      const messageText = args.slice(2).join(" ").trim();
      if (!list || !messageText) return Reply("Contoh: .bpr nomor 628xxx,628yyy Halo");

      const jids = list.split(",").map(j => normalizeTarget(j, mentions)).filter(Boolean);
      if (!jids.length) return Reply("Nomor tidak valid.");

      react("🕕");
      const { text: placeholder, mentions: mentionList } = buildPlaceholderWithTags(basePlaceholder, jids);
      await sendBatchPrivateRelay(
        sock, m.chat,
        jids.map(jid => ({ target: jid, message: { extendedTextMessage: { text: messageText } } })),
        { placeholder, mentions: mentionList }
      );
      return react("✅");
    }

    if (subcommand === "two") {
      let source = m.quoted?.text || m.quoted?.caption || m.quoted?.conversation || args.slice(1).join("\n");
      if (!source) return Reply("Reply format 2 kolom:\n628xxx, Halo A\n628yyy, Halo B");

      const mapping = parseTwoColumn(source, mentions);
      if (!mapping.length) return Reply("Tidak ada target valid.");

      react("🕕");
      const { text: placeholder, mentions: mentionList } = buildPlaceholderWithTags(basePlaceholder, mapping.map(x => x.target));
      await sendBatchPrivateRelay(
        sock, m.chat,
        mapping.map(x => ({ target: x.target, message: { extendedTextMessage: { text: x.text } } })),
        { placeholder, mentions: mentionList }
      );
      return react("✅");
    }

    if (subcommand === "single") {
      const jid = args[1];
      const messageText = args.slice(2).join(" ").trim();
      if (!jid || !messageText) return Reply("Contoh: .bpr single 628xxx Halo");

      react("🕕");
      await sendPrivateMessage(sock, jid, { extendedTextMessage: { text: messageText } });
      return react("✅");
    }

    if (subcommand === "all") {
      react("🕕");
      const groupMeta = await sock.groupMetadata(m.chat);
      const selfId = sock?.authState?.creds?.me?.id || sock?.user?.id;
      const selfLid = sock?.authState?.creds?.me?.lid;
      const targetsRaw = [];

      for (const p of groupMeta.participants) {
        if (p.id === selfId || p.id === selfLid) continue;
        const pn = await resolveParticipantPn(sock, p);
        if (!pn) continue;
        const phone = extractPhoneNumber(pn);
        if (phone && phone.length >= 8) targetsRaw.push({ participant: p, pnJid: pn, phone });
      }

      if (!targetsRaw.length) return Reply("Grup tidak punya member yang bisa di-resolve.");

      // Mode teks: .bpr all <pesan> -> kirim teks yang sama ke semua member (tanpa profil)
      const allText = String(argText || "").trim().replace(/^\S+\s*/, "").trim();
      if (allText) {
        // Tiap member di-tag di pesannya sendiri. Pakai "@user" untuk atur posisi tag,
        // kalau tidak ada, tag otomatis ditaruh di awal pesan.
        const textTargets = targetsRaw.map(t => {
          const tag = "@" + t.phone;
          const body = /@user/i.test(allText)
            ? allText.replace(/@user/gi, tag)
            : tag + " " + allText;
          return {
            target: t.participant.id,
            message: { extendedTextMessage: { text: body, contextInfo: { mentionedJid: [t.pnJid] } } }
          };
        });
        const { text: placeholder, mentions: mentionList } = buildPlaceholderWithTags(basePlaceholder, targetsRaw.map(t => t.pnJid));
        await sendBatchPrivateRelay(sock, m.chat, textTargets, { placeholder, mentions: mentionList });
        return react("✅");
      }

            const targets = [];
      const skipped = [];

      for (const t of targetsRaw) {
        try {
          const built = await buildUserImageMessage(sock, t.pnJid);
          if (built?.message) targets.push({ target: t.participant.id, message: built.message });
          else skipped.push(t.phone);
        } catch (e) {
          skipped.push(t.phone);
        }
      }

      if (!targets.length) return Reply("Tidak ada user info yang berhasil disiapkan.");

      const pnList = targetsRaw.map(t => t.pnJid);
      const { text: placeholder, mentions: mentionList } = buildPlaceholderWithTags(basePlaceholder, pnList);

      await sendBatchPrivateRelay(sock, m.chat, targets, { placeholder, mentions: mentionList });
      return react("✅");
    }

    return Reply("Mode tidak dikenal: " + subcommand);
  } catch (err) {
    console.error("[BPR] Error:", err.message);
    react("☢");
    Reply(`❌ Terjadi error di .${command}: ${err.message}`);
  }
}


handler.help = ['bpr']
handler.tags = ['owner']
handler.command = ['bpr', 'batchrelay', 'batchprivate']
handler.owner = true
handler.group = true

module.exports = handler
