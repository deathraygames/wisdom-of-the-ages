import * as game from '../game.js';
import World from './World.js';
import { award } from '../achievements.js';

class WulfServer {
	constructor() {
		this.isWulfServer = true;
		this.game = game;
		this.world = new World();
		game.init(this.world);
		game.startGame();
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
