import type { MaybeGetter } from "./types";
import { extract } from "./utils/extract.svelte";
import { isFunction } from "./utils/is";

/**
 * Setting `current` calls the `onChange` callback with the new value.
 *
 * If the value arg is static, it will be used as the default value,
 * and subsequent sets will set an internal state that gets read as `current`.
 *
 * Otherwise, if it is a getter, it will be called every time `current` is read,
 * and no internal state is used.
 */
export class Synced<T> {
	#internalValue = $state<T>() as T;

	#valueArg: MaybeGetter<T>;
	#onChange?: (value: T) => void;

	constructor(value: MaybeGetter<T>, onChange?: (value: T) => void) {
		this.#valueArg = value;
		this.#onChange = onChange;
		this.#internalValue = extract(value);
	}

	get current() {
		return isFunction(this.#valueArg) ? this.#valueArg() : this.#internalValue;
	}

	set current(value: T) {
		this.#onChange?.(value);
		if (isFunction(this.#valueArg)) return;
		this.#internalValue = value;
	}
}
