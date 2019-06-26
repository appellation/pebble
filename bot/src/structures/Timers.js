const Loader = require('../Loader');

class Timers {
	constructor(broker, dir) {
		this.handlers = new Loader(dir);
		this.broker = broker;
	}

	set(duration, context) {
		return this.broker.publish('START', {
			expiration: new Date(Date.now() + duration).toISOString(),
			context,
		});
	}
}

module.exports = Timers;
