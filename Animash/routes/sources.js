// GET /api/episode/:slug/sources — daftar server video tambahan (AnimeIn / RAPSODI MP4)
//
// Bentuk slug yang diterima:
//   - ain_<animeId>_ep_<epId>                     -> langsung dari AnimeIn
//   - <epsSlug>?anime=<animeSlug>                 -> episode Animash (API utama atau AniList);
//     judul & nomor episode dicari dari detail anime, lalu dicocokkan ke katalog AnimeIn.
const express = require('express')
const settingsCache = require('../lib/settingsCache')
const publicApi = require('../lib/publicApi')
const animein = require('../lib/sources/animein')

function epNumberOf(ep) {
    const m = String((ep && ep.title) || '').match(/(\d+(?:\.\d+)?)/)
    return m ? Number(m[1]) : null
}

module.exports = (mobinime) => {
    const router = express.Router()

    router.get('/:slug/sources', async (req, res) => {
        const send = (sources, extra = {}) => {
            res.set('Cache-Control', 'public, max-age=300')
            res.json({ ok: true, sources, ...extra })
        }
        try {
            if (!animein.enabled) return send([], { disabled: true })
            const slug = String(req.params.slug || '')

            if (animein.isSlug(slug)) {
                if (!/^ain_\d+_ep_\d+$/.test(slug)) return res.status(400).json({ ok: false, reason: 'bad_slug' })
                return send(await animein.getEpisodeSources(slug))
            }

            const animeId = String(req.query.anime || '').split('-')[0]
            const epsId = slug.split('-')[0]
            if (!/^(al)?\d+$/.test(animeId) || !/^\d+$/.test(epsId)) {
                return res.status(400).json({ ok: false, reason: 'bad_slug' })
            }
            if ((await settingsCache.getBlacklistSet()).has(animeId)) return send([])

            // Anime dari AniList: ID episode = ID episode AnimeIn (lihat ServerData.detail)
            if (publicApi.isPublicId(animeId)) {
                return send(await animein.getEpisodeSources(`ain_0_ep_${epsId}`))
            }

            const detail = await mobinime.detail(animeId)
            const ep = (detail.episodes || []).find(e => e.id === epsId)
            const num = epNumberOf(ep)
            if (!num) return send([])
            send(await animein.sourcesFor(detail.title, num))
        } catch (e) {
            console.warn('[Animash] sumber AnimeIn gagal:', e && e.message ? e.message : e)
            res.status(200).json({ ok: false, sources: [] })
        }
    })

    return router
}
