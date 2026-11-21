// Sumber video AnimeIn — diuji dengan klien HTTP tiruan (tanpa internet).
const test = require('node:test')
const assert = require('node:assert/strict')
const cache = require('../lib/cache')
const animein = require('../lib/sources/animein')

const ok = (data) => ({ data: { status: 200, error: false, data } })

const CATALOG = [
    { id: '5284', title: 'Dandadan', synonyms: 'DAN DA DAN, ダンダダン, DDD', type: 'SERIES' },
    { id: '5943', title: 'Dandadan 2nd Season', synonyms: 'Dan Da Dan Season 2', type: 'SERIES' }
]

// 75 episode, urut menurun, 30 per halaman, dengan 1 nomor ganda & 1 nomor salah di depan
function episodesPage(page) {
    const all = [{ id: '9999', index: '7071', title: 'Episode 7071' }]
    for (let i = 75; i >= 1; i--) {
        all.push({ id: String(1000 + i), index: String(i), title: `Episode ${i}` })
        if (i === 6) all.push({ id: '2006', index: '6', title: 'Episode 6' })
    }
    return all.slice(page * 30, page * 30 + 30)
}

function fakeClient({ fail = false } = {}) {
    const calls = []
    return {
        calls,
        async get(url) {
            calls.push(url)
            if (fail) throw new Error('network down')
            if (url.startsWith('/3/2/explore/movie')) return ok({ movie: CATALOG })
            const ep = url.match(/\/3\/2\/movie\/episode\/(\d+)\?page=(\d+)/)
            if (ep) {
                if (ep[1] === '5943') return ok({ episode: [{ id: '7003', index: '3', title: 'Episode 3' }] })
                return ok({ episode: episodesPage(Number(ep[2])) })
            }
            const st = url.match(/\/3\/2\/episode\/streamnew\/(\d+)/)
            if (st) {
                return ok({
                    server: [
                        { name: 'RAPSODI', quality: '360p', link: `https://cdn.test/${st[1]}-360p.mp4`, type: 'direct' },
                        { name: 'RAPSODI', quality: '1080', link: `https://cdn.test/${st[1]}-1080p.mp4`, type: 'direct' },
                        { name: 'RAPSODI', quality: '720p', link: `https://cdn.test/${st[1]}-720p.mp4`, type: 'direct' },
                        { name: 'EMBED', quality: '720p', link: 'https://embed.test/player?id=1', type: 'embed' },
                        { name: 'HTTP', quality: '480p', link: 'http://insecure.test/a.mp4', type: 'direct' }
                    ]
                })
            }
            return { data: { status: 404, error: true } }
        }
    }
}

test.beforeEach(() => cache.clear())

test('mengembalikan MP4 RAPSODI urut kualitas tertinggi, tanpa embed & tanpa http', async () => {
    animein._setClient(fakeClient())
    const sources = await animein.sourcesFor('Dandadan', 1)
    assert.deepEqual(sources.map(s => s.quality), ['1080p', '720p', '360p'])
    assert.equal(sources[0].url, 'https://cdn.test/1001-1080p.mp4')
    assert.ok(sources.every(s => s.type === 'mp4' && s.lang === 'id'))
})

test('season 2 diarahkan ke anime season 2, bukan season 1', async () => {
    animein._setClient(fakeClient())
    const sources = await animein.sourcesFor('Dandadan Season 2', 3)
    assert.equal(sources[0].url, 'https://cdn.test/7003-1080p.mp4')
})

test('judul yang tidak mirip (< 0.85) tidak diberi video', async () => {
    animein._setClient(fakeClient())
    assert.deepEqual(await animein.sourcesFor('Naruto Shippuden', 1), [])
})

test('episode di halaman lain ditemukan meski episode pertama salah nomor', async () => {
    animein._setClient(fakeClient())
    const ep = await animein.findEpisode('5284', 10)
    assert.equal(ep.id, '1010')
})

test('daftar semua episode urut dari 1 dan tanpa nomor ganda', async () => {
    animein._setClient(fakeClient())
    const all = await animein.getAllEpisodes('5284')
    const nums = all.map(e => e.index)
    assert.equal(nums[0], 1)
    assert.equal(new Set(nums).size, nums.length)
    assert.equal(nums.filter(n => n === 6).length, 1)
})

test('slug ain_<anime>_ep_<episode> langsung mengembalikan sumber', async () => {
    animein._setClient(fakeClient())
    const sources = await animein.getEpisodeSources('ain_5284_ep_1001')
    assert.equal(sources.length, 3)
    assert.deepEqual(await animein.getEpisodeSources('bukan-slug'), [])
})

test('AnimeIn mati -> daftar kosong, tidak error', async () => {
    animein._setClient(fakeClient({ fail: true }))
    assert.deepEqual(await animein.sourcesFor('Dandadan', 1), [])
})

test('AnimeIn mati sesaat -> hasil lama dari cache tetap dipakai', async () => {
    animein._setClient(fakeClient())
    const first = await animein.searchAnime('Dandadan')
    // paksa data dianggap kedaluwarsa, lalu sumber gagal
    for (const v of cache.memo.values()) v.fresh = 0
    animein._setClient(fakeClient({ fail: true }))
    const again = await animein.searchAnime('Dandadan')
    assert.deepEqual(again, first)
})
