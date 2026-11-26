/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const { loadJPM, touchJobRun } = require('./jpm')

let intervalStarted = false

async function resolveTargetGroups(shorekeeper, target) {
    let allGroups
    try {
        allGroups = await shorekeeper.groupFetchAllParticipating()
    } catch (e) {
        return []
    }
    const groupIds = Object.keys(allGroups || {})
    if (!Array.isArray(target) || target.length === 0) {
        if (target === 'all' || !Array.isArray(target)) return groupIds
    }
    return groupIds.filter(id => target.includes(id))
}

async function sendJPMJob(shorekeeper, job, target) {
    const groupIds = await resolveTargetGroups(shorekeeper, target)
    let sukses = 0
    let gagal = 0

    for (const groupId of groupIds) {
        try {
            if (job.image) {
                await shorekeeper.sendMessage(groupId, {
                    image: Buffer.from(job.image, 'base64'),
                    mimetype: job.mimetype || 'image/jpeg',
                    caption: job.text
                })
            } else {
                await shorekeeper.sendMessage(groupId, { text: job.text })
            }
            sukses++
        } catch (e) {
            gagal++
        }
    }

    return { sukses, gagal, total: groupIds.length }
}

function startJPMScheduler(shorekeeper) {
    if (intervalStarted) return
    intervalStarted = true

    setInterval(async () => {
        try {
            const db = loadJPM()
            if (!db.enabled || !db.running) return
            if (!Array.isArray(db.jobs) || db.jobs.length === 0) return

            const now = Date.now()
            for (const job of db.jobs) {
                if (now >= job.nextRun) {
                    const nextRun = now + (db.interval || 60 * 60 * 1000)
                    touchJobRun(job.id, nextRun)
                    sendJPMJob(shorekeeper, job, db.target).catch(() => {})
                }
            }
        } catch (e) {
            console.log('[AUTO JPM] Scheduler error:', e.message)
        }
    }, 20 * 1000)
}

module.exports = { startJPMScheduler, sendJPMJob, resolveTargetGroups }
