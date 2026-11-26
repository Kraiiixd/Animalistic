/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const { loadJPM, setRunning } = require('../../library/jpm')
const { startJPMScheduler } = require('../../library/jpmScheduler')

let handler = async (m, { shorekeeper, isCreator, Reply, prefix }) => {
    if (!isCreator) return Reply('❌ Fitur ini khusus untuk Owner Bot!')

    startJPMScheduler(shorekeeper)

    const pfx = prefix || '.'
    const db = loadJPM()

    if (!db.enabled) return Reply(`❌ Auto JPM belum diaktifkan!\n\nAktifkan dulu dengan: ${pfx}autojpm on`)
    if (!db.jobs || db.jobs.length === 0) return Reply(`❌ Belum ada pesan!\n\nTambahkan dengan: ${pfx}addjpm <pesan>`)

    setRunning(true)
    return Reply('▶️ Auto JPM dilanjutkan. Jadwal pesan akan berjalan kembali secara otomatis.')
}

handler.command = ['startjpm']
handler.owner = true

module.exports = handler
