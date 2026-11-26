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

    if (!db.jobs || db.jobs.length === 0) return Reply('❌ Belum ada jadwal Auto JPM yang berjalan.')

    setRunning(false)
    return Reply(`⏸️ Auto JPM dijeda. Jadwal pesan berhenti sementara.\n\nGunakan *${pfx}startjpm* atau *${pfx}autojpm start* untuk melanjutkan.`)
}

handler.command = ['stopjpm']
handler.owner = true

module.exports = handler
