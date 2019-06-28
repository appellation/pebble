const Game = require('../structures/Game');

module.exports = async (client, data) => {
	const game = await new Game(client, data.context.id);
	if (!game.data || data.context.round < game.data.round) return;

	return game.start();
};
