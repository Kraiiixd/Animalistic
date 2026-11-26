/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const axios = require('axios');

/**
 * Download Facebook Video / Reels via API Clutch
 * @param {string} url - Facebook video/reel/share URL
 * @returns {Promise<{ title: string, quality: string, videoUrl: string, buffer: Buffer }>}
 */
async function downloadFacebook(url) {
    if (!url || typeof url !== 'string') {
        throw new Error("URL Facebook tidak valid.");
    }

    const match = url.match(/https?:\/\/(?:www\.|web\.|m\.|mobile\.)?(?:facebook\.com|fb\.watch|fb\.me)[^\s]+/i);
    const targetUrl = match ? match[0] : url.trim();

    const baseUrl = global.apiClutch;
    const apiKey = global.Apikeyclutch;

    try {
        const res = await axios.get(`${baseUrl}/download/facebook?apikey=${apiKey}&url=${encodeURIComponent(targetUrl)}`, {
            timeout: 35000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const data = res.data?.result || res.data?.data;
        if (!data) {
            throw new Error(res.data?.error || "Gagal mendapatkan video Facebook dari server API.");
        }

        const videoUrl = data.hd || data.sd || data.media || data.video?.[0]?.url;
        if (!videoUrl) {
            throw new Error("Link unduhan video Facebook tidak ditemukan.");
        }

        let buffer = null;
        try {
            const dlRes = await axios.get(videoUrl, {
                responseType: 'arraybuffer',
                timeout: 45000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            buffer = Buffer.from(dlRes.data);
        } catch (e) {}

        return {
            title: data.title || 'Facebook Video',
            quality: data.hd ? 'HD' : 'SD',
            videoUrl: videoUrl,
            buffer: buffer
        };
    } catch (err) {
        throw new Error(err.response?.data?.error || err.message || "Gagal mengunduh video Facebook");
    }
}

module.exports = {
    downloadFacebook
};
