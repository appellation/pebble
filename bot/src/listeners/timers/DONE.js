const Timer = require('../../constants/Timer');

module.exports = async (client, data) => {
	const type = Object.entries(Timer).find(([, v]) => v === data.context.type);
	if (!type) return;

	const timer = client.timers.handlers.get(type[0]);
	if (timer) {
		try {
			await timer(client, data);
		} catch (err) {
			console.error(err);
		}
	}
};
