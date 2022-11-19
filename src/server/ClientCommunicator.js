class ClientCommunicator {
	constructor({ server, client } = {}) {
		this.server = server;
		this.client = client;
		// if (server) this.server.comm = new Communicator();
		// if (client) this.client.comm = new Communicator();
	}

	send(...args) {
		try {
			if (!this.client) throw new Error('No client defined');
			this.client.receive(...args);
		} catch (err) {
			console.error(err);
		}
	}
}

export default ClientCommunicator;
