const Timer = require('../../constants/Timer');
const keys = Object.keys(Timer);

module.exports = async (client, data) => {
	const type = keys[data.context.type];
	if (!type) return;

	const timer = client.timers.handlers.get(type);
	if (timer) {
		try {
			await timer(client, data);
		} catch (err) {
			console.error(err);
		}
	}
};
