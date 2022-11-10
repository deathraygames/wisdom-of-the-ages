import { vec2, Timer, isOverlapping } from './little-engine-esm/little-engine-esm-build.all.js';
import WorldEntity from './WorldEntity.js';

class ItemEntity extends WorldEntity {
	constructor(entOptions) {
		super(entOptions);
		this.itemType = entOptions.itemType;
		this.reticle = entOptions.itemType.reticle;
		this.tileIndex = this.itemType.tileIndex;
		this.fadeTimer = new Timer();
	}

	update() {
		super.update();
		const pc = this.findPc();
		if (this.isDead()) {
			this.drawSize = vec2(1 - this.fadeTimer.getPercent());
			if (pc) this.pos = this.pos.lerp(pc.pos, .1);
		} else if (pc) {
			if (isOverlapping(this.pos, this.size, pc.pos, pc.size)) {
				// award(2);
				// const dmg = this.damage(pc.equippedEntity.damaging, pc.equippedEntity);
				pc.pickup(this.itemType, this.itemType.quantity || 1);
				this.health = 0;
				this.fadeTimer.set(.4);
				setTimeout(() => this.kill(), 400);
			}
		}
	}
}

export default ItemEntity;
