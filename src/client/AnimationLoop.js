const NOOP = () => {};

class AnimationLoop {
	constructor(loopFn = NOOP) {
		this.nowTime = null;
		this.lastTimeDeltaSeconds = null;
		this.lastTimeDeltaMs = null;
		this.loop = loopFn;
		this.tick = 0;
		this.on = false;
		this.win = window;
	}

	init(loopFn = NOOP) {
		this.loop = loopFn;
	}

	animate() {
		if (!this.on) return;
		const lastTimeNow = this.nowTime;
		this.nowTime = performance.now();
		this.lastTimeDeltaMs = (lastTimeNow) ? this.nowTime - lastTimeNow : 0.000001;
		this.lastTimeDeltaSeconds = this.lastTimeDeltaMs / 1000; // Convert from ms to seconds
		this.tick += 1;
		if (this.tick > 999999) this.tick = 0;

		this.loop(this.lastTimeDeltaMs, this.lastTimeDeltaSeconds, this.nowTime, this.tick);

		this.win.requestAnimationFrame(() => this.animate());
	}

	start() {
		this.on = true;
		this.animate();
	}

	stop() {
		this.on = false;
	}
}

export default AnimationLoop;
