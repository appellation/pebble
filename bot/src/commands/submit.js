const { Categories, Status, Type } = require('../constants/Question');
const Timer = require('../constants/Timer');
const Colors = require('../constants/Colors');

module.exports = async ctx => {
	const categories = ctx.args.shift().toLowerCase().split(',');
	if (!categories.every(Categories.has)) {
		return ctx.reply({
			content: `Invalid: ${categories.filter(Categories.has).join(', ')}`,
		});
	}

	const res = await ctx.client.collections.questions.insertOne({
		status: Status.UNAPPROVED,
		creator_id: ctx.msg.author.id,
		content: ctx.args.join(' '),
		categories,
		type: Type.TEXT,
		submitted_at: new Date(),
	});

	const proposalMessage = await ctx.client.proposalMessages.post({
		embed: {
			author: {
				name: `${ctx.msg.author.username}#${ctx.msg.author.discriminator}`,
				icon_url: `https://cdn.discordapp.com/avatars/${ctx.msg.author.id}/${ctx.msg.author.avatar}.${ctx.msg.author.avatar.startsWith('a_') ? 'gif' : 'png'}`,
			},
			color: Colors[Status.UNAPPROVED],
			description: ctx.args.join(' '),
			footer: {
				text: `Categor${categories.length === 1 ? 'y' : 'ies'}: ${categories.join(', ')}`,
			},
			timestamp: new Date().toDateString(),
		},
	});

	await Promise.all([
		ctx.client.proposalMessages[proposalMessage.id].reactions['👍']['@me'].put(),
		ctx.client.proposalMessages[proposalMessage.id].reactions['👎']['@me'].put(),
	]);

	await ctx.client.brokers.timers.publish('START', {
		expiration: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(),
		context: {
			type: Timer.VOTE_COUNT,
			id: res.insertedId,
			message_id: proposalMessage.id,
		},
	});
};
