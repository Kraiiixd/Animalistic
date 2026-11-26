/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * .ttsticker <link TikTok> [jumlah 1-10]
 * Ambil stiker / foto dari komentar video TikTok lalu kirim ke chat.
 *
 * Kalau link yang dikirim adalah link "share komentar" TikTok (mengandung
 * comment_id / reply_id di parameternya), bot hanya mengambil stiker dari
 * komentar itu saja, bukan dari komentar lain di video yang sama.
 *
 * Scraper asli: *JH a.k.a DHIKA - FIONY BOT* (credit dipertahankan).
 * Diadaptasi ke format plugin Hitoshi: input dari pesan, hasil berupa objek,
 * ada timeout, dan berhenti begitu stiker yang diminta sudah cukup.
 */

const axios = require('axios')
const cheerio = require('cheerio')

const _dec = (s) => Buffer.from(s, 'base64').toString('utf-8')


const HEAD = {
    'User-Agent': _dec('TW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDEwOyBLKSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTI0LjAuMC4wIE1vYmlsZSBTYWZhcmkvNTM3LjM2'),
    'Accept': _dec('YXBwbGljYXRpb24vanNvbiwgdGV4dC9wbGFpbiwgdGV4dC9odG1sLCAqLyo='),
    'Referer': _dec('aHR0cHM6Ly93d3cudGlrdG9rLmNvbS8=')
}
const TIMEOUT = 15000
const DEFAULT_WANT = 5
const MAX_WANT = 10

const fmtAngka = x => Number(x || 0).toLocaleString('id-ID')
const fmtWaktu = t => t ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(new Date(t * 1000)) + ' WIB' : '-'
const assetId = u => (u.match(/\/([0-9a-f]{32})~/i) || [])[1] || u.split('?')[0]
const skorVarian = u => (/origin/i.test(u) ? 2 : 0) + (/\.jpe?g(\?|$)/i.test(u) ? 1 : 0)
const fmtFile = u => /awebp|\.webp/i.test(u) ? 'webp' : /png/i.test(u) ? 'png' : 'jpeg'

// Link "share komentar" TikTok biasanya bawa comment_id / reply_id di query string,
// mis: ...?comment_id=7123456789012345 atau &reply_id=7123456789012345
function extractTargetCommentId(url) {
    try {
        const u = new URL(url)
        for (const [k, v] of u.searchParams.entries()) {
            if (/comment.?id|reply.?id/i.test(k) && /^\d{10,22}$/.test(v)) return v
        }
    } catch {}
    const m = url.match(/[?&](?:comment|reply)[_-]?id=(\d{10,22})/i)
    return m ? m[1] : null
}

