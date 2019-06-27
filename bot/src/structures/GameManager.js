const Game = require('./Game');

class GameManager {
	constructor(client, data) {
		this.client = client;
		this.data = data;
		this.game = new Game(client.collections.games, client.timers, data._id);
	}

	get channelMention() {
		return `<#${this.data.channel_id}>`;
	}

	get channel() {
		return this.client.rest.channels[this.data.channel_id];
	}

	async start() {
		if (this.data.players.length < 2) {
			await this.client.collections.games.deleteOne(this.id);

			return this.send({
				content: 'You must have at least two players to initiate a game.',
			});
		}

		await this.game.start();
		return this.postQuestion();
	}

	async postQuestion() {
		const question = await this.client.questions.random();
		let author = null;
		try {
			author = await this.client.rest.users[question.creator_id].get();
		} catch {}

		const embed = { description: question.content };
		if (author) {
			embed.footer = `${author.username}#${author.discriminator}`;
		}

		await this.send({
			content: 'Make sure to DM your answers to me if you want to keep them private!',
			embed,
		});
	}

	async startVoting() {
		await this.game.startVoting();
		await this.postQuestion();
	}

	async handleAnswer(ctx) {
		const added = await this.game.addAnswer(ctx.author.id, ctx.content);
		if (added.modifiedCount) {
			return ctx.reply(`Updated your answer! Back to the game: ${this.channelMention}`);
		}

		const game = await this.game.fetch();
		if (Object.keys(game.answers).length >= game.players.length) {
			await this.startVoting();
		}

		return ctx.reply(`Nice! Back to the game: ${this.channelMention}`);
	}

	async handleVote(ctx) {
		const answers = await this.game.getAnswers();
		const index = parseInt(ctx.content, 10);
		if (isNaN(index) || index > answers.length) {
			return ctx.reply('Please give a valid answer number to vote for!');
		}

		const added = await this.game.addVote(ctx.author.id, index);
		if (added.modifiedCount) {
			return ctx.reply(`Updated your vote! Back to the game: ${this.channelMention}`);
		}

		return ctx.reply(`I'm sure you picked a winner! Back to the game: ${this.channelMention}`);
	}

	async stop() {
		// TODO: end game.
		await this.game.stop();
		return this.send({ content: `Game ended! 😦 Type \`${this.client.config.prefix}start\` to start a new one.` });
	}

	newRound() {}

	endRound() {}

	send(data) {
		return this.channel.messages.post(data);
	}
}

module.exports = GameManager;
