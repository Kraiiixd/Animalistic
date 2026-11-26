/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const { handleSambungKata } = require('../../lib/sambungkata.js');

module.exports = async (m, { shorekeeper, command, args }) => {
    await handleSambungKata(shorekeeper, m, command, args);
};

module.exports.command = ['sambungkata2', 'sk'];
