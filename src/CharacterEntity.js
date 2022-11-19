/* eslint-disable max-len, operator-assignment, function-paren-newline, function-call-argument-newline */
import {
	vec2, mod, rand, randInt, PI, drawRect, isOverlapping,
	Timer, Color, ParticleEmitter,
	getMainContext, drawCanvas2D,
} from './little-engine-esm/little-engine-esm-build.all.js';
import { award } from './achievements.js';
import { playSound } from './sounds.js';
import { getSpecies, drawSpecies, breedSpecies } from './species.js';
import WorldEntity from './WorldEntity.js';
import ItemEntity from './ItemEntity.js';
import { getNearest } from './utils.js';

const nc = (...a) => new Color(...a);

class CharacterEntity extends WorldEntity {
	constructor(entOptions) {
		super(entOptions);
		this.actionTimer = new Timer();
		this.lookTimer = new Timer();
		this.planTimer = new Timer(20);
		this.agingTimer = new Timer();
		this.bleedTimer = new Timer();
		this.walkSoundTimer = new Timer();
		this.lungeTimer = new Timer();
		// Emotions
		this.emotionKey = null;
		this.estrousTimer = new Timer(); // "in heat"?
		this.fearTimer = new Timer();
		// Fixed values
		this.color = (new Color()).setHSLA(rand(), 1, .7);
		this.bioParents = entOptions.bioParents || null;
		this.species = entOptions.species || breedSpecies(this.bioParents) || getSpecies(this.color);
		this.renderOrder = 10;
		this.health = 2;
		this.speedRamp = 0; // 0-1 ~ acceleration
		this.maxSpeed = .26;
		this.lookRange = 7;
		this.oldAge = Infinity;
		this.timid = false;
		this.followsBait = false;
		this.setCollision(1);
		// Changeable / temp values
		this.age = 0;
		this.walkTick = 0;
		this.walkCyclePercent = 0;
		this.urgency = 1;
		this.movementVelocity = vec2();
		this.moveInput = vec2();
		// New
		this.max = vec2(window.TILE_SIZE);
		// this.head = vec2(12 + randInt(12), 12 + randInt(4));
		// this.body = vec2(12 + randInt(12), 12 + randInt(4));
		// this.head = vec2(0.5, 0.3);
		// this.body = vec2(0.6, 0.3);
		// this.legs = [
		//     // hip, knee, foot
		//     [vec2(-.2, -.1), vec2(-.3, -.3), vec2(-.2, -.5)],
		//     [vec2(.2, -.1), vec2(.3, -.3), vec2(.2, -.5)],
		// ];
		this.drawScale = this.drawSize.x / this.size.x;
		this.inventory = [,,,,,,,,,,]; // eslint-disable-line no-sparse-arrays
		this.equipIndex = -1;
		this.equippedEntity = null;
		this.walkTarget = null; // vec2();

		this.addChild(this.emotionEntity = new WorldEntity({ tileIndex: 9 }));
		this.emotionEntity.localPos = vec2(0, 1.2);
		this.setEmotion();

		this.addChild(this.bloodEmitter = new ParticleEmitter(
			// pos, angle, emitSize, emitTime, emitRate, emiteCone
			vec2(), 0, 0, 0, 0, PI,
			// tileIndex, tileSize
			undefined, undefined,
			nc(1, .2, .2), nc(.5, .1, .1), // colorStartA, colorStartB
			nc(.4, .1, .1), nc(.4, .2, .2, .3), // colorEndA, colorEndB
			5, .2, .1, .07, .1, // particleTime, sizeStart, sizeEnd, particleSpeed, particleAngleSpeed
			.95, .95, 1, PI, .01, // damping, angleDamping, gravityScale, particleCone, fadeRate
			.2, 1, // randomness, collide, additive, randomColorLinear, renderOrder
		), vec2(), 0);
		this.bloodEmitter.elasticity = .5;
		// this.bloodEmitter.particleDestroyCallback = persistentParticleDestroyCallback;
	}

	setEmotion(emotionKey) {
		const emotionTiles = { 'estrous': 9, 'fear': 10, 'anger': 11, 'dead': 12 }; // eslint-disable-line quote-props
		this.emotionEntity.drawSize = vec2(emotionKey ? 1 : 0);
		if (!emotionKey) return;
		this.emotionEntity.tileIndex = emotionTiles[emotionKey];
	}

