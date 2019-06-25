module.exports = async (client, msg) => {
	let { content } = msg;
	if (content.startsWith(client.config.prefix)) {
		content = content.slice(client.config.prefix.length).trim();
	}

	const args = content.split(/\s+/);
	const cmd = client.listeners.commands.get(args.shift());
	if (cmd) {
		try {
			await cmd(client, msg, args);
		} catch (err) {
			console.error(err);

			try {
				await client.rest.channels[msg.channel_id].messages.post({ content: 'something went wrong' });
			} catch {}
		}
	}
};
