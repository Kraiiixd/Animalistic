const express = require('express')
const router = express.Router()
const settingsCache = require('../lib/settingsCache')

module.exports = (mobinime) => {
    router.get('/:slug', async (req, res) => {
        try {
            const id = req.params.slug.split('-')[0]

            // ID anime numerik (API utama) atau "al123" (API publik AniList) —
            // tolak slug aneh sebelum menyentuh API
            if (!/^(al)?\d+$/.test(id)) {
                return res.status(404).render('404', { active: '' })
            }

            // Anime yang di-blacklist admin disembunyikan
            if ((await settingsCache.getBlacklistSet()).has(id)) {
                return res.status(404).render('404', { active: '' })
            }

            const detailData = await mobinime.detail(id)
            res.render('detail', {
                anime: detailData, active: 'home',
                pageTitle: detailData.title,
                pageDescription: `Nonton ${detailData.title} subtitle Indonesia di Animash.`,
                pageImage: detailData.img || null
            })
        } catch (error) {
            const notFound = /tidak ditemukan|404/i.test(String(error && error.message))
            if (notFound) return res.status(404).render('404', { active: '' })
            res.status(500).render('error', { error: 'Gagal memuat detail anime. Coba lagi sebentar lagi.' })
        }
    })

    return router
}
