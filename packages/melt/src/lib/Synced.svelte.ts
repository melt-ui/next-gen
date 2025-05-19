import type { MaybeGetter } from "./types";
import { extract } from "./utils/extract";
import { isFunction } from "./utils/is";

type EqualityCheck<T> = boolean | ((prev: T, next: T) => boolean);

type SyncedArgsBase<T> = {
	onChange?: (value: T) => void;
	/**
	 * Optional equality check function. If this is set to true,
	 * the `===` operator will be used.
	 *
	 * If it's a function and returns true, no changes will occur.
	 */
	equalityCheck?: EqualityCheck<T>;
};

type SyncedArgs<T> = SyncedArgsBase<T> &
	(
		| { value: MaybeGetter<T>; defaultValue?: never }
		| { value: MaybeGetter<T | undefined>; defaultValue: T }
	);

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
	#equalityCheck?: EqualityCheck<T>;

	constructor({ value, onChange, ...args }: SyncedArgs<T>) {
		this.#valueArg = value;
		this.#onChange = onChange;
		this.#defaultValue = "defaultValue" in args ? args?.defaultValue : undefined;
		this.#equalityCheck = args.equalityCheck;
		this.#internalValue = extract(value, this.#defaultValue) as T;
	}

	get current() {
		return isFunction(this.#valueArg)
			? this.#valueArg() ?? this.#defaultValue ?? this.#internalValue
			: this.#internalValue;
	}

	set current(value: T) {
		if (this.#equalityCheck === true && this.current === value) return;
		if (isFunction(this.#equalityCheck)) {
			if (this.#equalityCheck(this.current, value)) return;
		}

		if (isFunction(this.#valueArg)) {
			this.#onChange?.(value);
			return;
		}

		this.#internalValue = value;
		this.#onChange?.(value);
	}
}
