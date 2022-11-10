import {
	vec2, PI, randInt, rand,
	setCameraPos, initTileCollision, TileLayer, TileLayerData, setTileCollisionData,
} from './little-engine-esm/little-engine-esm-build.all.js';
import PlayerCharacterEntity from './PlayerCharacterEntity.js';
import AnimalEntity from './AnimalEntity.js';
import ItemEntity from './ItemEntity.js';
import SpiritEntity from './SpiritEntity.js';
import Chunk from './Chunk.js';

const WORLD_SIZE = 200;

class World {
	constructor() {
		this.size = vec2(WORLD_SIZE, WORLD_SIZE);
		this.center = this.size.scale(.5);
		// this.blocks = [];
		this.items = [];
		this.animals = [];
		this.spirits = [];
		this.itemTypes = [
			{ name: 'Meat', tileIndex: 7, quantity: 1, stack: 64, emoji: '🍖' },
			{ name: 'Blood', tileIndex: 6, quantity: 1, stack: 64, emoji: '🩸' },
			{ name: 'Butcher knife', type: 'w', tileIndex: 5, quantity: 1, stack: 8, damaging: 1, lunge: 1, emoji: '🔪' },
			{ name: 'Herb', tileIndex: 8, quantity: 1, stack: 64, bait: 1, emoji: '🌿', angleOffset: -.6, holdAngleOffset: PI / 2 },
			{ name: 'Blood wine', tileIndex: 13, quantity: 1, stack: 64, youth: 10, consumable: 1, emoji: '🍷' },
			{ name: 'Meal', tileIndex: 14, quantity: 1, stack: 8, youth: 1, consumable: 1, emoji: '🍲' },
			{ name: 'Hammer', tileIndex: 17, quantity: 1, stack: 8, build: 1, weight: .5, reticle: 1, emoji: '🔨', holdAngleOffset: PI },
			{ name: 'Pickaxe', tileIndex: 15, quantity: 1, stack: 8, dig: 1, weight: .5, reticle: 1, emoji: '⛏️', holdAngleOffset: PI },
			{ name: 'Stone', tileIndex: 19, quantity: 1, stack: 64, emoji: '🧱' },
		];
		this.tiles = [];
		this.chunkPos = vec2();
		this.chunks = {};
		this.pc = 0;
		this.groundTileLayer = null;
	}

	makePc(pos = this.center.copy()) {
		this.pc = new PlayerCharacterEntity({ pos, world: this });
		this.animals.push(this.pc);
		return this.pc;
	}

	getItemType(name) {
		return this.itemTypes.find((i) => i.name === name);
	}

	getRandPos() {
		return vec2(rand(this.size.x), rand(this.size.y));
	}

	makeItem(itemTypeParam, posParam, dist = 0, n = 1) {
		const itemType = (typeof itemTypeParam === 'string') ? this.getItemType(itemTypeParam) : itemTypeParam;
		if (!itemType) console.error('Cannot make item', itemTypeParam);
		for (let i = n; i--;) {
			const pos = (dist)
				? posParam.add(vec2(rand(-dist, dist), rand(-dist, dist))) : posParam.copy();
			this.items.push(new ItemEntity({
				itemType,
				pos,
				health: 1,
				world: this,
				angle: (itemType.angleOffset || 0) + rand(-.2, .2),
			}));
		}
	}

	makeAnimal(pos, bioParents) {
		this.animals.push(new AnimalEntity({
			tileIndex: 0,
			pos,
			world: this,
			bioParents,
		}));
	}

	makeSpirit() {
		this.spirits.push(new SpiritEntity({
			pos: this.getRandPos(),
			world: this,
		}));
	}

	makeChunk() {
		const chunk = new Chunk(this.chunkPos, this);
		this.chunks[chunk.key] = chunk;
		return chunk;
	}

	getChunk() {
		const key = Chunk.getKey(this.chunkPos);
		return this.chunks[key] || this.makeChunk();
	}

	// TODO: could have a static equivalent
	worldPosToTilePos(worldPos) { // eslint-disable-line class-methods-use-this
		const conv = (n) => Math.floor(n);
		return vec2(conv(worldPos.x), conv(worldPos.y));
	}

	getGroundFromWorld(worldPos) {
		return this.getChunk().getGround(this.worldPosToTilePos(worldPos));
	}

	setGroundTileFromWorld(worldPos, ground) {
		const tilePos = this.worldPosToTilePos(worldPos);
		this.groundTileLayer.redrawStart();
		this.setGroundTile(tilePos, ground, true);
		this.groundTileLayer.redrawEnd();
	}

	setGroundTile(tilePos, ground = {}, redraw = false) {
		const { tileIndex, color, blocked } = ground;
		this.getChunk().customizeGround(tilePos, ground);
		// console.log(arguments, worldPos, tilePos, this.getChunk());
		if (blocked) setTileCollisionData(tilePos, 1);
		else if (redraw) setTileCollisionData(tilePos, 0);
		const data = new TileLayerData(
			tileIndex,
			randInt(4), // direction
			randInt(2), // mirror
			color,
		);
		this.groundTileLayer.setData(tilePos, data, redraw);
	}

	init() {
		// const { size, species, animals, items } = this;
		const { size } = this;
		// const pc = this.makePc();
		const chunk = this.getChunk();

		let i;
		// for(i = 100; i--;) { species.push(makeSpecies()) }
		for (i = 20; i--;) {
			// TODO: pick a random species
			for (let q = 2; q--;) {
				this.makeAnimal(vec2(rand(WORLD_SIZE), rand(WORLD_SIZE)));
			}
		}

		const getNear = (n) => this.center.add(vec2().setAngle(rand(2 * PI), n));
		this.makeItem('Butcher knife', getNear(9));
		this.makeItem('Pickaxe', getNear(34));
		this.makeItem('Hammer', getNear(35));
		[20, 21, WORLD_SIZE / 2, rand(20, WORLD_SIZE / 2)].forEach((n) => {
			this.makeItem('Herb', getNear(n));
		});
		this.makeSpirit();

		// create tile collision and visible tile layer
		initTileCollision(size.copy());
		this.groundTileLayer = new TileLayer(vec2(), size);
		const darknessTileLayer = new TileLayer(vec2(), size);
		// const charactersTileLayer = new TileLayer(vec2(), size);

		chunk.loopOver((pos) => {
			this.setGroundTile(pos, chunk.getGround(pos));
		});

		this.tiles = [this.groundTileLayer, darknessTileLayer];
		this.tiles.forEach((t) => t.redraw());
	}

	update() {
		// this.tiles[0].setData(pc.pos, pc.getTileData());
		const { pc } = this;
		if (pc) {
			let x;
			let y;
			if (pc.pos.x > this.size.x) x = 0;
			else if (pc.pos.x < 0) x = this.size.x;
			if (pc.pos.y > this.size.y) y = 0;
			else if (pc.pos.y < 0) y = this.size.y;
			if (x !== undefined) { pc.pos.x = x; setCameraPos(pc.pos); }
			if (y !== undefined) { pc.pos.y = y; setCameraPos(pc.pos); }
		}
	}
}

export default World;
