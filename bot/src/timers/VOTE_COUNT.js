const { Status } = require('../constants/Question');
const APIError = require('../constants/APIError');
const Colors = require('../constants/Colors');

module.exports = async (client, data) => {
	const query = client.proposalMessages[data.message_id];

	try {
		const msg = await query.get();
		const likes = msg.reactions.find(r => r.emoji.name === '👍').count;
		const dislikes = msg.reactions.find(r => r.emoji.name === '👎').count;
		const approved = likes > dislikes;
		const status = approved ? Status.APPROVED : Status.REJECTED;

		await query.patch({
			content: msg.content,
			embed: {
				...msg.embed,
				color: Colors[status],
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

		await client.collections.questions.updateOne({ _id: data.id }, {
			$set: { status },
		});

		return query.reactions.delete();
	} catch (err) {
		if (err.data && err.data.code === APIError.UNKNOWN_MESSAGE) {
			return client.collections.questions.deleteOne({ _id: data.id });
		}

		throw err;
	}
};
