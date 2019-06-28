const Game = require('../structures/Game');

module.exports = async ctx => {
	const data = await ctx.client.collections.games.findOne({ channel_id: ctx.msg.channel_id });
	if (!data) {
		return ctx.reply('There is no game running in this channel.');
	}

	const game = new Game(ctx.client, data);
	await game.stop();
	return ctx.reply('Stopped the game. gg :)');
};
