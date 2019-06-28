const { Status } = require('../constants/Game');

module.exports = async ctx => {
	const ongoing = await ctx.client.collections.games.findOne({
		players: { id: ctx.msg.author.id },
	});
	if (ongoing) {
		if (ongoing.status !== Status.STARTING) return ctx.reply(`You are already playing a game in <#${ongoing.channel_id}>`);
		return ctx.reply(
			ongoing.channel_id === ctx.msg.channel_id
				? 'You are already in the game! Please wait for it to start.'
				: `You are already playing a game in <#${ongoing.channel_id}>!`
		);
	}

	await ctx.client.collections.games.updateOne({
		channel_id: ctx.msg.channel_id,
	}, {
		$addToSet: {
			players: { id: ctx.msg.author.id },
		},
	});

	return ctx.reply('You have joined the game!');
};
