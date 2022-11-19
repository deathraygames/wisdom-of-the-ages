const { PI } = Math;
const itemTypes = [
	{ name: 'Meat', tileIndex: 7, quantity: 1, stack: 64, emoji: '🍖' },
	{ name: 'Blood', tileIndex: 6, quantity: 1, stack: 64, emoji: '🩸' },
	{ name: 'Butcher knife', type: 'w', tileIndex: 5, quantity: 1, stack: 8, damaging: 1, lunge: 1, emoji: '🔪' },
	{ name: 'Herb', tileIndex: 8, quantity: 1, stack: 64, bait: 1, emoji: '🌿', angleOffset: -.6, holdAngleOffset: PI / 2 },
	{ name: 'Blood wine', tileIndex: 13, quantity: 1, stack: 64, youth: 10, consumable: 1, emoji: '🍷' },
	{ name: 'Meal', tileIndex: 14, quantity: 1, stack: 8, youth: 1, consumable: 1, emoji: '🍲' },
	{ name: 'Hammer', tileIndex: 17, quantity: 1, stack: 8, build: 1, weight: .5, reticle: 1, emoji: '🔨', holdAngleOffset: PI },
	{ name: 'Pickaxe', tileIndex: 15, quantity: 1, stack: 8, mine: 1, weight: .5, reticle: 1, emoji: '⛏️', holdAngleOffset: PI },
	{ name: 'Axe', tileIndex: 16, quantity: 1, stack: 8, chop: 1, weight: .5, reticle: 1, emoji: '🪓', holdAngleOffset: PI },
	{ name: 'Stone', tileIndex: 19, quantity: 1, stack: 64, emoji: '🧱' },
	{ name: 'Wood', tileIndex: 20, quantity: 1, stack: 12, emoji: '🌳' },
];

export default itemTypes;
