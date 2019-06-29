const { ObjectID } = require('mongodb');
const { Status } = require('../constants/Game');
const Colors = require('../constants/Colors');
const Timer = require('../constants/Timer');
const SYSTEM = 'SYSTEM';


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
			return this.sync().then(() => this);
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

	get playerCount() {
		return Object.keys(this.data.players).length;
	}

	get voteCount() {
		if (this.data.voters) return Object.keys(this.data.voters).length;
		return 0;
	}

	get voteCounts() {
		return Object.values(this.data.voters || {}).reduce((acc, votee) => {
			acc[votee] = (acc[votee] || 0) + 1;
			return acc;
		}, {});
	}

	answerCount(filterSystem = true) {
		if (this.data.answers) return Object.keys(this.data.answers).length - (this.data.answers[SYSTEM] && filterSystem ? 1 : 0);
		return 0;
	}

	async sync() {
		this.data = await this.collection.findOne(this.objectID);
	}

	delete() {
		return this.collection.deleteOne(this._id);
	}

	async start() {
		if (this.data.status !== Status.STARTING) return this.send(`A game is already running in <#${this.data.channel_id}>`);

		if (this.playerCount < 2) {
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
		const question = await this.postQuestion(this.data.category);

		return this.collection.updateOne(this._id, {
			$set: {
				status: Status.AWAITING_RESPONSES,
				answers: question.a ? { [SYSTEM]: question.a } : {},
			},
			$unset: { voters: '' },
			$inc: { round: 1 },
		});
	}

	async startVoting() {
		if (this.answerCount() === 0) {
			await this.send('No answers were submitted this round!');

			return this.endRound();
		}

		await this.collection.updateOne(this._id, { $set: { status: Status.AWAITING_VOTES } });
		await this.sync();
		this.data.answers = Object.fromEntries(Object.entries(this.data.answers).sort(() => Math.random() - 0.5));
		await this.collection.updateOne(this._id, { $set: { answers: this.data.answers } });

		const seconds = (this.answerCount(false) * 4) + 5;
		await this.client.timers.set(seconds * 1000, {
			type: Timer.VOTE_TIMEOUT,
			round: this.data.round,
			id: this.id,
		});

		return this.send({
			content: `Everyone has **${seconds} seconds** to vote **in DMs** for the answer!`,
			embed: {
				fields: Object.values(this.data.answers)
					.map((answer, i) => ({
						name: (i + 1).toString(),
						value: answer.slice(0, 1024),
						inline: true,
					})),
				color: Colors.ANSWERS,
			},
		});
	}

	async endRound() {
		if (this.data.voters && this.data.answers) {
			await this.send({
				embed: {
					fields: Object.entries(this.voteCounts)
						.map(([id, count]) => ({
							name: `Votes: ${count}`,
							value: this.data.answers[id].slice(0, 1024),
							inline: true,
						}))
						.slice(0, 25),
					color: Colors.VOTES,
				},
			});

			const $inc = {};
			for (const [voter, votee] of Object.entries(this.data.voters)) {
				const sys = votee === SYSTEM;
				const user = sys ? voter : votee;
				const key = `players.${user}.points`;
				$inc[key] = ($inc[key] || 0) + (sys ? 2 : 1);
			}

			await this.collection.updateMany(this._id, { $inc });
		}
		return this.startRound();
	}

	addAnswer(user, content) {
		return this.collection.updateOne(this._id, {
			$set: { [`answers.${user}`]: content },
		});
	}

	addVote(voter, votee) {
		return this.collection.updateOne(this._id, {
			$set: { [`voters.${voter}`]: votee },
		});
	}

	async postQuestion() {
		const question = await this.client.questions.random();
		const embed = { description: question.q, color: Colors.PROMPT };

		if (question.creator_id) {
			try {
				const author = await this.client.rest.users[question.creator_id].get();
				embed.footer = { content: `${author.username}#${author.discriminator}` };
			} catch {}
		} else {
			embed.footer = { content: 'Static Question' };
		}

		await this.send({
			content: `You have **${this.constructor.ANSWER_TIME / 1000} seconds** to answer **in DMs**!`,
			embed,
		});

		return question;
	}

	async handleAnswer(ctx) {
		await this.addAnswer(ctx.msg.author.id, ctx.msg.content);
		await this.sync();
		if (this.answerCount() >= this.playerCount) {
			await this.startVoting();
		}

		return ctx.reply(`Nice! Back to the game: ${this.channelMention}`);
	}

	async handleVote(ctx) {
		const index = parseInt(ctx.msg.content, 10);
		const answerCount = this.answerCount(false);
		if (isNaN(index) || index > answerCount || index < 1) {
			return ctx.reply(`Please give a number between 1 and ${answerCount}!`);
		}

		await this.addVote(ctx.msg.author.id, Object.keys(this.data.answers)[index - 1]);
		// await this.sync();
		// if (this.voteCount >= this.playerCount) {
		// 	await this.endRound();
		// }

		return ctx.reply(`I'm sure you picked a winner! Back to the game: ${this.channelMention}`);
	}

	async stop() {
		await this.send({
			content: 'GG!',
			embed: {
				fields: Object.entries(this.data.players)
					.sort(([, a], [, b]) => b.points - a.points)
					.map(([id, p]) => ({
						name: `Points: ${p.points}`,
						value: `<@${id}>`,
						inline: true,
					})),
			},
		});
		await this.delete();
	}

	send(data) {
		if (typeof data === 'string') data = { content: data };
		return this.channel.messages.post(data);
	}
}

module.exports = Game;
