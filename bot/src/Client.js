const path = require('path');
const Loader = require('./Loader');

class Client {
	constructor(options) {
		this.gateway = options.gateway;
		this.rest = options.rest;
		this.mongo = options.mongo;
		this.config = options.config;
		this.listeners = new Loader(path.resolve(__dirname, 'listeners'));
		this.commands = new Loader(path.resolve(__dirname, 'commands'));
	}
}

module.exports = Client;
