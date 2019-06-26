const Game = require('./Game');

class GameManager {
	constructor(client) {
		this.client = client;
		this.coll = client.collections.games;
	}

	async channel(id) {
		const game = await new Game(this.coll, this.client.timers, id).fetch();
		if (!game) return null;
		return this.client.rest.channels[game.channel_id];
	}
}

module.exports = GameManager;
