const fsn = require('fs-nextra');
const path = require('path');

class Loader extends Map {
	constructor(directory, depth = Infinity) {
		super();

		fsn.scan(directory, {
			filter: (stats, dir) => stats.isFile() && path.extname(dir) === '.js',
			depthLimit: depth,
		}).then(res => {
			for (const loc of res.keys()) {
				const mod = require(loc);
				const name = path.basename(loc, '.js');
				this.set(name, mod);
			}
		});
	}
}

module.exports = Loader;
