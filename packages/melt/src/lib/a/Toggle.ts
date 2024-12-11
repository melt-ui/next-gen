import type { Toggle } from "$lib/components";
import type { MaybeGetter } from "$lib/types";
import { dataAttr, disabledAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createDataIds } from "$lib/utils/identifiers";
import { computed, isFunction, signal } from "@maverick-js/signals";

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
	#internalValue = signal<T>(undefined as T);

	#valueArg: SyncedArgs<T>["value"];
	#onChange?: SyncedArgs<T>["onChange"];
	#defaultValue?: T;

	constructor({ value, onChange, ...args }: SyncedArgs<T>) {
		this.#valueArg = value;
		this.#onChange = onChange;
		this.#defaultValue = "defaultValue" in args ? args?.defaultValue : undefined;
		this.#internalValue.set(extract(value, this.#defaultValue) as T);
	}

	get current() {
		return isFunction(this.#valueArg)
			? this.#valueArg() ?? this.#defaultValue ?? this.#internalValue()
			: this.#internalValue();
	}

	set current(value: T) {
		this.#onChange?.(value);
		if (isFunction(this.#valueArg)) return;
		this.#internalValue.set(value);
	}
}

const identifiers = createDataIds("toggle", ["trigger", "hidden-input"]);

export type ToggleProps = {
	/**
	 * The value for the Toggle.
	 *
	 * When passing a getter, it will be used as source of truth,
	 * meaning that the value only changes when the getter returns a new value.
	 *
	 * Otherwise, if passing a static value, it'll serve as the default value.
	 *
	 *
	 * @default false
	 */
	value?: MaybeGetter<boolean>;
	/**
	 * Called when the value is supposed to change.
	 */
	onValueChange?: (value: boolean) => void;

	/**
	 * If `true`, prevents the user from interacting with the input.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;
};

export function createToggle(props: ToggleProps = {}, toComputed: (...v: any[]) => any) {
	const disabled = toComputed(props.disabled, false);
	const value = new Synced({
		value: toComputed(props.value),
		onChange: props.onValueChange,
		defaultValue: false,
	});

	return {
		get value() {
			return value.current;
		},
		set value(v) {
			value.current = v;
		},
		get trigger() {
			return {
				[identifiers.trigger]: "",
				"data-checked": dataAttr(value.current),
				disabled: disabledAttr(disabled()),
				onclick: () => {
					if (disabled()) return;
					value.current = !value.current;
					console.log(value.current);
				},
			} as const;
		},
		/** The trigger that toggles the value. */
		/** A hidden input field to use within forms. */
		get hiddenInput() {
			return {
				[identifiers["hidden-input"]]: "",
				type: "hidden",
				value: value.current ? "on" : "off",
			} as const;
		},
	};
}
