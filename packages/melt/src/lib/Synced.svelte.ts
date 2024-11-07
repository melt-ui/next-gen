import type { MaybeGetter } from "./types.js";
import { extract } from "./utils/extract.svelte.js";
import { isFunction } from "./utils/is.js";

type SyncedArgs<T> =
	| {
			value: MaybeGetter<T>;
			onChange?: (value: T) => void;
	  }
	| {
			value: MaybeGetter<T | undefined>;
			onChange?: (value: T) => void;
			defaultValue: T;
	  };

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

	#valueArg: SyncedArgs<T>["value"];
	#onChange?: SyncedArgs<T>["onChange"];
	#defaultValue?: T;

	constructor({ value, onChange, ...args }: SyncedArgs<T>) {
		this.#valueArg = value;
		this.#onChange = onChange;
		this.#defaultValue = "defaultValue" in args ? args?.defaultValue : undefined;
		this.#internalValue = extract(value, this.#defaultValue) as T;
	}

	get current() {
		return isFunction(this.#valueArg)
			? this.#valueArg() ?? this.#defaultValue ?? this.#internalValue
			: this.#internalValue;
	}

	set current(value: T) {
		this.#onChange?.(value);
		if (isFunction(this.#valueArg)) return;
		this.#internalValue = value;
	}
}