	updateEmotion() {
		if (this.isDead()) this.emotionKey = 'dead';
		else {
			const estrous = -1 * this.estrousTimer.get();
			const fear = -1 * this.fearTimer.get();
			if (estrous > 0 && estrous > fear) this.emotionKey = 'estrous';
			else if (fear > 0) this.emotionKey = 'fear';
			else this.emotionKey = null;
		}
		this.setEmotion(this.emotionKey);
	}

	move(vector) {
		this.moveInput = vector.copy();
	}

	damage(damage, damagingObject) {
		const actualDmg = super.damage(damage, damagingObject);
		if (actualDmg <= 0) return 0;
		playSound('hit', this.pos);
		if (damagingObject && damagingObject.pos) {
			this.velocity = this.velocity.add(this.pos.subtract(damagingObject.pos).scale(rand(.4, .8)));
		}
		this.bleed();
		this.lookTimer.unset();
		return actualDmg;
	}

	bleed() {
		if (this.bleedTimer.active()) return;
		this.bleedTimer.set(this.isDead() ? .5 : .2);
		this.bloodEmitter.emitRate = 100;
	}

	clot() {
		if (!this.bleedTimer.active()) this.bloodEmitter.emitRate = 0;
	}

	findOpenInventoryIndex(itemName) {
		// Look for open slots with the same name and stackable - Don't consider index 0 (empty hands)
		const invIndex = this.inventory.findIndex((item, i) => (
			item && item.name === itemName && ((item.quantity || 0) < (item.stack || 0)) && i > 0
		));
		if (invIndex !== -1) return invIndex;
		// Look for empty slots
		return this.inventory.findIndex((item, i) => (!item && i > 0));
	}

	findInventoryItem(name) {
		const i = this.inventory.findIndex((item) => (item && item.name === name));
		return (i < 0) ? null : this.inventory[i];
	}

	getEquippedItem() {
		return this.inventory[this.equipIndex];
	}

	pickup(itemType, pickupQuant = 1, invIndex) {
		if (typeof invIndex !== 'number') {
			// eslint-disable-next-line no-param-reassign
			invIndex = this.findOpenInventoryIndex(itemType.name);
		}
		if (!itemType || invIndex < 1 || invIndex > 9) return false;
		const existingItem = this.inventory[invIndex];
		// TODO: Rework this to allow partial pickups if quantity is too high
		if (existingItem && existingItem.name === itemType.name) {
			const newQuant = (existingItem.quantity || 0) + pickupQuant;
			if (newQuant >= (existingItem.stack || 0)) return 0;
			existingItem.quantity = newQuant;
		} else { // Item doesn't exist in inventory, so let's add it
			this.inventory[invIndex] = {
				...itemType, // important to clone this so we don't modify the item type's values
				quantity: pickupQuant, // TODO: check for stack size
			};
		}
		playSound('pickup', this.pos);
		return pickupQuant;
	}

	throw(invIndex) { // aka drop
		if (invIndex < 1 || invIndex > 9) return 0;
		const item = this.inventory[invIndex];
		if (!item) return 0;
		const throwQuant = item.quantity >= 1 ? 1 : 0;
		item.quantity -= throwQuant;
		// Remove item from inventory if there's no more
		if (!item.quantity) this.inventory[invIndex] = null;
		this.reEquip();
		if (throwQuant) this.world.makeItem(item.name, this.pos, 3);
		// TODO: Adjust the quantity of this new item to 1?
		return throwQuant;
	}

	throwEquipped() {
		return this.throw(this.equipIndex);
	}

	toggleEquip(invIndex) {
		this.equip(this.equipIndex === invIndex ? -1 : invIndex);
	}

	reEquip() { this.equip(this.equipIndex); }

	equip(invIndex) {
		if (invIndex < -1 || invIndex > 9) return false;
		const item = this.inventory[invIndex];
		// Shrink the existing equipped entity if it exists (we'll make a new one if needed)
		if (this.equippedEntity) this.equippedEntity.kill();
		// If no item found, or item has run out, then we're unequipping and we're done
		if (!item || !item.quantity) {
			this.equipIndex = -1; // force an unequip in case we're here because of zero quantity
			return false;
		}
		this.equipIndex = invIndex;
		if (item.name === 'Butcher knife') award(1);
		this.addChild(this.equippedEntity = new ItemEntity(
			{ itemType: { ...item }, world: this.world },
			vec2(-.2, .2),
		));
		if (!item.quantity) this.equippedEntity.drawSize = vec2();
		return true;
	}

