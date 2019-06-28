const Context = require('../../structures/Context');
const { Status } = require('../../constants/Game');
const Game = require('../../structures/Game');

module.exports = async (client, msg) => {
	if (msg.author.bot) return;

	let { content } = msg;
	if (content.startsWith(client.config.prefix)) {
		content = content.slice(client.config.prefix.length).trim();
	}

	const args = content.split(/\s+/);
	const cmd = client.commands.get(args.shift());
	const ctx = new Context(client, msg, args);
	if (cmd) {
		try {
			await cmd(ctx);
		} catch (err) {
			console.error(err);

			try {
				await ctx.reply('something went horribly wrong');
			} catch {}
		}

		return;
	}

	if (msg.guild_id) return;

	const gameData = await client.collections.games.findOne({ players: { id: msg.author.id } });
	if (!gameData) return;

	const game = new Game(client, gameData);
	switch (game.data.status) {
		case Status.STARTING:
			return;

		case Status.AWAITING_RESPONSES:
			await game.handleAnswer(ctx);
			break;

		case Status.AWAITING_VOTES:
			await game.handleVote(ctx);
			break;
	}
};
