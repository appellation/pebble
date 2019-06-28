const Game = require('../structures/Game');

module.exports = async (client, data) => {
	const game = await new Game(client, data.context.id);
	return game.start();
};
