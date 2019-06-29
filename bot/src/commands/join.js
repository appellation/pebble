const { Status } = require('../constants/Game');

module.exports = async ctx => {
	const ongoing = await ctx.client.collections.games.findOne({
		[`players.${ctx.msg.author.id}`]: { $exists: true },
	});
	if (ongoing) {
		if (ongoing.status !== Status.STARTING) return ctx.reply(`You are already playing a game in <#${ongoing.channel_id}>`);
		return ctx.reply(
			ongoing.channel_id === ctx.msg.channel_id
				? 'You are already in the game! Please wait for it to start.'
				: `You are already playing a game in <#${ongoing.channel_id}>!`
		);
	}

	const res = await ctx.client.collections.games.updateOne({
		channel_id: ctx.msg.channel_id,
		[`players.${ctx.msg.author.id}`]: { $exists: false },
	}, {
		$set: { [`players.${ctx.msg.author.id}.points`]: 0 },
	});
	if (res.modifiedCount === 0) {
		return ctx.reply('This channel has no ongoing game.');
	}

	return ctx.reply('You have joined the game!');
};
