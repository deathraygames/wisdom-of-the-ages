import {
	vec2,
	getMousePos, mouseIsDown, keyWasPressed, keyIsDown,
	gamepadIsDown, getUsingGamepad, gamepadStick,
} from '../little-engine-esm/little-engine-esm-build.all.js';
import AnimationLoop from './AnimationLoop.js';
import ServerCommunicator from './ServerCommunicator.js';
import BrowserServer from '../BrowserServer.js';

const client = {
	receive(message, where, amount = 0) {
		console.log('Client received message', message);
		if (message === 'block destroyed') {
			// TODO: display a particle effect
		} else if (message === 'block hit') {
			// TODO: display a particle effect
		}
	},
};

const server = new BrowserServer({ client });
const comm = new ServerCommunicator({ server });

const send = (...args) => comm.send(...args);

let lastMoveInput = false;

const uiState = 'play';

function handlePlayInputs() {
	const mousePos = getMousePos();
	if (mouseIsDown(2)) send('pc', 'goTo', mousePos, true); // right click movement

	const numKeyCodes = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57];
	numKeyCodes.forEach((n) => {
		if (keyWasPressed(n)) send('pc', 'toggleEquip', n - 48);
	});

	// "Q" or "Z" key
	if (keyIsDown(81) || keyIsDown(90) || gamepadIsDown(1)) send('pc', 'throwEquipped');

	// "E" or "X" key
	if (keyIsDown(69) || keyIsDown(88) || mouseIsDown(0) || gamepadIsDown(0)) send('pc', 'action', mousePos);

	// movement control
	const moveInput = getUsingGamepad()
		? gamepadStick(0) : vec2(keyIsDown(39) - keyIsDown(37), keyIsDown(38) - keyIsDown(40));
	const haveMoveInput = (moveInput.x !== 0 || moveInput.y !== 0);
	if (haveMoveInput || lastMoveInput) {
		send('pc', 'move', moveInput);
		lastMoveInput = haveMoveInput;
	}

	if (moveInput && (moveInput.x || moveInput.y)) {
		send('game', 'award', 0);
	}
}

const loop = new AnimationLoop((/* lastTimeDeltaMs, t, nowTime, tick */) => {
	// console.log(lastTimeDeltaMs, t, nowTime, tick);
	if (uiState === 'play') handlePlayInputs();
});
loop.start();

export default client;
