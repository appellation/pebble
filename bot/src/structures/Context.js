class Context {
	constructor(client, msg, args) {
		this.client = client;
		this.msg = msg;
		this.args = args;
	}

	reply(data) {
		if (typeof data === 'string') data = { content: data };
		return this.client.rest.channels[this.msg.channel_id].messages.post(data);
	}
}

module.exports = Context;
