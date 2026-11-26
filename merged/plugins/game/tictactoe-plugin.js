/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const tictactoe = require('../../lib/tictactoe.js');

module.exports = async (m, { shorekeeper, Reply, command, isCreator, isRegistered, isPrem, checkLimit, addLimit, args, text }) => {
    switch (command) {
        case 'tictactoe':
        case 'ttt':
        case 'tttplay': {
            const result = await tictactoe.handleNewGame(m, args, Reply, shorekeeper, isCreator, checkLimit, addLimit, isRegistered, isPrem, global.mess);
            if (result) Reply(result);
            break;
        }

        case 'tttmove': {
            const result = await tictactoe.handleMove(m, text, Reply, shorekeeper);
            if (result) Reply(result);
            break;
        }

        case 'tttresign':
        case 'tttsurrender': {
            const result = await tictactoe.handleResign(m, Reply);
            if (result) Reply(result);
            break;
        }

        case 'tttboard':
        case 'tttstatus': {
            const result = await tictactoe.handleBoard(m, Reply);
            if (result) Reply(result);
            break;
        }

        case 'tttclean':
        case 'tttcleanup': {
            if (!isCreator) return Reply('Command owner only');
            const result = await tictactoe.handleCleanup(Reply);
            if (result) Reply(result);
            break;
        }
    }
};

module.exports.command = [
    'tictactoe', 'ttt', 'tttplay', 'tttmove', 'tttresign', 'tttsurrender',
    'tttboard', 'tttstatus', 'tttclean', 'tttcleanup'
];

module.exports.before = async (m, { shorekeeper, Reply, isCmd }) => {

};
