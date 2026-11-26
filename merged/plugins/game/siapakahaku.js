/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const { startGame } = require('../../lib/game.js');

module.exports = async (m, { shorekeeper, Reply, isRegistered, isCreator }) => {
    await startGame('siapakahaku', m, shorekeeper, Reply, isRegistered, isCreator);
};

module.exports.command = ['siapakahaku'];
