const { Status } = require('../constants/Game');
const Question = require('../constants/Question');

module.exports = async (client, data) => {
	const game = await client.collections.games.findOne({ _id: data.context.id });
	if (game.players.length < 2) {
		await client.collections.games.deleteOne({ _id: game._id });

		return client.rest.channels[game.channel_id].messages.post({
			content: 'You must have at least two players to initiate a game.',
		});
	}

	await client.collections.games.update({ _id: game._id }, { status: Status.AWAITING_RESPONSES });

	const prompt = await client.collections.questions.aggregate([
		{
			$match: {
				status: Question.Status.APPROVED,
				categories: { $in: game.categories },
			},
		},
		{ $sample: { size: 1 } },
	]).limit(1).next();
	if (!prompt) {
		return client.rest.channels[game.channel_id].messages.post({
			content: 'There are no questions available.',
		});
	}

	return client.rest.channels[game.channel_id].messages.post({
		content: prompt.content,
		tts: true, // heck yeah
	});
};