async function scrape(sumber, want, targetCommentId) {
    let tautanAsli = sumber.trim()
    if (/vt\.tiktok\.com|vm\.tiktok\.com|\/t\//i.test(tautanAsli)) {
        const { request } = await axios.get(tautanAsli, { headers: HEAD, maxRedirects: 5, timeout: TIMEOUT, validateStatus: () => true })
        tautanAsli = request?.res?.responseUrl || tautanAsli
    }

    const idVT = (tautanAsli.match(/(?:video|photo|v)\/(\d+)/i) || tautanAsli.match(/(\d{15,22})/))?.[1]
    if (!idVT) throw new Error('ID video TikTok tidak ditemukan. Pastikan linknya benar.')

    let meta = { id: idVT }
    try {
        const { data: html } = await axios.get(`https://m.tiktok.com/v/${idVT}.html`, { headers: HEAD, timeout: TIMEOUT })
        const skrip = cheerio.load(html)('script#__UNIVERSAL_DATA_FOR_REHYDRATION__').html()
        if (skrip) {
            const scope = JSON.parse(skrip)?.['__DEFAULT_SCOPE__'] || {}
            const ob = scope['webapp.video-detail']?.itemInfo?.itemStruct || scope['webapp.reflow.video.detail']?.itemInfo?.itemStruct
            if (ob) meta = { id: ob.id, desc: ob.desc || '', author: { username: ob.author?.uniqueId, nickname: ob.author?.nickname } }
        }
    } catch {}

    const peta = new Map()
    let scanUtama = 0, scanBalasan = 0, cukup = false

    const cariUrl = (node, dalam, out) => {
        if (!node || dalam > 4) return
        if (typeof node === 'string') { if (/^https?:\/\//i.test(node)) out.push(node); return }
        if (Array.isArray(node)) { for (const x of node) cariUrl(x, dalam + 1, out); return }
        if (typeof node === 'object') { for (const kk of Object.keys(node)) cariUrl(node[kk], dalam + 1, out) }
    }

    const panen = (k, dari) => {
        if (!k) return
        if (targetCommentId && String(k.cid) !== String(targetCommentId)) return
        for (const kk of Object.keys(k)) {
            if (!/sticker|image|pic|media|emoji|attach/i.test(kk) || !k[kk]) continue
            const v = k[kk]
            const urls = []
            cariUrl(v, 0, urls)
            if (!urls.length) continue
            const type = /sticker/i.test(kk) ? 'sticker' : 'foto'
            for (const u of urls) {
                const id = assetId(u)
                const skor = skorVarian(u)
                const ada = peta.get(id)
                if (ada && ada.skor >= skor) continue
                peta.set(id, {
                    skor, id, type,
                    format: fmtFile(u),
                    url: u,
                    author: `@${k.user?.unique_id} (${k.user?.nickname})`,
                    source: dari,
                    likes: fmtAngka(k.digg_count),
                    date: fmtWaktu(k.create_time)
                })
            }
        }
        if (targetCommentId) { if (peta.size) cukup = true }
        else if (peta.size >= want) cukup = true
    }

    let sumberData = 'tiktok-native'
    let [ptrUtama, limitUtama] = [0, true]
    while (limitUtama && !cukup && scanUtama < 200) {
        const apiVT = `https://www.tiktok.com/api/comment/list/?aid=1988&app_language=id&app_name=tiktok_web&aweme_id=${idVT}&count=50&cursor=${ptrUtama}`
        const { data: dataKomen } = await axios.get(apiVT, { headers: HEAD, timeout: TIMEOUT, validateStatus: () => true })
        const baris = dataKomen?.comments || []
        if (!baris.length) break

        for (const k of baris) {
            scanUtama++
            panen(k, 'Komentar Utama')
            if (k.reply_comment?.length) { scanBalasan += k.reply_comment.length; for (const b of k.reply_comment) panen(b, `Balasan ke @${k.user?.unique_id}`) }
            if (cukup) break

            if (k.reply_comment_total > 0) {
                let [ptrBalas, limitBalas] = [0, true]
                while (limitBalas && !cukup && scanBalasan < 300) {
                    const apiBalas = `https://www.tiktok.com/api/comment/list/reply/?aid=1988&app_language=id&app_name=tiktok_web&item_id=${idVT}&comment_id=${k.cid}&count=20&cursor=${ptrBalas}`
                    const { data: dataBalas } = await axios.get(apiBalas, { headers: HEAD, timeout: TIMEOUT, validateStatus: () => true })
                    const isi = dataBalas?.comments || []
                    if (!isi.length) break
                    scanBalasan += isi.length
                    for (const b of isi) panen(b, `Balasan ke @${k.user?.unique_id}`)
                    limitBalas = !!dataBalas.has_more
                    ptrBalas = dataBalas.cursor || (ptrBalas + isi.length)
                }
            }
            if (cukup) break
        }
        limitUtama = !!dataKomen.has_more
        ptrUtama = dataKomen.cursor ?? (ptrUtama + baris.length)
    }

    if (!scanUtama) {
        sumberData = 'tikwm'
        const { data: tw } = await axios.get(_dec('aHR0cHM6Ly93d3cudGlrd20uY29tL2FwaS9jb21tZW50L2xpc3Q='), {
            params: { url: sumber, aweme_id: idVT, cursor: 0, count: 50 },
            headers: { ...HEAD, Referer: _dec('aHR0cHM6Ly93d3cudGlrd20uY29tLw==') },
            timeout: TIMEOUT,
            validateStatus: () => true
        })
        const list = tw?.data?.comments || []
        scanUtama = list.length
        for (const k of list) {
            panen(k, 'Komentar Utama')
            if (k.reply_comment?.length) { scanBalasan += k.reply_comment.length; for (const b of k.reply_comment) panen(b, `Balasan ke @${k.user?.unique_id}`) }
            if (cukup) break
        }
    }

    // stiker asli dulu, baru foto komentar
    const stickers = [...peta.values()]
        .map(({ skor, ...sisa }) => sisa)
        .sort((a, b) => (a.type === 'sticker' ? 0 : 1) - (b.type === 'sticker' ? 0 : 1))

    return { meta, sumber: sumberData, scanUtama, scanBalasan, stickers }
}

const download = async (url) => {
    const { data } = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: { ...HEAD, Accept: 'image/*,*/*' }
    })
    return Buffer.from(data)
}

