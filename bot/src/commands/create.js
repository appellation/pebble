const { Status } = require('../constants/Game');
const Timer = require('../constants/Timer');
const join = require('./join');

module.exports = async ctx => {
	const ongoing = await ctx.client.collections.games.findOne({
		$or: [
			{ players: { id: ctx.msg.author.id } },
			{ channel_id: ctx.msg.channel_id },
		],
	});
	if (ongoing) {
		if (ongoing.channel_id === ctx.msg.channel_id) return join(ctx);
		return ctx.reply(`You are already playing a game in <#${ongoing.channel_id}>!`);
	}

	const res = await ctx.client.collections.games.insertOne({
		status: Status.STARTING,
		channel_id: ctx.msg.channel_id,
		players: [{ id: ctx.msg.author.id }],
		creator: ctx.msg.author.id,
		category: ctx.args[0],
		round: 0,
	});

	await ctx.client.timers.set(2 * 60 * 1000, {
		type: Timer.GAME_START,
		id: res.insertedId,
	});

	return ctx.reply(`Starting game in 2 minutes. Use \`${ctx.client.config.prefix}join\` to join!`);
};
