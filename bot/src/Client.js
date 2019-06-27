const path = require('path');
const Questions = require('./structures/Questions');
const Timers = require('./structures/Timers');
const Collections = require('./Collections');
const Loader = require('./Loader');

class Client {
	constructor(options) {
		this.brokers = {
			gateway: options.gateway,
			timers: options.timers,
		};
		this.rest = options.rest;
		this.mongo = options.mongo;
		this.config = options.config;
		this.listeners = {
			gateway: new Loader(path.resolve(__dirname, 'listeners', 'gateway')),
			timers: new Loader(path.resolve(__dirname, 'listeners', 'timers')),
		};
		this.commands = new Loader(path.resolve(__dirname, 'commands'));
		this.timers = new Timers(this.brokers.timers, path.resolve(__dirname, 'timers'));
		this.collections = new Collections(this.mongo);
		this.questions = new Questions(this.collections.questions);
	}

	get proposalMessages() {
		return this.rest.channels[this.config.proposal_channel].messages;
	}
}

module.exports = Client;
