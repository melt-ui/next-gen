import { computed, ref, watchEffect } from 'vue';
import { type Context, type State } from './index.js';

export class VueContext implements Context {
	state<T>(initial: T) {
		return ref(initial) as State<T>;
	}

	computed<T>(cb: () => T) {
		const v = computed(cb);
		return {
			get current() {
				return v.value;
			}
		};
	}

	effect(cb: () => void) {
		watchEffect(cb);
	}
}
