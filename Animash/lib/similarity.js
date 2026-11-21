// Pencocokan judul anime antar-sumber (Mobinime / AniList / AnimeIn).
// Judul dibandingkan TANPA penanda season/part, lalu season & part wajib sama:
// "Dandadan Season 2" cocok dengan "Dandadan 2nd Season", tapi tidak dengan "Dandadan".

const ROMAN = { ii: 2, iii: 3, iv: 4, v: 5, vi: 6 }

function seasonInfo(title) {
    let s = ' ' + String(title || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ') + ' '
    let season = 1
    let part = 1

    const patterns = [
        /\s(\d+)\s*(?:st|nd|rd|th)\s+season\s/,
        /\sseason\s+(\d+)\s/,
        /\ss(\d+)\s/
    ]
    for (const re of patterns) {
        const m = s.match(re)
        if (m) { season = Number(m[1]); s = s.replace(re, ' '); break }
    }
    if (season === 1) {
        const r = s.match(/\s(ii|iii|iv|v|vi)\s*$/)
        if (r) { season = ROMAN[r[1]]; s = s.replace(/\s(ii|iii|iv|v|vi)\s*$/, ' ') }
    }
    const p = s.match(/\s(?:part|cour)\s+(\d+)\s/)
    if (p) { part = Number(p[1]); s = s.replace(/\s(?:part|cour)\s+(\d+)\s/, ' ') }

    return { season, part, base: s.replace(/\s+/g, ' ').trim() }
}

function bigrams(s) {
    const out = new Map()
    for (let i = 0; i < s.length - 1; i++) {
        const g = s.slice(i, i + 2)
        out.set(g, (out.get(g) || 0) + 1)
    }
    return out
}

// Koefisien Dice (0..1) atas bigram huruf, spasi diabaikan.
function dice(a, b) {
    const x = a.replace(/\s+/g, '')
    const y = b.replace(/\s+/g, '')
    if (!x || !y) return 0
    if (x === y) return 1
    if (x.length < 2 || y.length < 2) return 0
    const bx = bigrams(x)
    const by = bigrams(y)
    let inter = 0
    for (const [g, n] of bx) inter += Math.min(n, by.get(g) || 0)
    return (2 * inter) / (x.length - 1 + y.length - 1)
}

/** Kemiripan judul 0..1. Season/part berbeda -> 0. */
function similarity(a, b) {
    const A = seasonInfo(a)
    const B = seasonInfo(b)
    if (A.season !== B.season || A.part !== B.part) return 0
    return dice(A.base, B.base)
}

module.exports = { similarity, seasonInfo }
