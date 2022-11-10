import { randInt, isOverlapping } from './little-engine-esm/little-engine-esm-build.all.js';
import { playSound } from './sounds.js';
import CharacterEntity from './CharacterEntity.js';
import { award } from './achievements.js';

class AnimalEntity extends CharacterEntity {
	constructor(entOptions) {
		super(entOptions);
		this.timid = true;
		this.followsBait = true;
	}

	kill() {
		playSound('hit', this.pos);
		this.health = 0;
		// this.angle = .1;
		this.bleed();
		this.setEmotion('dead');
		// Not sure if setTimeout is the best approach in this framework
		setTimeout(() => this.world.makeItem('Meat', this.pos, 1), 500);
		setTimeout(() => super.kill(), 4000);
	}

	update() {
		super.update();
		const pc = this.findPc();
		const ee = pc ? pc.equippedEntity : null;
		if (!this.isDead() && ee && ee.itemType.damaging) {
			if (isOverlapping(this.pos, this.size, ee.pos, ee.size)) {
				award(2);
				const dmg = this.damage(ee.itemType.damaging, ee);
				if (dmg) {
					pc.pickup(
						{ ...this.world.getItemType('Blood') }, // item type
						randInt(1, 3), // quantity
					);
				}
			}
		}
	}
}

export default AnimalEntity;
