const { ObjectID } = require('mongodb');
const { Status } = require('../constants/Game');
const Timer = require('../constants/Timer');

class Game {
	static get ANSWER_TIME() {
		return 30 * 1000;
	}

	constructor(coll, timers, id) {
		this.coll = coll;
		this.timers = timers;
		this.id = new ObjectID(id);
	}

	fetch() {
		return this.coll.findOne(this.id);
	}

	delete() {
		return this.coll.deleteOne(this.id);
	}

	setStatus(status) {
		return this.coll.updateOne(this.id, { $set: { status } });
	}

	async start() {
		const game = await this.fetch();
		if (!game || game.status !== Status.STARTING) return;

		if (game.players.length < 2) {
			await this.delete();
			throw new Error('You must have at least two players to initiate a game.');
		}

		return this.startRound();
	}

	async startRound() {
		const game = await this.fetch();

		await this.timers.set(this.constructor.ANSWER_TIME, {
			type: Timer.RESPONSE_TIMEOUT,
			round: game.round,
			id: this.id.str,
		});
		await this.setStatus(Status.AWAITING_RESPONSES);
	}

	async startVoting() {
		const game = await this.fetch();

		await this.timers.set(((Object.keys(game.answers).length * 4) + 5) * 1000, {
			type: Timer.RESPONSE_TIMEOUT,
			round: game.round,
			id: this.id.str,
		});
		await this.setStatus(Status.AWAITING_VOTES);
	}

	async endRound() {
		await this.setStatus(Status.ENDED);
	}

	addAnswer(userID, content) {
		return this.coll.updateOne(this.id, {
			$set: { answers: { [userID]: content } },
		});
	}

	async getAnswers() {
		const game = await this.fetch().project({ answers: 1 });
		if (game) return game.answers;
		return null;
	}

	addVote(voter, answer) {
		this.coll.updateOne(this.id, {
			$addToSet: { votes: { [voter]: answer } },
		});
	}
}

module.exports = Game;
