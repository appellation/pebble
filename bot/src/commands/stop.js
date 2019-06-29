const Game = require('../structures/Game');

module.exports = async ctx => {
	const data = await ctx.client.collections.games.findOne({ channel_id: ctx.msg.channel_id });
	if (!data) return ctx.reply('There is no game running in this channel.');
	if (data.creator !== ctx.msg.author.id) return ctx.reply(`Nice try, but only <@${data.creator}> can end this game.`);

	const game = new Game(ctx.client, data);
	return game.stop();
};
