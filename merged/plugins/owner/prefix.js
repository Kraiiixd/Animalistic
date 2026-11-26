/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require('fs')
const path = require('path')

const prefixDBPath = './library/database/prefix.json'

function loadPrefix() {
    try {
        if (!fs.existsSync(prefixDBPath)) {
            fs.writeFileSync(prefixDBPath, JSON.stringify({}))
            return {}
        }
        return JSON.parse(fs.readFileSync(prefixDBPath))
    } catch (e) {
        return {}
    }
}

function savePrefix(data) {
    fs.writeFileSync(prefixDBPath, JSON.stringify(data, null, 2))
}

let handler = async (m, { shorekeeper, command, args, isCreator, Reply, text }) => {
    if (!isCreator) return Reply('❌ Fitur ini hanya untuk owner!')

    let prefixData = loadPrefix()
    let cmd = command.toLowerCase()

    if (cmd === 'addprefix') {
        if (!text) {
            return Reply(`📝 *TAMBAH PREFIX*\n\nPrefix default: *.* (selalu aktif)\n\nGunakan: .addprefix [simbol]\nContoh: .addprefix #\n\nPrefix bisa 1-2 karakter.`)
        }

        let newPrefix = text.trim()
        if (newPrefix.length > 2) return Reply('❌ Prefix maksimal 2 karakter!')

        if (!prefixData['custom']) prefixData['custom'] = []

        if (prefixData['custom'].includes(newPrefix)) {
            return Reply(`❌ Prefix *${newPrefix}* sudah ada!`)
        }

        if (newPrefix === '.') {
            return Reply(`❌ Prefix *.* sudah default dan tidak bisa ditambah!`)
        }

        prefixData['custom'].push(newPrefix)
        savePrefix(prefixData)

        let allPrefixes = ['.', ...prefixData['custom']].join(', ')
        return Reply(`✅ Prefix *${newPrefix}* berhasil ditambahkan!\n\nPrefix aktif: ${allPrefixes}`)
    }

    if (cmd === 'delprefix') {
        if (!text) {
            let customPrefixes = prefixData['custom'] || []
            if (customPrefixes.length === 0) {
                return Reply(`📝 *HAPUS PREFIX*\n\nTidak ada prefix tambahan.\nPrefix aktif: .`)
            }
            return Reply(`📝 *HAPUS PREFIX*\n\nPrefix tambahan: ${customPrefixes.join(', ')}\n\nGunakan: .delprefix [simbol]\nContoh: .delprefix #`)
        }

        let hapusPrefix = text.trim()
        let customPrefixes = prefixData['custom'] || []

        if (hapusPrefix === '.') {
            return Reply(`❌ Prefix *.* adalah default dan tidak bisa dihapus!`)
        }

        let index = customPrefixes.indexOf(hapusPrefix)
        if (index === -1) {
            return Reply(`❌ Prefix *${hapusPrefix}* tidak ditemukan!`)
        }

        customPrefixes.splice(index, 1)
        prefixData['custom'] = customPrefixes
        savePrefix(prefixData)

        let allPrefixes = ['.', ...customPrefixes].join(', ')
        return Reply(`✅ Prefix *${hapusPrefix}* berhasil dihapus.\n\nPrefix aktif: ${allPrefixes}`)
    }

    if (cmd === 'listprefix') {
        let customPrefixes = prefixData['custom'] || []
        let allPrefixes = ['.', ...customPrefixes].join(', ')

        let teks = `📋 *DAFTAR PREFIX*\n\n`
        teks += `🔹 Default: *.*\n`
        if (customPrefixes.length > 0) {
            teks += `🔸 Tambahan: *${customPrefixes.join(', ')}*\n`
        } else {
            teks += `🔸 Tambahan: (tidak ada)\n`
        }
        teks += `\nTotal prefix aktif: *${customPrefixes.length + 1}*\n`
        teks += `Prefix yang bisa digunakan: ${allPrefixes}`

        return Reply(teks)
    }
}

handler.command = ['addprefix', 'delprefix', 'listprefix']
module.exports = handler