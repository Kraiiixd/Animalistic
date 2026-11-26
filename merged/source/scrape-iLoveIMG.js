/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const axios = require('axios');

async function uploadToCDN(buffer, mimeType = 'image/png') {
    try {
        const response = await axios.post('https://cdn-alip.clutch.web.id/api/upload', {
            buffer: buffer.toString('base64'),
            mimeType: mimeType
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        if (response.data?.url) {
            return `https://cdn-alip.clutch.web.id${response.data.url}`;
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Upscale image via API Clutch (iLoveIMG AI Engine)
 * @param {Buffer} imageBuffer
 * @param {number} [multiplier=2]
 * @returns {Promise<Buffer>}
 */
async function upscaleImage(imageBuffer, multiplier = 2) {
    if (!Buffer.isBuffer(imageBuffer)) throw new Error("Input harus berupa Buffer gambar.");

    const baseUrl = global.apiClutch;
    const apiKey = global.Apikeyclutch;

    try {
        const cdnUrl = await uploadToCDN(imageBuffer, 'image/png');
        if (!cdnUrl) throw new Error("Gagal mengupload gambar ke CDN");

        const scale = multiplier === 4 ? '4' : '2';
        const res = await axios.get(`${baseUrl}/imagecreator/upscale?apikey=${apiKey}&url=${encodeURIComponent(cdnUrl)}&scale=${scale}`, {
            responseType: 'arraybuffer',
            timeout: 60000
        });

        return Buffer.from(res.data);
    } catch (err) {
        throw new Error(err.response?.data?.error || err.message || "Gagal melakukan AI Upscale");
    }
}

/**
 * Remove Background via API Clutch (iLoveIMG AI Engine)
 * @param {Buffer} imageBuffer
 * @returns {Promise<Buffer>}
 */
async function removeBackground(imageBuffer) {
    if (!Buffer.isBuffer(imageBuffer)) throw new Error("Input harus berupa Buffer gambar.");

    const baseUrl = global.apiClutch;
    const apiKey = global.Apikeyclutch;

    try {
        const cdnUrl = await uploadToCDN(imageBuffer, 'image/png');
        if (!cdnUrl) throw new Error("Gagal mengupload gambar ke CDN");

        const res = await axios.get(`${baseUrl}/imagecreator/removebg?apikey=${apiKey}&url=${encodeURIComponent(cdnUrl)}`, {
            responseType: 'arraybuffer',
            timeout: 60000
        });

        return Buffer.from(res.data);
    } catch (err) {
        throw new Error(err.response?.data?.error || err.message || "Gagal melakukan Remove Background");
    }
}

module.exports = {
    upscaleImage,
    removeBackground
};
