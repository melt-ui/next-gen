import { untrack } from "svelte";

type RafCallbackParams = {
	/** The number of milliseconds since the last frame. */
	delta: number;
	/**
	 * Time elapsed since the creation of the web page.
	 * See {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp#the_time_origin Time origin}.
	 */
	timestamp: DOMHighResTimeStamp;
};

/**
 * Wrapper over {@link https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame requestAnimationFrame},
 * with controls for pausing and resuming the animation, reactive tracking and optional limiting of fps, and utilities.
 */
export class AnimationFrames {
	#callback: (params: RafCallbackParams) => void;
	#previousTimestamp: number | null = null;
	frame: number | null = null;
	#fps = $state(0);
	#running = $state(false);

	constructor(callback: (params: RafCallbackParams) => void) {
		this.#callback = callback;

		this.start = this.start.bind(this);
		this.stop = this.stop.bind(this);
		this.toggle = this.toggle.bind(this);

		this.start();
	}

	#loop(timestamp: DOMHighResTimeStamp): void {
		if (!this.#running) return;

		if (this.#previousTimestamp === null) {
			this.#previousTimestamp = timestamp;
		}

		const delta = timestamp - this.#previousTimestamp;
		const fps = 1000 / delta;

		this.#fps = fps;
		this.#previousTimestamp = timestamp;
		this.#callback({ delta, timestamp });
		this.frame = window.requestAnimationFrame(this.#loop.bind(this));
	}

	start(): void {
		if (this.#running) return;
		this.#running = true;
		this.#previousTimestamp = null;
		this.frame = window.requestAnimationFrame(this.#loop.bind(this));
	}

	stop(): void {
		if (!this.#running) return;
		this.#running = false;
		if (this.frame) window.cancelAnimationFrame(this.frame);
		this.frame = null;
	}

	toggle(): void {
		this.#running ? this.stop() : this.start();
	}

	get fps(): number {
		return !this.#running ? 0 : this.#fps;
	}

	get running(): boolean {
		return this.#running;
	}
}
