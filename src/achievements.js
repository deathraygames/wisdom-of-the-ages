import { playSound } from './sounds.js';

const achievements = [
	['Move (W,A,S,D or Arrows)'], // 0
	['Pick up and equip knife (#)'], // 1
	['Stab an animal'], // 2
	['Make forbidden wine (9 blood)'], // 3
	['Breed animals (with herbs)'], // 4
	['Collect 13 meat'], // 5
	['Eat a meaty, home-cooked meal'], // 6
];

function award(n) {
	const a = achievements[n];
	if (!a[1]) playSound('powerup');
	a[1] = (a[1] || 0) + 1;
}

achievements.award = award;

achievements.count = () => achievements.reduce((c, x) => c + (x[1] ? 1 : 0), 0);

export { achievements, award };
