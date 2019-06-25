module.exports = {
	Categories: new Set([
		'gaming',
		'discord',
	]),
	Status: {
		UNAPPROVED: 0,
		REJECTED: 1,
		BANNED: 2,
		APPROVED: 3,
	},
	Type: {
		TEXT: 0,
		AUDIO: 1,
		IMAGE: 2,
	},
};
