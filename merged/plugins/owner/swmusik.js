/**
 * © Kureza MD — Hitoshi MD V1
 * Tambahan: .swmusik
 *
 * .swmusik <judul lagu / link>
 * Cari lagu (API sama dengan .music/.lagu & .swgcmusik), lalu post sebagai
 * STATUS WHATSAPP BIASA milik akun bot (status@broadcast) — bukan status grup.
 *
 * Audiens status WA wajib ditentukan manual lewat "statusJidList" (ini
 * batasan resmi dari Baileys/WhatsApp, bukan pilihan kode): WhatsApp tidak
 * mengizinkan status dikirim tanpa daftar penerima. Default-nya:
 *  - dipakai di grup  -> audiens = semua anggota grup itu
 *  - dipakai di chat pribadi -> audiens = pengirim perintah (+ owner)
 *  - bisa override manual: .swmusik <judul> | @user1 @user2
 */
const axios = require('axios');

async function searchAndDownload(query) {
  const baseUrl = global.apiClutch;
  const apiKey = global.Apikeyclutch;

  try {
    const res = await axios.get(`${baseUrl}/download/play`, {
      params: { apikey: apiKey, query },
      timeout: 25000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = res.data?.result;
    const audioUrl = data?.audio || data?.download;
    if (data && audioUrl) {
      return {
        title: data.title || query,
        artist: data.author?.name || '-',
        duration: data.duration || '-',
        thumbnail: data.thumbnail || null,
        audioUrl
      };
    }
  } catch (e) {}

  try {
    const initRes = await axios.get('https://anabot.my.id/api/download/playmusic', {
      params: { query, apikey: 'freeApikey' },
      timeout: 25000
    });
    const taskId = initRes.data?.data?.taskId;
    if (taskId) {
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await axios.get('https://anabot.my.id/api/download/status', {
          params: { id: taskId, apikey: 'freeApikey' },
          timeout: 15000
        });
        if (statusRes.data?.status === 'completed' && statusRes.data?.data?.urls) {
          const cData = statusRes.data.data;
          return {
            title: cData.metadata?.title || query,
            artist: cData.metadata?.channel || '-',
            duration: cData.metadata?.duration
              ? `${Math.floor(cData.metadata.duration / 60)}:${(cData.metadata.duration % 60).toString().padStart(2, '0')}`
              : '-',
            thumbnail: cData.metadata?.thumbnail || null,
            audioUrl: cData.urls
          };
        }
      }
    }
  } catch (e) {}

  return null;
}

function parseQueryAndAudience(rawText, mentioned) {
  // ".swmusik <judul> | @user1 @user2" -> audiens override manual
  const parts = String(rawText || '').split('|');
  const query = (parts[0] || '').trim();
  const manualAudience = parts.length > 1 ? (mentioned || []) : [];
  return { query, manualAudience };
}

let handler = async (m, { shorekeeper, text, Reply }) => {
  const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {});
  try {
    const { query, manualAudience } = parseQueryAndAudience(text, m.mentionedJid);
    if (!query) return Reply('Contoh: .swmusik Laufey - From The Start\nBisa juga atur audiens manual: .swmusik <judul> | @user1 @user2');

    react('🕕');

    // Tentukan audiens (statusJidList) — wajib diisi, WhatsApp menolak status tanpa daftar penerima
    let statusJidList = [];
    if (manualAudience.length) {
      statusJidList = manualAudience;
    } else if (m.isGroup) {
      const meta = await shorekeeper.groupMetadata(m.chat).catch(() => null);
      const selfId = shorekeeper?.authState?.creds?.me?.id || shorekeeper?.user?.id;
      statusJidList = (meta?.participants || [])
        .map((p) => p.id)
        .filter((id) => id !== selfId);
    } else {
      statusJidList = [m.sender].filter(Boolean);
    }

    if (!statusJidList.length) {
      react('❌');
      return Reply('❌ Tidak ada audiens untuk status ini. Tambahkan audiens manual: .swmusik <judul> | @user');
    }

    const track = await searchAndDownload(query);
    if (!track) {
      react('❌');
      return Reply('❌ Lagu tidak ditemukan / sumber audio gagal diambil. Coba judul lain atau link YouTube langsung.');
    }

    const audioRes = await axios.get(track.audioUrl, { responseType: 'arraybuffer', timeout: 45000 });
    const buf = Buffer.from(audioRes.data);

    await shorekeeper.sendMessage(
      'status@broadcast',
      { audio: buf, mimetype: 'audio/mp4', ptt: false },
      { backgroundColor: '#000000', font: 2, statusJidList }
    );

    react('✅');
    Reply(
      `\`⌜ SW Musik Terkirim ⌟\`\n` +
      `> ◦ *Judul :* ${track.title}\n` +
      `> ◦ *Artis :* ${track.artist}\n` +
      `> ◦ *Durasi :* ${track.duration}\n` +
      `> ◦ *Audiens :* ${statusJidList.length} kontak`
    );
  } catch (err) {
    console.error('[SWMUSIK] Error:', err.message);
    react('☢');
    Reply(`❌ Gagal mengirim SW musik: ${err.message}`);
  }
};

handler.help = ['swmusik <judul/link> | @user1 @user2'];
handler.tags = ['owner'];
handler.command = ['swmusik', 'swbiasa', 'swbiasamusik'];
handler.owner = true;

module.exports = handler;
