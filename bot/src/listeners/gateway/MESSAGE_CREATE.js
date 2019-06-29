const Context = require('../../structures/Context');
const { Status } = require('../../constants/Game');
const Game = require('../../structures/Game');

module.exports = async (client, msg) => {
	if (msg.author.bot || !msg.content) return;

	const args = msg.content.split(/\s+/);
	const ctx = new Context(client, msg, args);

	if (msg.guild_id) {
		let cmd = args.shift();
		if (cmd.startsWith(client.config.prefix)) {
			cmd = cmd.slice(client.config.prefix.length).trim();
		} else {
			return;
		}

		cmd = client.commands.get(cmd);
		if (cmd) {
			try {
				await cmd(ctx);
			} catch (err) {
				console.error(err);

				try {
					await ctx.reply('something went horribly wrong');
				} catch {}
			}
		}

		return;
	}

	const gameData = await client.collections.games.findOne({ [`players.${msg.author.id}`]: { $exists: true } });
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
