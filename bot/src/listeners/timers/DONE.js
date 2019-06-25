const Timer = require('../../constants/Timer');

module.exports = async (client, data) => {
	const timer = client.timers.get(data.type);
	if (timer) {
		try {
			await timer(client, data);
		} catch (err) {
			console.error(err);
		}
	}
};
