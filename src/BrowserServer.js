import WulfServer from './server/WulfServer.js';

class BrowserServer extends WulfServer {
	constructor() {
		super();
		this.isBrowserServer = true;
	}
}

export default BrowserServer;
