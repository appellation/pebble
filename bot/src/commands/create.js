const { Status } = require('../constants/Game');
const Timer = require('../constants/Timer');

module.exports = async ctx => {
	const ongoing = await ctx.client.collections.games.findOne({
		$or: [
			{ players: { id: ctx.msg.author.id } },
			{ channel_id: ctx.msg.channel_id },
		],
	});
	if (ongoing) {
		return ctx.reply(`You are already playing a game in <#${ongoing.channel_id}>!`);
	}

	const res = await ctx.client.collections.games.insertOne({
		status: Status.STARTING,
		channel_id: ctx.msg.channel_id,
		players: { [ctx.msg.author.id]: { points: 0 } },
		creator: ctx.msg.author.id,
		round: 0,
	});

	await ctx.client.timers.set(2 * 60 * 1000, {
		type: Timer.GAME_START,
		id: res.insertedId,
	});

	return ctx.reply(`Starting game in 2 minutes. Use \`${ctx.client.config.prefix}join\` to join!`);
};