	getEquippedWeight() {
		const item = this.getEquippedItem();
		return item ? item.weight || 0 : 0;
	}

	hasBaitEquipped() {
		const item = this.getEquippedItem();
		if (!item) return false; // creature is not holding item
		return item.bait || 0;
	}

	attack() {
		// const s = new Sound([.5,.5]);
		// s.play(this.pos);
		playSound('attack', this.pos);
		// this.damage(1);
	}

	findNearestAnimal(nearestPos = this.pos) {
		const aliveAnimals = this.world.animals.filter((a) => !a.isDead() && a !== this);
		const ee = this.equippedEntity;
		const interactingAnimals = aliveAnimals.filter((a) => isOverlapping(a.pos, a.size, ee.pos, ee.size));
		return getNearest(interactingAnimals, nearestPos);
	}

	feedNearest(nearestPos = this.pos, feedWhat = this.getEquippedItem()) {
		const nearestAnimal = this.findNearestAnimal(nearestPos);
		if (!nearestAnimal || !feedWhat.quantity) { playSound('dud', this.pos); return; }
		this.consume(feedWhat, true);
		nearestAnimal.health += 1;
		nearestAnimal.estrousTimer.set(10);
		playSound('craft', this.pos);
	}

	craft(craftWhat) {
		const equippedItem = this.getEquippedItem();
		if (craftWhat === 'wine') {
			if (equippedItem.name !== 'Blood' || equippedItem.quantity < 9) {
				playSound('dud', this.pos);
				return;
			}
			equippedItem.quantity -= 9;
			award(3);
			this.world.makeItem('Blood wine', this.pos, 2);
			playSound('craft');
		} else if (craftWhat === 'meal') {
			if (equippedItem.name !== 'Meat' || equippedItem.quantity < 13) {
				playSound('dud', this.pos);
				return;
			}
			equippedItem.quantity -= 13;
			this.world.makeItem('Meal', this.pos, 2);
			playSound('craft', this.pos);
		}
	}

	build() {
		const w = this.world;
		const where = this.getActionTilePos();
		const currentGround = w.getGroundFromWorld(where);
		const isBuilding = (currentGround.tileIndex !== 29);
		if (isBuilding) {
			const bricks = this.findInventoryItem('Stone');
			if (!this.consume(bricks, true)) { playSound('dud'); return; }
		}
		playSound('attack');
		if (!isBuilding) w.makeItem('Stone', where, 1);
		w.setGroundFromWorld(
			where,
			// ground:
			(isBuilding) ? { tileIndex: 29, blocked: true } : { tileIndex: 4, blocked: false },
		);
	}

	mine() {
		const where = this.getActionTilePos();
		// TODO: get mining power of equipped item
		this.world.action('mine', where, 1, this);
	}

	chop() {
		const where = this.getActionTilePos();
		// TODO: get choping power of equipped item
		this.world.action('chop', where, 1, this);
	}

	consume(item, quiet) { // mutates item
		if (!item || item.quantity <= 0) return 0;
		item.quantity -= 1; // eslint-disable-line no-param-reassign
		if (item.youth) {
			this.health += 1;
			this.age = Math.round(Math.max(
				1,
				this.age - (item.youth || 0) - (this.age / 10),
			));
		}
		this.reEquip();
		if (item.name === 'Meal') award(6);
		if (!quiet) playSound('consume', this.pos);
		return 1;
	}

	lunge() {
		if (this.lungeTimer.active()) return;
		this.lungeTimer.set(1);
		this.velocity = this.velocity.add(vec2().setAngle(this.facing, .5));
	}

	getActionTilePos() {
		if (!this.equippedEntity) return null;
		return this.world.worldPosToTilePos(
			this.equippedEntity.pos.add(vec2().setAngle(this.facing, 0.7)),
		).add(vec2(.5, .5));
	}

	action(targetPos) {
		if (this.actionTimer.active()) return;
		const item = this.getEquippedItem();
		this.actionTimer.set(.25);
		if (!item) return; // this.pickupNearby();
		if (item.lunge) this.lunge(item.lunge);
		if (item.damaging) return this.attack(); // eslint-disable-line consistent-return
		if (item.bait) return this.feedNearest(targetPos); // eslint-disable-line consistent-return
		if (item.name === 'Blood') this.craft('wine');
		if (item.name === 'Meat') this.craft('meal');
		if (item.build) this.build();
		else if (item.mine) this.mine();
		else if (item.chop) this.chop();
		else if (item.consumable) this.consume(item);
	}

