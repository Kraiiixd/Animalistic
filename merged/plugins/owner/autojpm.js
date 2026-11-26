/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const {
    loadJPM,
    addJob,
    getJob,
    deleteJob,
    deleteAllJobs,
    setEnabled,
    setRunning,
    setTarget,
    setJPMInterval,
    addTargetGroup,
    delTargetGroup
} = require('../../library/jpm')
const { startJPMScheduler, sendJPMJob } = require('../../library/jpmScheduler')
const { parseDurationToken, humanizeMs } = require('../../library/jpmUtils')

function targetLabel(target) {
    return Array.isArray(target) ? `${target.length} grup dipilih` : 'Semua Grup'
}

function statusLabel(db) {
    if (!db.enabled) return 'NONAKTIF'
    return db.running ? 'AKTIF' : 'TERPASANG (dijeda)'
}

async function sendTargetPicker(shorekeeper, m, pfx) {
    let allGroups
    try {
        allGroups = await shorekeeper.groupFetchAllParticipating()
    } catch (e) {
        return shorekeeper.sendMessage(m.chat, { text: 'Gagal mengambil daftar grup.' }, { quoted: m })
    }

    const groupList = Object.values(allGroups || {})
    if (groupList.length === 0) {
        return shorekeeper.sendMessage(m.chat, { text: 'Bot belum tergabung di grup manapun.' }, { quoted: m })
    }

    const db = loadJPM()
    const currentTarget = Array.isArray(db.target) ? db.target : []

    const groupRows = groupList.map((g) => {
        const isSelected = currentTarget.includes(g.id)
        return {
            title: `${isSelected ? '[v]' : '[ ]'} ${g.subject}`,
            id: `${pfx}autojpm target ${isSelected ? 'del' : 'add'} ${g.id}`
        }
    })

    const sections = []
    const chunkSize = 10
    for (let i = 0; i < groupRows.length; i += chunkSize) {
        sections.push({
            title: `Grup ${Math.floor(i / chunkSize) + 1}`,
            rows: groupRows.slice(i, i + chunkSize)
        })
    }
    sections.push({
        title: 'Aksi Lain',
        rows: [
            { title: 'Jalankan ke Semua Grup', id: `${pfx}autojpm target all` },
            { title: 'Selesai', id: `${pfx}autojpm target done` }
        ]
    })

    return shorekeeper.sendMessage(m.chat, {
        image: { url: global.image && global.image.menu },
        caption: `PILIH GRUP TARGET AUTO JPM\n\n` +
            `Tap nama grup untuk menambah/menghapus dari target.\n` +
            `[v] = sudah dipilih | [ ] = belum dipilih\n\n` +
            `Grup terpilih: ${currentTarget.length}`,
        buttons: [
            {
                buttonId: 'autojpm_target_pilih',
                buttonText: { displayText: 'Pilih Grup' },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Daftar Grup',
                        sections
                    })
                }
            }
        ],
        headerType: 4,
        viewOnce: true,
        contextInfo: {
            mentionedJid: [m.sender]
        }
    }, { quoted: m })
}

