import CharacterEntity from './CharacterEntity.js';

const { vec2 } = CharacterEntity.getEngine();

class PlayerCharacterEntity extends CharacterEntity {
	constructor(entOptions) {
		super(entOptions);
		this.isPlayerCharacter = true;
		this.health = 5;
		this.maxSpeed = .15; // was .25
		this.renderOrder = 10;
		this.age = 18;
		this.oldAge = 100;
	}

	update() {
		this.scary = true;
		super.update();
		this.updateEquip();
	}

	updateEquip() {
		const ee = this.equippedEntity;
		if (!ee) return;
		const item = this.getEquippedItem();
		if (!item) {
			// this.equip(-1);
			return;
		}
		const thrust = this.actionTimer.active() ? 1.1 : .8;
		ee.drawSize = vec2(
			// eslint-disable-next-line no-nested-ternary
			!item.quantity ? 0 : (this.actionTimer.active() ? 1.2 : 1),
		);
		ee.localPos = vec2().setAngle(this.facing, thrust);
		let offset = vec2();
		if (this.direction === 0) offset = vec2(.35, -.1);
		else if (this.direction === 1) offset = vec2(.2, -.2);
		else if (this.direction === 7) offset = vec2(-.2, -.1);
		ee.localPos = ee.localPos.add(offset);
		ee.localAngle = this.facing + (Math.PI * 1.2) + (item.holdAngleOffset || 0);
		ee.renderOrder = (ee.pos.y < this.pos.y) ? 11 : 9;
	}
}

export default PlayerCharacterEntity;
