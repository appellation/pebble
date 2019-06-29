const Game = require('../structures/Game');
const { Status } = require('../constants/Game');

module.exports = async (client, data) => {
	const game = await new Game(client, data.context.id);
	if (!game.data || game.data.status !== Status.AWAITING_VOTES || data.context.round < game.data.round) return;

	return game.endRound();
};
