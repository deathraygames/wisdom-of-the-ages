import {
	Color, vec2, randInt, PI, max, percent, randColor,
	ASSERT,
	Timer, EngineObject, TileLayerData,
} from './little-engine-esm/little-engine-esm-build.all.js';

/** A WorldEntity is a generic "thing" that exists in the world */
class WorldEntity extends EngineObject {
	constructor(entOptions = {}) {
		const {
			pos = vec2(),
			size = vec2(1),
			tileIndex = 1,
			tileSize,
			angle,
			world,
			damaging = 0,
			name = randInt(999),
			health = 0,
		} = entOptions;
		super(pos, size, tileIndex, tileSize, angle);
		this.name = name;
		this.world = world;
		this.facing = PI; // Radians: 0 = up, PI = down
		this.direction = 4; // 0-7
		this.damageTimer = new Timer();
		this.health = health;
		this.damaging = damaging;
		// 0 = up, 1 = right-up, 2 = right,
		// 3 = right-down, 4 = down, 5 = left-down, 6 = left, 7 = left-up
		this.drawSize = vec2(1);
		// this.tileIndex = 1;
	}

	getTileData() {
		const direction = randInt(4);
		const mirror = randInt(2);
		const color = randColor();
		return new TileLayerData(this.tileIndex, direction, mirror, color);
	}

	setDirection() {
		this.direction = Math.round(
			(this.facing < 0) ? 4 + (((PI + this.facing) * 4) / PI) : ((this.facing * 4) / PI),
		) % 8;
	}

	damage(damage, damagingObject) {
		ASSERT(damage >= 0);
		if (this.isDead()) return 0;
		if (this.damageTimer.active()) return 0;

		// set damage timer;
		this.damageTimer.set(1);
		this.children.forEach((child) => child.damageTimer && child.damageTimer.set(1));
		// apply damage and kill if necessary
		const newHealth = max(this.health - damage, 0);
		const amountDamaged = this.health - newHealth;
		this.health = newHealth;
		if (!this.health) this.kill(damagingObject);
		return amountDamaged;
	}

	isDead() { return !this.health; }

	kill() { this.destroy(); }

	update() {
		super.update();
		this.setDirection();

		// flash white when damaged
		if (!this.isDead() && this.damageTimer.isSet()) {
			const a = .5 * percent(this.damageTimer.get(), .15, 0);
			this.additiveColor = new Color(a, .1, .1, .5);
		} else this.additiveColor = new Color(0, 0, 0, 0);
	}

	findPc() {
		return this.world.animals.find((a) => a.isPlayerCharacter && !a.isDead());
	}
}

export default WorldEntity;
