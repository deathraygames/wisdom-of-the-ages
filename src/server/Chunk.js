import {
	// utilities
	vec2, randColor, randInt,
	// engine
	setRandSeed, randSeeded,
} from '../little-engine-esm/little-engine-esm-build.all.js';
import { getPseudoRand } from '../utils.js';
import { ROCK_BLOCK_TYPE, TREE_BLOCK_TYPE } from '../constants.js';

const TERRAIN_TILE_LOOKUP = [1, 2, 27, 3, 28, 4]; //  25, 26];
const TREE_TILES = [30, 31, 32, 33, 34];
const MAX_CHUNK_DNA = 999;
// const SEED = 1235;
const SEED = randInt(9999);

class Chunk {
	constructor(pos, world) {
		this.world = world;
		this.size = world.size.copy();
		this.center = this.size.scale(.5);
		this.key = Chunk.getKey(pos);
		this.pos = pos;
		this.seed = Math.round(100000 * getPseudoRand((10000 * pos.y + pos.x) + SEED));
		this.dna = this.generateDna();
		// A number of points to be used for the Voronoi diagram of tiles
		this.tileCellArray = this.generateTerrainTileCellArray();
		this.customizedGround = {};
	}

	static getKey(pos) { return `${pos.x},${pos.y}`; }

	generateDna() {
		const dna = [];
		setRandSeed(this.seed);
		for (let i = MAX_CHUNK_DNA; i--;) dna.push(randSeeded(0, 1));
		return dna;
	}

	getDnaValue(i) {
		return this.dna[i % MAX_CHUNK_DNA];
	}

	getDnaPosition(i) {
		return vec2(this.getDnaValue(i) * this.size.x, this.getDnaValue(i + 1) * this.size.y);
	}

	getDnaRand(i, a = 1, b = 0) {
		return b + (a - b) * this.getDnaValue(i);
	}

	getDnaInt(i, a = 1, b = 0) {
		return this.getDnaRand(i, a, b) | 0; // eslint-disable-line no-bitwise
	}

	generateTerrainTileCellArray() {
		const arr = [
			// put a point right in the center
			{ pos: vec2(this.size.x / 2, this.size.y / 2), terrainIndex: 0, weight: 1 },
		];
		for (let t = 200; t--;) {
			const i = t * 4;
			arr.push({
				pos: this.getDnaPosition(i),
				terrainIndex: this.getDnaInt(i + 3, TERRAIN_TILE_LOOKUP.length),
				weight: .2 + (this.getDnaValue(i + 4) * .8),
			});
		}
		return arr;
	}

	loopOver(callback) {
		const { x, y } = this.size;
		const pos = vec2(); // counter
		for (pos.x = x; pos.x--;) {
			for (pos.y = y; pos.y--;) {
				callback(pos, pos.x + (pos.y * x));
			}
		}
	}

	getNearestTerrain(pos) {
		let terrainIndex;
		this.tileCellArray.reduce((nearest, cell) => {
			const dist = cell.pos.distance(pos) * cell.weight;
			if (dist < nearest) {
				terrainIndex = cell.terrainIndex;
				return dist;
			}
			return nearest;
		}, Infinity);
		return terrainIndex;
	}

	getGround(pos) {
		// If the position has a custom ground, then use that
		const cg = this.customizedGround[Chunk.getKey(pos)];
		// ^ TODO: combine custom + procedural together in case there are missing properties?
		if (cg) return { ...cg };
		// Otherwise let's figure out the ground procedurally
		const posSeed = pos.x + pos.y * this.size.x;
		let i = Math.round(getPseudoRand(posSeed) * MAX_CHUNK_DNA);
		const r = this.getDnaValue(i);
		const terrainIndex = this.getNearestTerrain(pos);
		let tileIndex = TERRAIN_TILE_LOOKUP[terrainIndex]; // preferred tile index based on location
		const underTileIndex = tileIndex;
		const isRockyProne = tileIndex === 28;
		let blocked = r > (isRockyProne ? .970 : .991);
		const rock = blocked && (isRockyProne || pos.distance(this.center) > this.size.x / 3.5);
		const tree = blocked && !rock;
		let blockType = null;
		let blockHealth = 0;
		// if (r < .05) {
		// 	const treeIndex = this.getDnaInt(++i, 0, TREE_TILES.length);
		// 	tileIndex = TREE_TILES[treeIndex];
		// 	blocked = true;
		// } else 
		// if (r < .1) tileIndex = 1;
		// else 
		if (r < .2) tileIndex = tileIndex + this.getDnaInt(++i, -1, 1); // eslint-disable-line
		else if (r < .4) tileIndex = this.getDnaInt(++i, 1, 5);
		if (rock) {
			tileIndex = 25 + this.getDnaInt(++i, 2);
			blockType = ROCK_BLOCK_TYPE;
			blockHealth = 5;
		} else if (tree) {
			const treeIndex = this.getDnaInt(++i, 0, TREE_TILES.length);
			tileIndex = TREE_TILES[treeIndex];
			blockType = TREE_BLOCK_TYPE;
			blockHealth = 5;
		}
		// console.log('pos', pos.x, pos.y, tileIndex);
		const color = blocked && !rock ? randColor() : undefined;
		return {
			tileIndex,
			underTileIndex, // what tile is underneath (e.g., if blocked)
			color,
			blocked,
			blockType, // null if no block, or a block type constant
			blockHealth,
			directions: 4, // TODO: Change for trees
			mirrors: 2,
		};
	}

	customizeGround(pos, ground = {}) {
		this.customizedGround[Chunk.getKey(pos)] = ground;
	}
}

export default Chunk;