let handler = async (m, { shorekeeper, command, text, isCreator, Reply, prefix }) => {
    if (!isCreator) return Reply('Fitur ini khusus untuk Owner Bot!')

    startJPMScheduler(shorekeeper)

    const cmd = String(command || '').toLowerCase()
    const pfx = prefix || '.'
    const args = text ? text.trim().split(/\s+/).filter(Boolean) : []

    // ================= ADDJPM =================
    if (cmd === 'addjpm') {
        const quoted = m.quoted ? m.quoted : null
        const quotedMime = quoted ? (quoted.msg || quoted).mimetype || '' : ''
        const isQuotedImage = quoted && /image/.test(quotedMime)

        const pesan = text ? text.trim() : ''
        if (!pesan) {
            return shorekeeper.sendMessage(m.chat, {
                text: `TAMBAH PESAN AUTO JPM\n\n` +
                    `Format:\n${pfx}addjpm <pesan>\n\n` +
                    `Contoh:\n${pfx}addjpm Promo hari ini jangan sampai kelewatan!\n\n` +
                    `Bisa juga reply foto sambil ketik perintah di atas untuk mengirim foto + caption.\n` +
                    `Interval pengiriman diatur lewat: ${pfx}autojpm interval <durasi>\nContoh: ${pfx}autojpm interval 1jam`
            }, { quoted: m })
        }

        let media = null
        if (isQuotedImage) {
            try {
                const buffer = await quoted.download()
                if (buffer) {
                    media = { data: buffer.toString('base64'), mimetype: quotedMime }
                }
            } catch (e) {
                return Reply('Gagal mengambil foto yang direply. Coba lagi.')
            }
        }

        const job = addJob(pesan, m.sender, media)

        if (!loadJPM().enabled) setEnabled(true)
        setRunning(true)

        const dbNow = loadJPM()

        return shorekeeper.sendMessage(m.chat, {
            text: `PESAN AUTO JPM DITAMBAHKAN\n\n` +
                `ID: ${job.id}\n` +
                `Pesan: ${pesan}\n` +
                `Foto: ${media ? 'Ya' : 'Tidak'}\n` +
                `Interval: setiap ${dbNow.intervalLabel}\n` +
                `Target: ${targetLabel(dbNow.target)}\n\n` +
                `Pesan ini otomatis dikirim ke grup setiap ${dbNow.intervalLabel}.\n` +
                `Ubah interval dengan: ${pfx}autojpm interval <durasi>\n` +
                `Atur target grup dengan: ${pfx}autojpm target`
        }, { quoted: m })
    }

    // ================= LISTJPM =================
    if (cmd === 'listjpm') {
        const db = loadJPM()
        if (!db.jobs || db.jobs.length === 0) {
            return Reply(`Belum ada jadwal Auto JPM.\n\nTambahkan dengan:\n${pfx}addjpm <pesan>`)
        }

        let teks = `DAFTAR AUTO JPM\n\n`
        teks += `Status: ${statusLabel(db)}\n`
        teks += `Interval: setiap ${db.intervalLabel}\n`
        teks += `Target: ${targetLabel(db.target)}\n`
        teks += `Total Pesan: ${db.jobs.length}\n\n`

        db.jobs.forEach((job, i) => {
            const sisa = job.nextRun - Date.now()
            const preview = job.text.length > 60 ? job.text.slice(0, 60) + '...' : job.text
            teks += `${i + 1}. ID: ${job.id}\n`
            teks += `   ${job.image ? '[foto]' : '[teks]'} ${preview}\n`
            teks += `   Berikutnya: ${sisa > 0 ? humanizeMs(sisa) + ' lagi' : 'segera'}\n\n`
        })

        teks += `Perintah:\n`
        teks += `${pfx}runjpm <id> - jalankan sekarang\n`
        teks += `${pfx}deljpm <id> - hapus pesan\n`
        teks += `${pfx}runjpm all - jalankan semua pesan sekarang\n`
        teks += `${pfx}autojpm interval <durasi> - ubah interval`

        const runRows = [{ title: 'Jalankan Semua Sekarang', id: `${pfx}runjpm all` }]
        db.jobs.forEach((job) => {
            runRows.push({ title: `Jalankan #${job.id.slice(-4)}`, id: `${pfx}runjpm ${job.id}` })
        })

        const delRows = db.jobs.map((job) => ({
            title: `Hapus #${job.id.slice(-4)}`,
            id: `${pfx}deljpm ${job.id}`
        }))

        return shorekeeper.sendMessage(m.chat, {
            image: { url: global.image && global.image.menu },
            caption: teks,
            buttons: [
                {
                    buttonId: 'listjpm_pilih',
                    buttonText: { displayText: 'Pilih Aksi' },
                    type: 4,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: 'Kelola Pesan Auto JPM',
                            sections: [
                                { title: 'Jalankan', rows: runRows },
                                { title: 'Hapus', rows: delRows }
                            ]
                        })
                    }
                }
            ],
            headerType: 4,
            viewOnce: true,
            contextInfo: {
                mentionedJid: [m.sender]
            }
        }, { quoted: m })
    }

    // ================= DELJPM =================
    if (cmd === 'deljpm') {
        if (!args[0]) {
            return Reply(`Masukkan ID jadwal!\n\nContoh: ${pfx}deljpm <id>\nAtau: ${pfx}deljpm all (hapus semua)\n\nLihat daftar: ${pfx}listjpm`)
        }

        if (args[0].toLowerCase() === 'all') {
            deleteAllJobs()
            return Reply('Semua jadwal Auto JPM berhasil dihapus.')
        }

        const ok = deleteJob(args[0])
        if (!ok) return Reply(`Jadwal dengan ID ${args[0]} tidak ditemukan.\n\nLihat daftar: ${pfx}listjpm`)
        return Reply(`Jadwal ${args[0]} berhasil dihapus.`)
    }

    // ================= RUNJPM =================
    if (cmd === 'runjpm') {
        if (!args[0]) return Reply(`Masukkan ID jadwal atau ketik all.\n\nContoh: ${pfx}runjpm all`)

        const db = loadJPM()
        if (!db.jobs || db.jobs.length === 0) return Reply('Belum ada jadwal Auto JPM.')

        await shorekeeper.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

        if (args[0].toLowerCase() === 'all') {
            let totalSukses = 0
            let totalGagal = 0
            let totalGrup = 0

            for (const job of db.jobs) {
                const result = await sendJPMJob(shorekeeper, job, db.target)
                totalSukses += result.sukses
                totalGagal += result.gagal
                totalGrup = result.total
            }

            await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
            return Reply(`Semua jadwal (${db.jobs.length}) telah dijalankan ke ${totalGrup} grup.\nSukses: ${totalSukses} | Gagal: ${totalGagal}`)
        }

        const job = getJob(args[0])
        if (!job) {
            await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
            return Reply(`Jadwal dengan ID ${args[0]} tidak ditemukan.`)
        }

        const result = await sendJPMJob(shorekeeper, job, db.target)
        await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        return Reply(`Jadwal ${job.id} telah dijalankan.\nGrup terkirim: ${result.sukses}/${result.total}${result.gagal ? ` (gagal: ${result.gagal})` : ''}`)
    }

    // ================= AUTOJPM =================
    if (cmd === 'autojpm') {
        const sub = (args[0] || '').toLowerCase()
        const db = loadJPM()

        if (!sub) {
            const teksMenu = `AUTO JPM (Jadwal Pesan Massal)\n\n` +
                `Fitur ini mengirim pesan (bisa + foto) otomatis ke grup secara berkala tanpa tag member.\n\n` +
                `Status: ${statusLabel(db)}\n` +
                `Interval: setiap ${db.intervalLabel}\n` +
                `Target: ${targetLabel(db.target)}\n` +
                `Pesan tersimpan: ${db.jobs.length}\n\n` +
                `Atau gunakan perintah:\n` +
                `${pfx}addjpm <pesan>\n${pfx}autojpm interval <durasi>\n${pfx}listjpm\n${pfx}deljpm <id>`

            return shorekeeper.sendMessage(m.chat, {
                image: { url: global.image && global.image.menu },
                caption: teksMenu,
                buttons: [
                    {
                        buttonId: 'autojpm_menu_pilih',
                        buttonText: { displayText: 'Pilih Aksi' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Menu Auto JPM',
                                sections: [
                                    {
                                        title: 'Kontrol',
                                        rows: [
                                            { title: 'Aktifkan', id: `${pfx}autojpm on` },
                                            { title: 'Matikan', id: `${pfx}autojpm off` },
                                            { title: 'Lanjutkan (Start)', id: `${pfx}autojpm start` },
                                            { title: 'Jeda (Stop)', id: `${pfx}autojpm stop` }
                                        ]
                                    },
                                    {
                                        title: 'Pengaturan',
                                        rows: [
                                            { title: 'Atur Target Grup', id: `${pfx}autojpm target` },
                                            { title: 'Lihat Pesan', id: `${pfx}listjpm` }
                                        ]
                                    }
                                ]
                            })
                        }
                    }
                ],
                headerType: 4,
                viewOnce: true,
                contextInfo: {
                    mentionedJid: [m.sender]
                }
            }, { quoted: m })
        }

        if (sub === 'on') {
            setEnabled(true)
            const teksOn = `AUTO JPM DIAKTIFKAN\n\n` +
                `Sekarang silahkan atur target pengiriman & interval, lalu tambahkan pesan dengan:\n` +
                `${pfx}addjpm <pesan>\n\n` +
                `Contoh:\n${pfx}addjpm Promo hari ini jangan sampai kelewatan!\n\n` +
                `Interval saat ini: setiap ${db.intervalLabel}\nUbah dengan: ${pfx}autojpm interval <durasi>`

            return shorekeeper.sendMessage(m.chat, {
                image: { url: global.image && global.image.menu },
                caption: teksOn,
                buttons: [
                    {
                        buttonId: 'autojpm_on_pilih',
                        buttonText: { displayText: 'Pilih Target' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Target Pengiriman',
                                sections: [
                                    {
                                        title: 'Target',
                                        rows: [
                                            { title: 'Jalankan ke Semua Grup', id: `${pfx}autojpm target all` },
                                            { title: 'Pilih Grup', id: `${pfx}autojpm target pilih` }
                                        ]
                                    }
                                ]
                            })
                        }
                    }
                ],
                headerType: 4,
                viewOnce: true,
                contextInfo: {
                    mentionedJid: [m.sender]
                }
            }, { quoted: m })
        }

        if (sub === 'off') {
            setEnabled(false)
            return Reply('Auto JPM dinonaktifkan. Semua pesan berhenti terkirim (data tetap tersimpan).')
        }

        if (sub === 'start') {
            if (!db.enabled) return Reply(`Auto JPM belum aktif!\n\nAktifkan dulu dengan: ${pfx}autojpm on`)
            if (!db.jobs || db.jobs.length === 0) return Reply(`Belum ada pesan!\n\nTambahkan dengan: ${pfx}addjpm <pesan>`)
            setRunning(true)
            return Reply('Auto JPM dilanjutkan. Pesan akan berjalan kembali secara otomatis.')
        }

        if (sub === 'stop') {
            setRunning(false)
            return Reply(`Auto JPM dijeda. Pengiriman pesan berhenti sementara.\n\nGunakan ${pfx}autojpm start untuk melanjutkan.`)
        }

        if (sub === 'status') {
            return Reply(
                `STATUS AUTO JPM\n\n` +
                `Aktif: ${db.enabled ? 'Ya' : 'Tidak'}\n` +
                `Berjalan: ${db.running ? 'Ya' : 'Tidak (dijeda)'}\n` +
                `Interval: setiap ${db.intervalLabel}\n` +
                `Target: ${targetLabel(db.target)}\n` +
                `Total Pesan: ${db.jobs.length}`
            )
        }

        if (sub === 'interval') {
            const intervalArgs = args.slice(1)
            if (intervalArgs.length === 0) {
                return Reply(
                    `INTERVAL AUTO JPM\n\n` +
                    `Interval saat ini: setiap ${db.intervalLabel}\n\n` +
                    `Ubah dengan:\n${pfx}autojpm interval <durasi>\n\n` +
                    `Satuan durasi: detik/menit/jam/hari (bisa disingkat s/m/j/h)\n` +
                    `Contoh: ${pfx}autojpm interval 1jam`
                )
            }

            const durasi = parseDurationToken(intervalArgs)
            if (!durasi) {
                return Reply(`Format durasi tidak valid!\n\nContoh: ${pfx}autojpm interval 1jam\nSatuan: detik/menit/jam/hari (bisa disingkat s/m/j/h)`)
            }

            setJPMInterval(durasi.ms, durasi.label)
            return Reply(`Interval Auto JPM diubah menjadi setiap ${durasi.label}.\n\nBerlaku untuk semua pesan yang sudah/akan ditambahkan.`)
        }

        if (sub === 'target') {
            const targetSub = (args[1] || '').toLowerCase()

            if (!targetSub) return sendTargetPicker(shorekeeper, m, pfx)

            if (targetSub === 'all' || targetSub === 'reset') {
                setTarget('all')
                return Reply('Target Auto JPM diatur ke Semua Grup.')
            }

            if (targetSub === 'pilih') {
                return sendTargetPicker(shorekeeper, m, pfx)
            }

            if (targetSub === 'add' && args[2]) {
                addTargetGroup(args[2])
                return sendTargetPicker(shorekeeper, m, pfx)
            }

            if (targetSub === 'del' && args[2]) {
                delTargetGroup(args[2])
                return sendTargetPicker(shorekeeper, m, pfx)
            }

            if (targetSub === 'done') {
                const dbDone = loadJPM()
                const total = Array.isArray(dbDone.target) ? dbDone.target.length : 0
                return Reply(`Target tersimpan: ${total} grup dipilih.\n\nSekarang tambahkan pesan dengan:\n${pfx}addjpm <pesan>`)
            }

            return Reply(`Sub perintah target tidak dikenal.\n\nKetik ${pfx}autojpm target untuk memilih grup.`)
        }

        return Reply(`Sub perintah tidak dikenal.\n\nKetik ${pfx}autojpm untuk melihat menu Auto JPM.`)
    }
}

handler.command = ['autojpm', 'addjpm', 'listjpm', 'deljpm', 'runjpm']
handler.owner = true

module.exports = handler
