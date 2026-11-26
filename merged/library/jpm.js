/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, 'jpm.json')

function defaultData() {
    return { enabled: false, running: false, target: 'all', interval: 60 * 60 * 1000, intervalLabel: '1 jam', jobs: [] }
}

function loadJPM() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            const initial = defaultData()
            fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2))
            return initial
        }
        const raw = fs.readFileSync(DB_PATH)
        const data = JSON.parse(raw)
        if (!Array.isArray(data.jobs)) data.jobs = []
        if (typeof data.enabled !== 'boolean') data.enabled = false
        if (typeof data.running !== 'boolean') data.running = false
        if (!data.target) data.target = 'all'
        if (typeof data.interval !== 'number' || data.interval <= 0) data.interval = 60 * 60 * 1000
        if (!data.intervalLabel) data.intervalLabel = '1 jam'
        return data
    } catch (e) {
        return defaultData()
    }
}

function saveJPM(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
    return data
}

function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function addJob(text, createdBy, media) {
    const db = loadJPM()
    const job = {
        id: genId(),
        text,
        createdAt: Date.now(),
        createdBy: createdBy || null,
        lastRun: null,
        nextRun: Date.now() + db.interval,
        image: media && media.data ? media.data : null,
        mimetype: media && media.mimetype ? media.mimetype : null
    }
    db.jobs.push(job)
    if (!db.target) db.target = 'all'
    saveJPM(db)
    return job
}

function getJob(id) {
    const db = loadJPM()
    return db.jobs.find(j => j.id === id)
}

function deleteJob(id) {
    const db = loadJPM()
    const before = db.jobs.length
    db.jobs = db.jobs.filter(j => j.id !== id)
    saveJPM(db)
    return db.jobs.length < before
}

function deleteAllJobs() {
    const db = loadJPM()
    db.jobs = []
    saveJPM(db)
    return db
}

function setEnabled(value) {
    const db = loadJPM()
    db.enabled = !!value
    if (!db.enabled) db.running = false
    saveJPM(db)
    return db
}

function setRunning(value) {
    const db = loadJPM()
    db.running = !!value
    saveJPM(db)
    return db
}

function setTarget(target) {
    const db = loadJPM()
    db.target = target
    saveJPM(db)
    return db
}

function setJPMInterval(ms, label) {
    const db = loadJPM()
    db.interval = ms
    db.intervalLabel = label
    db.jobs.forEach(job => {
        job.nextRun = (job.lastRun || Date.now()) + ms
    })
    saveJPM(db)
    return db
}

function addTargetGroup(groupId) {
    const db = loadJPM()
    if (!Array.isArray(db.target)) db.target = []
    if (!db.target.includes(groupId)) db.target.push(groupId)
    saveJPM(db)
    return db
}

function delTargetGroup(groupId) {
    const db = loadJPM()
    if (Array.isArray(db.target)) {
        db.target = db.target.filter(g => g !== groupId)
    }
    saveJPM(db)
    return db
}

function touchJobRun(id, nextRun) {
    const db = loadJPM()
    const job = db.jobs.find(j => j.id === id)
    if (job) {
        job.lastRun = Date.now()
        job.nextRun = nextRun
    }
    saveJPM(db)
    return db
}

module.exports = {
    loadJPM,
    saveJPM,
    genId,
    addJob,
    getJob,
    deleteJob,
    deleteAllJobs,
    setEnabled,
    setRunning,
    setTarget,
    setJPMInterval,
    addTargetGroup,
    delTargetGroup,
    touchJobRun
}
