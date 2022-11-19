import * as game from '../game.js';
import World from './World.js';
import { award } from '../achievements.js';
import ClientCommunicator from './ClientCommunicator.js';

const NOOP = () => {};

class WulfServer {
	constructor({
		renderPost = NOOP,
	} = {}) {
		this.isWulfServer = true;
		this.game = game;
		this.world = new World();
		this.comm = new ClientCommunicator();
		this.renderPost = renderPost;
		game.init(this.world);
		game.startGame();
		this.world.broadcast = (...args) => { if (this.comm) this.comm.send(...args); };
	}

	instructPlayerCharacter(what, args) {
		const { pc } = this.world;
		if (!pc) {
			console.warn('No pc (yet)');
			return;
		}
		if (typeof pc[what] !== 'function') console.warn(what, 'not a function on', pc);
		pc[what](...args);
	}

	instructGame(what, args) {
		if (what === 'award') {
			award(args[0]);
			return;
		}
		this.game[what](...args);
	}
}

export default WulfServer;
