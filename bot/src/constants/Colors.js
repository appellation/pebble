const { Status } = require('./Question');

module.exports = {
	[Status.UNAPPROVED]: 0xFFDF00,
	[Status.REJECTED]: 0xFF3B00,
	[Status.BANNED]: 0xFF0000,
	[Status.APPROVED]: 0x00FF7B,
};
