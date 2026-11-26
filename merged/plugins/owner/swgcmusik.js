/**
 * © Kureza MD — Hitoshi MD V1
 * Tambahan: .swgcmusik
 *
 * .swgcmusik <judul lagu / link>
 * Cari lagu lewat API yang sama dengan .music/.lagu, lalu kirim sebagai
 * STATUS GRUP (groupStatusMessage, sama seperti .swgc versi media)
 * langsung ke grup tempat command dipakai.
 *
 * Catatan:
 * - Owner only, sama seperti .swgc dan .bprswgc.
 * - Harus dipakai DI DALAM grup (status grup menempel ke grup itu).
 */
const axios = require('axios');

async function searchAndDownload(query) {
  const baseUrl = global.apiClutch;
  const apiKey = global.Apikeyclutch;

  // 1. Clutch API /download/play (judul lagu atau link YouTube)
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

  // 2. Fallback: AnaBot playmusic (dipakai juga oleh .music sebagai fallback)
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

let handler = async (m, { shorekeeper, text, Reply }) => {
  const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {});
  try {
    if (!m.isGroup) {
      return Reply('❌ Pakai perintah ini di dalam grup — status grup (SWGC) menempel ke grup itu.');
    }
    const query = String(text || '').trim();
    if (!query) return Reply('Contoh: .swgcmusik Laufey - From The Start');

    react('🕕');
    const track = await searchAndDownload(query);
    if (!track) {
      react('❌');
      return Reply('❌ Lagu tidak ditemukan / sumber audio gagal diambil. Coba judul lain atau link YouTube langsung.');
    }

    const audioRes = await axios.get(track.audioUrl, { responseType: 'arraybuffer', timeout: 45000 });
    const buf = Buffer.from(audioRes.data);

    await shorekeeper.sendMessage(m.chat, { groupStatusMessage: { audio: buf } });

    const meta = await shorekeeper.groupMetadata(m.chat).catch(() => null);
    const audience = meta?.participants?.length ? meta.participants.length - 1 : '-';

    react('✅');
    Reply(
      `\`⌜ SWGC Musik Terkirim ⌟\`\n` +
      `> ◦ *Judul :* ${track.title}\n` +
      `> ◦ *Artis :* ${track.artist}\n` +
      `> ◦ *Durasi :* ${track.duration}\n` +
      `> ◦ *Audiens :* ${audience} anggota grup`
    );
  } catch (err) {
    console.error('[SWGCMUSIK] Error:', err.message);
    react('☢');
    Reply(`❌ Gagal mengirim SWGC musik: ${err.message}`);
  }
};

handler.help = ['swgcmusik <judul/link>'];
handler.tags = ['owner'];
handler.command = ['swgcmusik', 'swgcmusic'];
handler.owner = true;

module.exports = handler;
