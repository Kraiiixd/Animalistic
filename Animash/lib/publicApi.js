// Sumber data CADANGAN dari API publik AniList (https://anilist.co, GraphQL,
// gratis & tanpa API key). Dipakai otomatis bila API utama (Mobinime) gagal,
// atau dipaksa lewat env ANIME_API=anilist.
//
// Catatan: AniList hanya menyediakan INFO anime (judul, cover, sinopsis,
// genre, jadwal tayang) — bukan video. Halaman detail dari sumber ini tampil
// lengkap, tapi tombol nonton baru aktif lagi setelah API utama pulih.
const axios = require('axios')

const ENDPOINT = () => process.env.ANILIST_URL || 'https://graphql.anilist.co'
const ID_PREFIX = 'al' // ID AniList diberi prefix supaya tidak bentrok dengan ID Mobinime

const http = axios.create({
    timeout: 12000,
    headers: { 'content-type': 'application/json', accept: 'application/json' }
})

async function gql(query, variables) {
    const { data } = await http.post(ENDPOINT(), { query, variables })
    if (data.errors && data.errors.length) throw new Error(data.errors[0].message)
    return data.data
}

const MEDIA_FIELDS = `
    id
    title { romaji english userPreferred }
    coverImage { extraLarge large }
    bannerImage
    episodes
    averageScore
    seasonYear
    status
    nextAiringEpisode { episode }
`

function slugify(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
}

function titleOf(m) {
    return (m.title && (m.title.userPreferred || m.title.romaji || m.title.english)) || 'Tanpa Judul'
}

function statusOf(m) {
    return m.status === 'RELEASING' || m.status === 'NOT_YET_RELEASED' ? 'Ongoing' : 'Completed'
}

function normalize(m) {
    const title = titleOf(m)
    const id = ID_PREFIX + m.id
    const airedEps = m.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : null
    return {
        id,
        slug: `${id}-${slugify(title)}`,
        title,
        img: (m.coverImage && (m.coverImage.extraLarge || m.coverImage.large)) || '',
        eps: airedEps || m.episodes || '?',
        rating: m.averageScore ? (m.averageScore / 10).toFixed(2) : '-',
        year: m.seasonYear ? String(m.seasonYear) : '',
        status: statusOf(m),
        source: 'anilist'
    }
}

function isPublicId(id) {
    return new RegExp(`^${ID_PREFIX}\\d+$`).test(String(id))
}

// Senin=1 ... Minggu=7 (zona WIB, sama dengan urutan jadwal Mobinime)
const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
function wibDayIndex(unixSec) {
    const d = new Date((unixSec + 7 * 3600) * 1000) // geser ke WIB
    return (d.getUTCDay() + 6) % 7 // getUTCDay: Minggu=0 -> jadikan Senin=0
}

async function schedule() {
    const now = Math.floor(Date.now() / 1000)
    const q = `
        query ($from: Int, $to: Int, $page: Int) {
            Page(page: $page, perPage: 50) {
                pageInfo { hasNextPage }
                airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) { airingAt media { ${MEDIA_FIELDS} isAdult } }
            }
        }`
    const vars = { from: now, to: now + 7 * 86400 }
    // Maks 4 halaman (200 jadwal) — cukup untuk 1 minggu & ramah rate limit
    const pages = await Promise.all([1, 2, 3, 4].map(page => gql(q, { ...vars, page }).catch(() => null)))

    const buckets = DAY_NAMES.map(day => ({ day, list: [], seen: new Set() }))
    for (const pg of pages) {
        if (!pg) continue
        for (const s of (pg.Page.airingSchedules || [])) {
            if (!s.media || s.media.isAdult) continue
            const b = buckets[wibDayIndex(s.airingAt)]
            if (b.seen.has(s.media.id)) continue
            b.seen.add(s.media.id)
            b.list.push(normalize(s.media))
        }
    }
    // Urutkan mulai Senin seperti jadwal API utama
    return buckets.filter(b => b.list.length).map(b => ({ day: b.day, list: b.list }))
}

async function home() {
    const [data, sched] = await Promise.all([
        gql(`
            query {
                ongoing: Page(perPage: 24) { media(type: ANIME, status: RELEASING, sort: TRENDING_DESC, isAdult: false) { ${MEDIA_FIELDS} } }
                recommend: Page(perPage: 18) { media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} } }
            }`),
        schedule().catch(() => [])
    ])
    return {
        recommend: data.recommend.media.map(normalize),
        ongoing: data.ongoing.media.map(normalize),
        schedule: sched,
        source: 'anilist'
    }
}

// page: indeks halaman mulai 0 (sama seperti startpage Mobinime)
async function search(q, { page = 0, count = 25 } = {}) {
    const data = await gql(`
        query ($q: String, $page: Int, $per: Int) {
            Page(page: $page, perPage: $per) { media(type: ANIME, search: $q, isAdult: false, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} } }
        }`, { q: String(q), page: Number(page) + 1, per: Number(count) })
    return data.Page.media.map(normalize)
}

async function detail(id) {
    const numeric = Number(String(id).replace(ID_PREFIX, ''))
    const data = await gql(`
        query ($id: Int) {
            Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} description(asHtml: true) genres }
        }`, { id: numeric })
    const m = data.Media
    if (!m) throw new Error('Anime tidak ditemukan')
    const base = normalize(m)
    return {
        ...base,
        // Semua variasi judul -> dipakai untuk mencari video di sumber lain (AnimeIn)
        altTitles: [...new Set([m.title && m.title.romaji, m.title && m.title.english, base.title].filter(Boolean))],
        desc: m.description || '',
        genres: (m.genres || []).map(title => ({ title })),
        episodes: [] // AniList tidak punya video — diisi dari AnimeIn oleh ServerData.detail()
    }
}

module.exports = { home, schedule, search, detail, isPublicId, normalize, ID_PREFIX }
