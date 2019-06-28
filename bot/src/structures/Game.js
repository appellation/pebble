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
			this.id = id._id;
			this.data = id;
		} else {
			this.id = id;
			return this.collection.findOne(this.objectID).then(data => {
				this.data = data;
				return this;
			});
		}
	}

	get _id() {
		return { _id: this.objectID };
	}

	get objectID() {
		return new ObjectID(this.id);
	}

	get collection() {
		return this.client.collections.games;
	}

	get channel() {
		return this.client.rest.channels[this.data.channel_id];
	}

	get channelMention() {
		return `<#${this.data.channel_id}>`;
	}

	get voteCount() {
		if (this.data.answers) return Object.values(this.data.answers).reduce((acc, answer) => acc + answer.voters.length, 0);
		return 0;
	}

	get answerCount() {
		if (this.data.answers) return Object.keys(this.data.answers).length;
		return 0;
	}

	delete() {
		return this.collection.deleteOne(this._id);
	}

	setStatus(status, query) {
		return this.collection.updateOne(this._id, { $set: { status }, ...query });
	}

	async start() {
		if (this.data.status !== Status.STARTING) return this.send(`A game is already running in <#${this.data.channel_id}>`);

		if (this.data.players.length < 2) {
			await this.delete();
			return this.send('You must have at least two players to initiate a game.');
		}

		return this.startRound();
	}

	async startRound() {
		await this.client.timers.set(this.constructor.ANSWER_TIME, {
			type: Timer.RESPONSE_TIMEOUT,
			round: this.data.round + 1,
			id: this.id,
		});
		await this.postQuestion(this.data.category);

		return this.setStatus(Status.AWAITING_RESPONSES, {
			$unset: { answers: '' },
			$inc: { round: 1 },
		});
	}

	async startVoting() {
		if (this.answerCount === 0) {
			await this.send('No answers were submitted this round!');

			return this.endRound();
		}

		const seconds = (this.answerCount * 4) + 5;
		await this.client.timers.set(seconds * 1000, {
			type: Timer.VOTE_TIMEOUT,
			round: this.data.round,
			id: this.id,
		});
		await this.setStatus(Status.AWAITING_VOTES);

		return this.send({
			content: `Everyone has ${seconds} seconds to vote for the answer!`,
			embed: {
				fields: Object.values(this.data.answers)
					.map((answer, i) => ({
						name: (i + 1).toString(),
						value: answer.content,
						inline: true,
					})),
			},
		});
	}

	async endRound() {
		if (this.data.answers) {
			await this.send({
				embed: {
					fields: Object.values(this.data.answers)
						.sort((a, b) => a.voters.length - b.voters.length)
						.map((answer, i) => ({
							name: `${i === 0 ? '🎉 ' : ''}Votes: ${answer.voters.length}`,
							value: answer.content,
							inline: true,
						})),
				},
			});
			await this.collection.updateOne(this._id, {
				$inc: Object.fromEntries(Object.entries(this.data.answers).map(([id, answer]) => [id, answer.voters.length])),
			});
		}
		return this.startRound();
	}

	async addAnswer(user, content) {
		const res = await this.collection.updateOne(this._id, {
			$set: { [`answers.${user}`]: { content, voters: [] } },
		});
		if (res.modifiedCount === 0) return res;

		if (this.answerCount === this.data.players.length) await this.startVoting();
		return res;
	}

	async addVote(voter, votee) {
		const res = await this.collection.updateOne(this._id, {
			$addToSet: { [`answers.${votee}.voters`]: voter },
		});
		if (res.modifiedCount === 0) return res;

		if (this.voteCount === this.data.players.length) await this.endRound();
		return res;
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
		const added = await this.addAnswer(ctx.msg.author.id, ctx.msg.content);
		if (added.modifiedCount) {
			return ctx.reply(`Updated your answer! Back to the game: ${this.channelMention}`);
		}

		if (this.answerCount >= this.data.players.length) {
			await this.startVoting();
		}

		return ctx.reply(`Nice! Back to the game: ${this.channelMention}`);
	}

	async handleVote(ctx) {
		const index = parseInt(ctx.msg.content, 10);
		if (isNaN(index) || index > this.answerCount || index < 1) {
			return ctx.reply(`Please give a number between 1 and ${this.answerCount}!`);
		}

		const added = await this.addVote(ctx.msg.author.id, Object.keys(this.data.answers)[index - 1]);
		if (added.modifiedCount) {
			return ctx.reply(`Updated your vote! Back to the game: ${this.channelMention}`);
		}

		return ctx.reply(`I'm sure you picked a winner! Back to the game: ${this.channelMention}`);
	}

	async stop() {
		// TODO: end game.
		await this.delete();
	}

	send(data) {
		if (typeof data === 'string') data = { content: data };
		return this.channel.messages.post(data);
	}
}

module.exports = Game;
