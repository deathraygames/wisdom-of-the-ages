import { rand, Timer } from './little-engine-esm/little-engine-esm-build.all.js';
import WorldEntity from './WorldEntity.js';

class SpiritEntity extends WorldEntity {
	constructor(entOptions) {
		super(entOptions);
		this.restTimer = new Timer();
		this.moveTimer = new Timer();
		this.setCollision(0);
		this.tileIndex = 1;
		this.moveTarget = this.pos.copy();
	}

	update() {
		super.update();
		if (this.restTimer.active()) return;
		const dist = this.pos.distance(this.moveTarget);
		if (this.moveTimer.active()) {
			if (dist > 1) {
				this.velocity = this.velocity.lerp(this.moveTarget.subtract(this.pos), 0.9);
				this.velocity = this.velocity.clampLength(4);
			} else { // Reached destination
				this.velocity = this.velocity.scale(.1);
				this.restTimer.set(10);
				this.moveTimer.unset();
			}
			return;
		}
		// Not moving
		if (rand() > .2) {
			// Don't make herbs if the player isn't there yet
			if (this.world.pc) this.world.makeItem('Herb', this.pos, 1);
			this.restTimer.set(10);
		} else {
			this.moveTarget = this.world.getRandPos();
			this.moveTimer.set(5);
		}
	}
}

export default SpiritEntity;
