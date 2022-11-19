import WulfServer from './server/WulfServer.js';

class BrowserServer extends WulfServer {
	constructor(options = {}) {
		super(options);
		this.isBrowserServer = true;
		this.comm.client = options.client;
	}
}

export default BrowserServer;
