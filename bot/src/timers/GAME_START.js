const { Status } = require('../constants/Game');
const Game = require('../structures/Game');
const GameManager = require('../structures/GameManager');

module.exports = async (client, data) => {
	const game = new Game(data.context.id).fetch();
	if (!game || game.status !== Status.STARTING) return;

	const manager = new GameManager(client, game);
	return manager.start();
};
