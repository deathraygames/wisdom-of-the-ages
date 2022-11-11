class Communicator {
	constructor({ server } = {}) {
		this.server = server;
	}

	send(...args) {
		try {
			if (!this.server) throw new Error('No server defined');
			const who = args.shift();
			const what = args.shift();
			const remainingArgs = args;
			if (who === 'pc') {
				// console.log('instruct pc', what, remainingArgs);
				this.server.instructPlayerCharacter(what, remainingArgs);
			} else if (who === 'game') {
				this.server.instructGame(what, remainingArgs);
			}
		} catch (err) {
			console.error(err);
		}
	}
}

export default Communicator;
