class Collections {
	constructor(mongo) {
		this.mongo = mongo;
	}

	get questions() {
		return this.mongo.collection('questions');
	}

	get games() {
		return this.mongo.collection('games');
	}
}

module.exports = Collections;
