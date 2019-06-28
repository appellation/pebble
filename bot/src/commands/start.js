const Game = require('../structures/Game');

module.exports = async ctx => {
	const ongoing = await ctx.client.collections.games.findOne({ channel_id: ctx.msg.channel_id });
	if (!ongoing) return ctx.reply('You must create a game first!');
	if (ongoing.creator !== ctx.msg.author.id) return ctx.reply(`Only the game creator can start early! Get <@${ongoing.creator}> to run this command.`);

	const game = await new Game(ctx.client, ongoing);
	return game.start();
};
