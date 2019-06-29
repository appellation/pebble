const { Status } = require('./Question');

module.exports = {
	[Status.UNAPPROVED]: 0xFFDF00,
	[Status.REJECTED]: 0xFF3B00,
	[Status.BANNED]: 0xFF0000,
	[Status.APPROVED]: 0x00FF7B,
	PROMPT: 0x6a72e2,
	ANSWERS: 0x6aaee2,
	VOTES: 0x6ae2da,
};
