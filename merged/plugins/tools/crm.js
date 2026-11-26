/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * .crm — CRMStore: dump raw message, AdditionalNodes, relay ulang, dan lastchat (owner).
 * Di grup semua output dikirim via sBPR v2 sehingga hanya owner yang bisa melihat.
 * Credit: Kureza (port ke Hitoshi) • crm & sBPR: Nixel • fitur asal: Ichigo MD
 *
 * Pakai: reply pesan lalu .crm | .insp | .adn | .relay | .crm2 | .lastchat [jumlah]
 */

let _core = null
const loadCore = async () => (_core ||= await import('../../lib/crm/crm-core.mjs'))

let handler = async (m, { shorekeeper, text, command, Reply }) => {
    try {
        const { handler: run } = await loadCore()
        return await run(m, { sock: shorekeeper, text, command: String(command || '').toLowerCase() })
    } catch (e) {
        console.error('[CRM Error]', e)
        return Reply(`❌ Error .${command}: ${e?.message || e}`)
    }
}

handler.help = ['crm']
handler.tags = ['tools']
handler.command = ['crm', 'crm2', 'insp', 'adn', 'relay', 'lastchat']
handler.owner = true

module.exports = handler
