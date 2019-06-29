const { Status } = require('../constants/Question');

class Questions {
	constructor(collection) {
		this.collection = collection;
	}

	random() {
		return this.collection.aggregate([
			{
				$match: {
					$or: [
						{ status: Status.APPROVED },
						{ status: null },
					],
				},
			},
			{ $sample: { size: 1 } },
		]).limit(1).next();
	}
}

module.exports = Questions;
