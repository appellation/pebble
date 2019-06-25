#!/bin/env/node
const { Amqp } = require('@spectacles/brokers');
const rest = require('@spectacles/rest');
const toml = require('toml');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const Client = require('../src/Client');

const config = toml.parse(fs.readFileSync('spectacles.toml').toString());

const gateway = new Amqp(config.broker.groups.gateway);
const timers = new Amqp(config.broker.groups.timers);
const restClient = rest(config.discord.token);
const mongo = new MongoClient(config.database.url, { useNewUrlParser: true });

gateway.on('close', console.warn);
timers.on('close', console.warn);

let client;

mongo.connect().then(() => {
	client = new Client({
		gateway,
		timers,
		rest: restClient,
		mongo: mongo.db(config.database.name),
		config,
	});

	return gateway.connect(config.broker.url);
}).then(conn => {
	gateway.subscribe([...client.listeners.gateway.keys()], (event, data) => {
		const handler = client.listeners.gateway.get(event);
		if (handler) handler(client, data);
	});

	return timers.connect(conn);
})
	.then(() => {
		timers.subscribe([...client.listeners.timers.keys()], (event, data) => {
			const handler = client.listeners.timers.get(event);
			if (handler) handler(client, data);
		});
	});


