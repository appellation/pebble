#!/bin/env/node
const { Amqp } = require('@spectacles/brokers');
const rest = require('@spectacles/rest');
const toml = require('toml');
const fs = require('fs');
const Client = require('../src/Client');

const config = toml.parse(fs.readFileSync('spectacles.toml').toString());

const gateway = new Amqp(config.broker.group);
const restClient = rest(config.discord.token);

const client = new Client({
	gateway,
	rest: restClient,
});
