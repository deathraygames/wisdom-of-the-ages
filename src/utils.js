const getPseudoRand = (n) => {
	// http://stackoverflow.com/a/19303725/1766230
	const x = Math.sin(n) * 10000;
	return x - Math.floor(x);
};

function getNearest(things = [], targetPos = {}) {
	let nearest;
	const bestDistance = things.reduce((best, a) => { // eslint-disable-line no-unused-vars
		const dist = a.pos.distance(targetPos);
		if (dist < best) {
			nearest = a;
			return dist;
		}
		return best;
	}, Infinity);
	return nearest;
}

export {
	getPseudoRand,
	getNearest,
};
