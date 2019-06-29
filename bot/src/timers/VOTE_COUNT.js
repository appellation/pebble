const { ObjectID } = require('mongodb');
const { Status } = require('../constants/Question');
const APIError = require('../constants/APIError');
const Colors = require('../constants/Colors');

module.exports = async (client, data) => {
	const query = client.proposalMessages[data.context.message_id];

	try {
		const msg = await query.get();
		if (!msg.reactions) return;

		const likeReaction = msg.reactions.find(r => r.emoji.name === '👍');
		const dislikeReaction = msg.reactions.find(r => r.emoji.name === '👎');
		const likes = likeReaction ? likeReaction.count - 1 : 0;
		const dislikes = dislikeReaction ? dislikeReaction.count - 1 : 0;
		const approved = likes > dislikes;
		const status = approved ? Status.APPROVED : Status.REJECTED;

		await query.patch({
			embed: {
				...msg.embeds[0],
				color: Colors[status],
				description: msg.embeds[0].fields[0].value,
				fields: [
					{
						name: '👍',
						value: likes,
						inline: true,
					},
					{
						name: '👎',
						value: dislikes,
						inline: true,
					},
				],
			},
		});

		await client.collections.questions.updateOne({ _id: new ObjectID(data.context.id) }, {
			$set: { status },
		});

		return query.reactions.delete();
	} catch (err) {
		if (err.data && err.data.code === APIError.UNKNOWN_MESSAGE) {
			return client.collections.questions.deleteOne({ _id: new ObjectID(data.context.id) });
		}

		throw err;
	}
};
