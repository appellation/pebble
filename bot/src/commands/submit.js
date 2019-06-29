const { Status } = require('../constants/Question');
const Timer = require('../constants/Timer');
const Colors = require('../constants/Colors');

module.exports = async ctx => {
	const args = ctx.args.join(' ').split('|');
	const res = await ctx.client.collections.questions.insertOne({
		q: args[0].trim(),
		a: (args[1] || '').trim(),
		status: Status.UNAPPROVED,
		creator_id: ctx.msg.author.id,
	});

	const proposalMessage = await ctx.client.proposalMessages.post({
		embed: {
			author: {
				name: `${ctx.msg.author.username}#${ctx.msg.author.discriminator} (${ctx.msg.author.id})`,
				icon_url: `https://cdn.discordapp.com/avatars/${ctx.msg.author.id}/${ctx.msg.author.avatar}.${ctx.msg.author.avatar.startsWith('a_') ? 'gif' : 'png'}`,
			},
			color: Colors[Status.UNAPPROVED],
			fields: [
				{
					name: 'Question',
					value: args[0].slice(0, 1024),
				},
				{
					name: 'Answer',
					value: (args[1] || 'None').slice(0, 1024),
				},
			],
			timestamp: new Date().toISOString(),
		},
	});

	await Promise.all([
		ctx.client.proposalMessages[proposalMessage.id].reactions[encodeURIComponent('👍')]['@me'].put(),
		ctx.client.proposalMessages[proposalMessage.id].reactions[encodeURIComponent('👎')]['@me'].put(),
	]);

	await ctx.client.timers.set(24 * 60 * 60 * 1000, {
		type: Timer.VOTE_COUNT,
		id: res.insertedId,
		message_id: proposalMessage.id,
	});

	return ctx.reply(`See your proposal and others' at ${ctx.client.config.guild_invite_url}`);
};
