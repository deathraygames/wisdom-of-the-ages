import { randInt, styleCanvas, tileImage, Color, drawTextScreen } from './little-engine-esm/little-engine-esm-build.all.js';

const MAX_TILES = 50;
const TILE_SIZE = window.TILE_SIZE || 16;
let ctx;
let tileCount = 0;
const ri = randInt;

function getTileX() {
	return TILE_SIZE * (++tileCount);
}

const rect = (r, g, b, x, y, q = TILE_SIZE, w = TILE_SIZE) => {
	ctx.fillStyle = `#${r}${g}${b}`;
	// (new Color(r, g, b)).toString();
	ctx.fillRect(x, y, q, w);
};

function drawTerrain(r, g, b) {
	const x = getTileX();
	const y = 0;
	rect(r, g, b, x, y);
	[3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1].forEach((n) => {
		rect(
			ri(r, 3),
			ri(g, 3),
			ri(b, 3),
			x + ri(TILE_SIZE - n),
			y + ri(TILE_SIZE - n),
			n,
			n,
		);
	});
	return x;
}

function drawTree(r = 0, g = 0, b = 0) {
	const x = drawTerrain(r, g, b);
	const y = 0;
	[10, 6, 3, 3, 3, 2, 2].forEach((n) => rect(
		ri(0, 4),
		ri(8, 9),
		ri(0, 4),
		x + ri(TILE_SIZE - n),
		y + ri(TILE_SIZE - n),
		n,
		n,
	));
}

function drawRockyTerrain(r, g, b) {
	const x = drawTerrain(r, g, b);
	const y = 0;
	[10, 6, 3, 3, 3, 2, 2].forEach((n) => rect(
		ri(6, 9),
		ri(6, 9),
		'a',
		x + ri(TILE_SIZE - n),
		y + ri(TILE_SIZE - n),
		n,
		n,
	));
}

function drawStoneWall() {
	const x = getTileX();
	const y = 0;
	rect(5, 5, 6, x, y);
	[8, 8, 8, 8, 8, 6, 6, 6, 6, 4].forEach((n) => rect(
		ri(8, 9),
		8,
		'a',
		x + ri(TILE_SIZE - n),
		y + ri(TILE_SIZE - (n / 2)),
		n,
		n / 2,
	));
}

function drawTiles(doc) {
	const canvas = doc.createElement('canvas');
	canvas.width = MAX_TILES * TILE_SIZE;
	canvas.height = 2 * TILE_SIZE;
	// doc.body.appendChild(canvas);
	ctx = canvas.getContext('2d');
	canvas.style = styleCanvas;
	ctx.drawImage(tileImage, 1000, 1000);
	// 0
	rect('f', 0, 0, 0, 0, 12, 12);
	rect('f', 'f', 0, 12, 12, 12, 12);
	drawTerrain(0, 0, 0); // 1
	drawTerrain(1, 1, 1); // 2
	drawTerrain(0, 1, 0); // 3
	drawTerrain(1, 1, 0); // 4
	ctx.fillStyle = '#fff';
	ctx.font = '14px serif';
	[ // Tile indices:
		'🔪', // 5
		'🩸', // 6
		'🍖', // 7
		'🌿', // 8
		'💕', // 9
		'❕', // 10
		'💢', // 11
		'💀', // 12
		'🍷', // 13
		'🍲', // 14
		'⛏️', // 15
		'🪓', // 16
		'🔨', // 17
		'🕯️', // 18
		'🧱', // 19
		'', // 20
		'', // 21
		'', // 22
		'', // 23
		'', // 24
	].forEach((emoji) => {
		ctx.fillText(emoji, getTileX() - 1, 14);
	});
	drawRockyTerrain(1, 1, 1); // 25
	drawRockyTerrain(0, 0, 0); // 26
	drawTerrain(0, 0, 0); // 27 -- Between 2 and 3
	drawTerrain(0, 1, 0); // 28 -- Between 3 and 4
	drawStoneWall(); // 29
	drawTree(); // 30
	drawTree(); // 31
	drawTree(); // 32
	drawTree(); // 33
	drawTree(); // 34
	// const x = getTileX();
	// rect(3, 3, 3, x, 0);
	// Tile incides 5, 6, 7, 8, 9
	// ctx.fillText('🔪🩸🍖🌿💕', x - 1, 19.5);
	// Test
	// ctx.fillText('🦀🍖🥩🍗💀🔪', 0, 44);
	// ctx.fillText('🔥', 0, 22);
	return canvas.toDataURL();
}

function loadTileImageSource(src) {
	return new Promise((resolve) => {
		const t = new Image(); // The tile image
		t.onload = () => resolve(drawTiles(document));
		if (src) t.src = src;
		else t.onload();
	});
}

export { loadTileImageSource }; // eslint-disable-line import/prefer-default-export
