const { ObjectID } = require('mongodb');
const { Status } = require('../constants/Game');
const Timer = require('../constants/Timer');

class Game {
	static get ANSWER_TIME() {
		return 30 * 1000;
	}

	constructor(client, id) {
		this.client = client;
		if (typeof id === 'object') {
			this.id = new ObjectID(id._id);
			this.data = id;
		} else {
			this.id = new ObjectID(id);
		}
	}

	then(res, rej) {
		return this.collection.findOne(this.id).then(data => {
			this.data = data;
			res(this);
		}, rej);
	}

	get collection() {
		return this.client.collections.games;
	}

	get channel() {
		return this.client.rest.channels[this.data.channel_id];
	}

	delete() {
		return this.collection.deleteOne(this.id);
	}

	setStatus(status, query) {
		return this.collection.updateOne({ _id: this.id }, { $set: { status }, ...query });
	}

	get starting() {
		return this.data.status === Status.STARTING;
	}

	async start() {
		if (!this.starting) return this.send(`A game is already running in <#${this.data.channel_id}>`);

		if (this.data.players.length < 2) {
			await this.delete();
			return this.send('You must have at least two players to initiate a game.');
		}

		return this.startRound();
	}

	async startRound() {
		await this.client.timers.set(this.constructor.ANSWER_TIME, {
			type: Timer.RESPONSE_TIMEOUT,
			round: this.data.round,
			id: this.id.str,
		});
		await this.postQuestion(this.data.category);

		return this.setStatus(Status.AWAITING_RESPONSES, {
			$unset: { answers: '' },
		});
	}

	async startVoting() {
		const seconds = (Object.keys(this.data.answers).length * 4) + 5;
		await this.client.timers.set(seconds * 1000, {
			type: Timer.RESPONSE_TIMEOUT,
			round: this.data.round,
			id: this.id.str,
		});
		await this.setStatus(Status.AWAITING_VOTES);

		return this.send(`Everyone has ${seconds} seconds to vote for the answer!`);
	}

	addAnswer(user, content) {
		return this.collection.updateOne(this.id, {
			$set: { [`answers.${user}`]: { content } },
		});
	}

	addVote(voter, votee) {
		return this.collection.updateOne(this.id, {
			$addToSet: { [`answers.${votee}.voters`]: voter },
		});
	}

	async postQuestion() {
		const question = await this.client.questions.random(this.data.category || 'facts');
		let author = null;
		try {
			author = await this.client.rest.users[question.creator_id].get();
		} catch {}

		const embed = { description: question.q };
		if (author) {
			embed.footer = `${author.username}#${author.discriminator}`;
		}

		return this.send({
			content: `You have ${this.constructor.ANSWER_TIME / 1000} seconds to answer!`,
			embed,
		});
	}

	async handleAnswer(ctx) {
		const added = await this.addAnswer(ctx.author.id, ctx.content);
		if (added.modifiedCount) {
			return ctx.reply(`Updated your answer! Back to the game: ${this.channelMention}`);
		}

		if (Object.keys(this.data.answers).length >= this.data.players.length) {
			await this.startVoting();
		}

		return ctx.reply(`Nice! Back to the game: ${this.channelMention}`);
	}

	async handleVote(ctx) {
		const index = parseInt(ctx.content, 10);
		if (isNaN(index) || index > this.data.answers.length || index < 1) {
			return ctx.reply('Please give a valid answer number to vote for!');
		}

		const added = await this.addVote(ctx.author.id, index - 1);
		if (added.modifiedCount) {
			return ctx.reply(`Updated your vote! Back to the game: ${this.channelMention}`);
		}

		return ctx.reply(`I'm sure you picked a winner! Back to the game: ${this.channelMention}`);
	}

	async stop() {
		// TODO: end game.
		await this.setStatus(Status.ENDED);
		return this.send(`Game ended! 😦 Type \`${this.client.config.prefix}start\` to start a new one.`);
	}

	send(data) {
		if (typeof data === 'string') data = { content: data };
		return this.channel.messages.post(data);
	}
}

module.exports = Game;
