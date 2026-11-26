/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const UNIT_MS = {
    detik: 1000, dtk: 1000, second: 1000, sec: 1000, s: 1000,
    menit: 60 * 1000, mnt: 60 * 1000, minute: 60 * 1000, min: 60 * 1000, mn: 60 * 1000, m: 60 * 1000,
    jam: 60 * 60 * 1000, jm: 60 * 60 * 1000, hour: 60 * 60 * 1000, hr: 60 * 60 * 1000, h: 60 * 60 * 1000, j: 60 * 60 * 1000,
    hari: 24 * 60 * 60 * 1000, day: 24 * 60 * 60 * 1000, d: 24 * 60 * 60 * 1000
}

function parseDurationToken(args) {
    if (!args || args.length === 0) return null
    const first = args[0]

    const combined = first.match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)$/)
    if (combined) {
        const num = parseFloat(combined[1])
        const unitRaw = combined[2].toLowerCase()
        const unitMs = UNIT_MS[unitRaw]
        if (unitMs && num > 0) {
            return { ms: Math.round(num * unitMs), label: `${num} ${unitRaw}`, consumed: 1 }
        }
    }

    const onlyNum = first.match(/^(\d+(?:\.\d+)?)$/)
    if (onlyNum && args.length >= 2) {
        const num = parseFloat(onlyNum[1])
        const unitRaw = args[1].toLowerCase()
        const unitMs = UNIT_MS[unitRaw]
        if (unitMs && num > 0) {
            return { ms: Math.round(num * unitMs), label: `${num} ${unitRaw}`, consumed: 2 }
        }
    }

    return null
}

function humanizeMs(ms) {
    if (ms <= 0) return '0 detik'
    if (ms < 60 * 1000) return `${Math.round(ms / 1000)} detik`
    if (ms < 60 * 60 * 1000) return `${Math.round(ms / (60 * 1000))} menit`
    if (ms < 24 * 60 * 60 * 1000) return `${(ms / (60 * 60 * 1000)).toFixed(1)} jam`
    return `${(ms / (24 * 60 * 60 * 1000)).toFixed(1)} hari`
}

module.exports = { parseDurationToken, humanizeMs }
