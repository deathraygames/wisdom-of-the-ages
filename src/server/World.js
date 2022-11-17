import {
	vec2, PI, randInt, rand,
	setGravity,
	setCameraPos, initTileCollision, TileLayer, TileLayerData, setTileCollisionData,
} from '../little-engine-esm/little-engine-esm-build.all.js';
import PlayerCharacterEntity from '../PlayerCharacterEntity.js';
import AnimalEntity from '../AnimalEntity.js';
import ItemEntity from '../ItemEntity.js';
import SpiritEntity from '../SpiritEntity.js';
import Chunk from './Chunk.js';
import itemTypes from '../itemTypes.js';

const WORLD_SIZE = 200;

class World {
	constructor() {
		this.size = vec2(WORLD_SIZE, WORLD_SIZE);
		this.center = this.size.scale(.5);
		// this.blocks = [];
		this.items = [];
		this.animals = [];
		this.spirits = [];
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

	getItemType(name) { // eslint-disable-line
		return itemTypes.find((i) => i.name === name);
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

	setGround(tilePos, ground = {}) {
		this.getChunk().customizeGround(tilePos, ground);
		this.setGroundTile(tilePos, ground, true);
	}

	setGroundFromWorld(worldPos, ground) {
		const tilePos = this.worldPosToTilePos(worldPos);
		this.groundTileLayer.redrawStart();
		this.setGround(tilePos, ground);
		this.groundTileLayer.redrawEnd();
	}

	setGroundTile(tilePos, ground = {}, redraw = false) {
		const {
			tileIndex,
			color,
			blocked = false,
			directions = 4,
			mirrors = 2,
		} = ground;
		// this.getChunk().customizeGround(tilePos, ground);
		// console.log(arguments, worldPos, tilePos, this.getChunk());
		if (blocked) setTileCollisionData(tilePos, 1);
		else if (redraw) setTileCollisionData(tilePos, 0);
		const data = new TileLayerData(
			tileIndex,
			randInt(directions), // direction 0-3
			randInt(mirrors), // mirror 0-1
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
		this.makeItem('Axe', getNear(12));
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

		// engine settings
		setGravity(0);
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