	plan() {
		if (this.planTimer.active()) return;
		this.planTimer.set(rand(2, 20));
		const tooFar = this.pos.distance(this.world.center) > (this.world.size.x / 3);
		const base = tooFar ? this.world.center : this.pos;
		this.walkTarget = base.add(vec2(rand(-10, 10), rand(-10, 10)));
		this.urgency = rand(1);
	}

	look() {
		if (this.lookTimer.active()) return;
		const fear = this.lookScary();
		if (this.estrousTimer.active()) this.lookMate();
		else if (!fear) this.lookFood();
	}

	lookScary() {
		if (!this.timid) return 0;
		const scaryEnt = this.world.animals.find((a) => a.scary && !a.isDead() && !a.hasBaitEquipped() && a !== this);
		if (!scaryEnt) return 0;
		const dist = scaryEnt.pos.distance(this.pos);
		if (dist > this.lookRange) return 0; // player is out of sight/smell
		const FEAR_DIST = 6;
		const fear = dist < FEAR_DIST;
		this.lookTimer.set(fear ? .5 : rand(.5, 2));
		this.fearTimer.set(1);
		if (fear) {
			const away = this.pos.subtract(scaryEnt.pos).normalize(FEAR_DIST + 1);
			this.goTo(this.pos.add(away));
		}
		return fear;
	}

	goTo(pos = null, unplan) {
		if (unplan) this.planTimer.set(60);
		this.walkTarget = pos;
		this.urgency = 1;
	}

	lookFood() {
		if (!this.followsBait) return;
		const pc = this.findPc();
		if (!pc) return;
		const dist = pc.pos.distance(this.pos);
		const LOOK_FOOD_DIST = 4;
		if (dist > this.lookRange || dist > LOOK_FOOD_DIST) return; // player is out of sight/smell
		const item = pc.getEquippedItem();
		if (!item) return; // player is not holding food
		if (pc.hasBaitEquipped() && pc.equippedEntity) {
			this.walkTarget = pc.equippedEntity.pos.add(vec2().setAngle(rand(2 * PI), rand(1, 2)));
		}
	}

	lookMate() {
		if (!this.estrousTimer.active()) return;
		this.lookTimer.set(1);
		const mates = this.world.animals.filter((a) => !a.isDead() && a.estrousTimer.active() && a !== this);
		// console.log(mates);
		if (!mates.length) return;
		const nearestMate = getNearest(mates, this.pos);
		// console.log(nearestMate);
		if (!nearestMate) return;
		// TODO: don't do the mating in the looking?
		if (isOverlapping(nearestMate.pos, nearestMate.size, this.pos, this.size)) this.mate(nearestMate);
		else this.walkTarget = nearestMate.pos;
	}

	mate(mate) {
		this.lookTimer.set(5);
		mate.estrousTimer.unset();
		this.estrousTimer.unset();
		award(4);
		this.world.makeAnimal(this.pos, [this.species, mate.species]);
	}

	getOlder() {
		if (this.agingTimer.active()) return false;
		// @ 6 sec/year --> 10 minutes IRL = 600 sec IRL = 100 years
		// @ 3 sec/year --> 5 minutes IRL = 100 years
		this.agingTimer.set(4);
		this.age += 0; // 1; // Aging is currently disabled
		if (this.isOld()) this.damage(1, this);
		return true;
	}

	isOld() { return this.age > this.oldAge; }