let handler = async (m, { shorekeeper, args, text, prefix, command, Reply, isCreator, checkLimit, addLimit }) => {
    const raw = [text, m.quoted?.text].filter(Boolean).join(' ')
    const link = raw.match(/https?:\/\/[^\s]+/i)?.[0]
    if (!link) return Reply(`Kirim link video TikTok.\nContoh: ${prefix}${command} https://vt.tiktok.com/xxxx 5\n(jumlah 1-${MAX_WANT}, default ${DEFAULT_WANT})`)
    if (!/tiktok\.com/i.test(link)) return Reply('Link harus dari TikTok.')

    const num = parseInt((args || []).find(a => /^\d{1,2}$/.test(a)))
    const want = Math.min(Math.max(num || DEFAULT_WANT, 1), MAX_WANT)
    const targetCommentId = extractTargetCommentId(link)

    if (checkLimit(m.sender, isCreator)) return Reply(global.mess.limit)

    const react = (e) => shorekeeper.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
    await react('⏳')

    let res
    try {
        res = await scrape(link, want, targetCommentId)
    } catch (err) {
        console.error('[TTSTICKER] scrape gagal:', err?.message || err)
        await react('❌')
        return Reply(`❌ Gagal mengambil komentar: ${err.message}`)
    }

    if (!res.stickers.length) {
        await react('❌')
        if (targetCommentId) {
            return Reply(`❌ Komentar yang ditunjuk link ini (ID ${targetCommentId}) tidak ditemukan atau tidak berisi stiker/foto.\nTerbaca ${res.scanUtama} komentar + ${res.scanBalasan} balasan saat mencari.`)
        }
        return Reply(`❌ Terbaca ${res.scanUtama} komentar + ${res.scanBalasan} balasan, tapi tidak ada stiker/foto di dalamnya.`)
    }

    let sent = 0
    for (const s of res.stickers.slice(0, want)) {
        try {
            const buf = await download(s.url)
            if (!buf.length) continue
            if (s.type === 'sticker') {
                await shorekeeper.sendAsSticker(m.chat, buf, m, { packname: global.packname, author: global.namaOwner })
            } else {
                await shorekeeper.sendMessage(m.chat, {
                    image: buf,
                    caption: `> ◦ *Dari :* ${s.author}\n> ◦ *Likes :* ${s.likes}\n> ◦ *Tanggal :* ${s.date}`
                }, { quoted: m })
            }
            sent++
        } catch (err) {
            console.error('[TTSTICKER] kirim gagal:', s.id, err?.message || err)
        }
    }

    if (!sent) {
        await react('❌')
        return Reply('❌ Stiker ditemukan, tapi semuanya gagal diunduh/dikirim. Coba lagi nanti.')
    }

    addLimit(m.sender, isCreator)
    await react('✅')
    const by = res.meta.author?.username ? ` @${res.meta.author.username}` : ''
    await Reply(`✅ ${sent} dari ${Math.min(want, res.stickers.length)} stiker terkirim.\nVideo${by}\nTerbaca ${res.scanUtama} komentar + ${res.scanBalasan} balasan.`)
}

handler.command = ['ttsticker', 'tiktoksticker', 'ttstiker']

module.exports = handler
