const path = require('path');
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
		this.timers = new Loader(path.resolve(__dirname, 'timers'));
		this.collections = new Collections(this.mongo);
	}

	get proposalMessages() {
		return this.rest.channels[this.config.proposal_channel].messages;
	}
}

module.exports = Client;
