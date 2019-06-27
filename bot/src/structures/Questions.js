const { Status } = require('../constants/Question');

class Questions {
	constructor(coll) {
		this.coll = coll;
	}

	random(categories = []) {
		return this.coll.aggregate([
			{
				$match: {
					status: Status.APPROVED,
					categories: { $in: categories || [] },
				},
			},
			{ $sample: { size: 1 } },
		]).limit(1).next();
	}
}

module.exports = Questions;
