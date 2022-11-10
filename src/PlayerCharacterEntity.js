import {
	vec2, PI,
	getMousePos, mouseIsDown, keyWasPressed, keyIsDown,
	gamepadIsDown, getUsingGamepad, gamepadStick,
} from './little-engine-esm/little-engine-esm-build.all.js';
import { award } from './achievements.js';
import CharacterEntity from './CharacterEntity.js';

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

	update() { // from platformer Player extends Character
		const mousePos = getMousePos();
		if (mouseIsDown(2)) this.goTo(mousePos, true); // right click movement

		const numKeyCodes = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57];
		numKeyCodes.forEach((n) => { if (keyWasPressed(n)) this.toggleEquip(n - 48); });

		// "Q" or "Z" key
		if (keyIsDown(81) || keyIsDown(90) || gamepadIsDown(1)) this.throw(this.equipIndex);
		// "E" or "X" key
		if (keyIsDown(69) || keyIsDown(88) || mouseIsDown(0) || gamepadIsDown(0)) this.action(mousePos);

		// movement control
		this.moveInput = getUsingGamepad()
			? gamepadStick(0) : vec2(keyIsDown(39) - keyIsDown(37), keyIsDown(38) - keyIsDown(40));

		if (this.moveInput && (this.moveInput.x || this.moveInput.y)) {
			award(0);
		}
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
		ee.localAngle = this.facing + (PI * 1.2) + (item.holdAngleOffset || 0);
		ee.renderOrder = (ee.pos.y < this.pos.y) ? 11 : 9;
	}
}

export default PlayerCharacterEntity;
