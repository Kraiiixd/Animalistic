/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Ping / Server Monitor (kartu HTML rich response)
 */

const os = require('os')
const axios = require('axios')
const crypto = require('crypto')

const FTM = 'aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL25veFh6YS9kYXRhL3JlZnMvaGVhZHMvbWFpbi9waW5nLmh0bWw='

let handler = async (m, { shorekeeper, Reply }) => {
    try {
        const url = Buffer.from(FTM, 'base64').toString('utf-8')
        const { data: sync } = await axios.get(url, { timeout: 15000 })

        const latency = Date.now() - (Number(m.messageTimestamp) * 1000)
        const heapUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
        const rssMem = (process.memoryUsage().rss / 1024 / 1024).toFixed(2)

        const html = String(sync)
            .replace(/%LATENCY%/g, latency)
            .replace(/%PLATFORM%/g, os.platform())
            .replace(/%OS_INFO%/g, `${os.platform()} ${os.release()}`)
            .replace(/%ARCH_INFO%/g, os.arch())
            .replace(/%CPU_CORES%/g, os.cpus().length || 1)
            .replace(/%HEAP_USED%/g, heapUsed)
            .replace(/%RSS_MEM%/g, rssMem)
            .replace(/%NODE_INFO%/g, `Node ${process.version}`)
            .replace(/%BOTUPTIME%/g, process.uptime())
            .replace(/%SYSTEMUPTIME%/g, os.uptime())

        const responseId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
        const responseData = {
            response_id: responseId,
            sections: [{
                view_model: {
                    primitive: {
                        __typename: 'GenAIaeacdsnwHtmlPrimitive',
                        payload: html,
                        trusted_sources: []
                    },
                    __typename: 'GenAISingleLayoutViewModel'
                }
            }]
        }

        const dataBase64 = Buffer.from(JSON.stringify(responseData)).toString('base64')

        await shorekeeper.relayMessage(m.chat, {
            messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
                botMetadata: { messageDisclaimerText: '', botResponseId: responseId }
            },
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: [{ messageType: 2, messageText: 'Server Monitor' }],
                        unifiedResponse: { data: dataBase64 },
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' },
                            forwardOrigin: 4
                        }
                    }
                }
            }
        }, { messageId: responseId })
    } catch (e) {
        await Reply(`\`⌜ Ping Error ⌟\`\n> ◦ Status : *Gagal*\n> ◦ Info : *${e.message}*`)
    }
}

handler.command = ['ping', 'pinglive', 'serverinfo', 'monitor']

module.exports = handler
