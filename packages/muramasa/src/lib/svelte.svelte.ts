import { type Context } from './index.js';

export class SvelteContext implements Context {
	state<T>(initial: T) {
		let v = $state(initial);
		return {
			get value() {
				return v;
			},
			set value(value: T) {
				v = value;
			}
		};
	}

	computed<T>(cb: () => T) {
		const v = $derived.by(cb);
		return {
			get current() {
				return v;
			}
		};
	}

	effect(cb: () => void) {
		$effect(cb);
	}
}