	live() { // "update" logic that happens when alive
		if (this.isDead()) return;
		const moveInput = this.moveInput.copy();
		const isMoveInput = (moveInput.x || moveInput.y);
		if (isMoveInput) this.goTo(null, true); // "un-plan"
		this.look();
		this.plan();

		// Movement
		// Get the movement velocity direction, and the acceleration
		// Base vel and acceleration is based on slowing down
		let accel = -.04;
		let newMoveVel = this.movementVelocity.copy();
		if (isMoveInput) { // Player-input based movement
			if (!this.walkSoundTimer.active()) {
				playSound('walk', this.pos);
				this.walkSoundTimer.set(.21);
			}
			newMoveVel = moveInput; // gets direction
			accel = .03;
		} else if (this.walkTarget) { // "AI" target based movement
			const dist = this.pos.distance(this.walkTarget);
			newMoveVel = this.walkTarget.subtract(this.pos);
			accel = (dist < 3) ? -.03 : .03;
		}
		// Determine the speed the creature should be moving based on ramping up, urgency, and max speed
		this.speedRamp = Math.min(1, Math.max(0, this.speedRamp + accel));
		const moveSpd = this.maxSpeed * this.urgency * (1 - this.getEquippedWeight()) * this.speedRamp;
		newMoveVel = newMoveVel.normalize(moveSpd).clampLength(this.maxSpeed);
		// this.movementVelocity = this.movementVelocity.normalize(moveSpd).clampLength(this.maxSpeed);
		this.movementVelocity = this.movementVelocity.lerp(newMoveVel, .08);
		// Only use movement velocity if you're currently moving slower
		// If we're moving faster, we might have been pushed, boosted, or something else - and that shouldn't constrain velocity
		const vx = this.velocity.x;
		const vy = this.velocity.y;
		this.velocity = vec2(
			(vx > moveSpd || vx < -moveSpd) ? vx : this.movementVelocity.x,
			(vy > moveSpd || vy < -moveSpd) ? vy : this.movementVelocity.y,
		);
		// this.velocity = this.velocity.lerp(this.movementVelocity, .1);

		const speed = this.velocity.length();
		// TODO: clean this up - redundant?
		this.walkTick += this.movementVelocity.length() * 3.5;
		this.walkTick = this.walkTick % 10000;
		this.walkCyclePercent += speed * .5;
		this.walkCyclePercent = speed > .01 ? mod(this.walkCyclePercent) : 0;
		// Facing
		if (speed !== 0) this.facing = this.velocity.angle();

		// Aging
		this.getOlder();
	}

	update() {
		this.updateEmotion();
		this.live();
		this.clot();
		// TODO: Always apply friction?
		const friction = vec2(.9999);
		if (this.moveInput.x === 0) friction.x = 0.9;
		if (this.moveInput.y === 0) friction.y = 0.9;
		this.velocity = this.velocity.multiply(friction);
		// call parent and update physics
		super.update();
	}

	render() {
		// Render reticle
		const ee = this.equippedEntity;
		if (ee && ee.reticle) {
			drawRect(
				this.getActionTilePos(),
				ee.size,
				nc(.5, 1, 1, .2),
			);
		}
		// Render body
		const bodyPos = this.pos.add(vec2(0, .05 * Math.sin(this.walkCyclePercent * PI)));
		// const color = this.color.add(this.additiveColor).clamp();
		[[1, .2], [.9, .1]].forEach((ca) => {
			drawRect(bodyPos.add(vec2(0, -this.size.y * .75)), vec2(this.size.x * ca[0], ca[1]), nc(0, 0, 0, .1), this.angle);
		});
		// drawRect(bodyPos.add(vec2(0, -this.size.y * .75)), vec2(this.size.x * .9, .1), nc(0,0,0, .1), this.angle);
		drawSpecies(getMainContext(), drawCanvas2D, bodyPos, this.species, this.direction, this.walkTick);
		// drawRect(bodyPos, this.size.scale(this.drawScale), nc(.3, .3, .3, .4), this.angle);
	}

	// renderOld() {
	//     // drawRect(bodyPos.add(vec2(0, .5)), this.head.scale(this.drawScale), color, this.angle);
	//     drawRect(bodyPos.add(vec2(0, 0)), this.body, color, this.angle);
	//     drawRect(bodyPos.add(vec2(0, .3)), this.head, color, this.angle);
	//     this.legs.forEach((leg, li) => {
	//         // console.log(this.walkCyclePercent);s
	//         // TODO: Fix this walking animation
	//         const liftPercent = Math.sin((this.walkCyclePercent + (.1 * li)) * PI);
	//         const lift = vec2(0, .2 * liftPercent);
	//         leg.forEach((legSegment, i) => {
	//             if (!i) return; // skip first point
	//             drawLine(
	//                 bodyPos.add(leg[i - 1]).add(lift),
	//                 bodyPos.add(legSegment).add(lift),
	//                 .1,
	//                 color,
	//             );
	//         });
	//     });
	//     // Eyes
	//     drawRect(bodyPos.add(vec2(-.1, .3)), vec2(.1), nc(0, 0, 0));
	//     drawRect(bodyPos.add(vec2(.1, .3)), vec2(.1), nc(0, 0, 0));
	//     drawRect(bodyPos, vec2(.05, .2), nc(1, 1, 0, .5), this.facing); // Center dot
	// }
}

export default CharacterEntity;
