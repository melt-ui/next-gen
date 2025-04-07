import type { IterableProp, MaybeGetter } from "$lib";
import { SvelteSet } from "svelte/reactivity";
import { extract } from "./extract";
import { first, forEach, last } from "./iterator";
import { isFunction, isIterable, isSvelteSet } from "./is";
import { watch } from "runed";
import { dequal } from "dequal";

/**
 * Internal type for the multiple flag constraint
 * @internal
 */
type _multiple_extends = boolean;

/**
 * Internal type for the default multiple flag value
 * @internal
 */
type _multiple_default = false;

/**
 * Represents the value type for selection state
 * @template T - The type of values that can be selected
 * @template Multiple - Boolean flag indicating if multiple selection is enabled
 */
export type SelectionStateValue<T, Multiple extends _multiple_extends> = Multiple extends true
	? SvelteSet<T>
	: T | undefined;

/**
 * Represents a value or getter for selection state
 * @template T - The type of values that can be selected
 * @template Multiple - Boolean flag indicating if multiple selection is enabled
 */
export type MaybeMultiple<T, Multiple extends _multiple_extends> = Multiple extends true
	? IterableProp<T>
	: MaybeGetter<T | undefined>;

/**
 * Callback type for selection changes
 * @template T - The type of values that can be selected
 * @template Multiple - Boolean flag indicating if multiple selection is enabled
 */
export type OnMultipleChange<T, Multiple extends _multiple_extends> = (
	value: SelectionStateValue<T, Multiple>,
) => void;

/**
 * Configuration props for SelectionState
 * @template T - The type of values that can be selected
 * @template Multiple - Boolean flag indicating if multiple selection is enabled
 */
type SelectionStateProps<T, Multiple extends _multiple_extends> = {
	value?: MaybeMultiple<T, Multiple>;
	onChange?: OnMultipleChange<T, Multiple>;
	multiple?: MaybeGetter<Multiple | undefined>;
};

/**
 * Converts a value or iterable to a SvelteSet
 * @template T - The type of values in the set
 * @param v - The value or iterable to convert
 * @returns A new SvelteSet containing the value(s)
 * @internal
 */
function toSet<T>(v: Iterable<T> | T | undefined): SvelteSet<T> {
	if (v === undefined) return new SvelteSet();
	if (isSvelteSet(v)) return v as SvelteSet<T>;
	if (!isIterable(v)) return new SvelteSet([v]);
	return new SvelteSet(v);
}

/**
 * Extracts a single value from a value or iterable
 * @template T - The type of the value
 * @param v - The value or iterable to extract from
 * @returns The single value or undefined
 * @internal
 */
function toSingle<T>(v: Iterable<T> | T | undefined): T | undefined {
	if (!isIterable(v) || v === undefined) return v;
	return last(v);
}

/**
 * Manages selection state with support for single or multiple selection
 * @template T - The type of values that can be selected (defaults to string)
 * @template Multiple - Boolean flag indicating if multiple selection is enabled (defaults to false)
 *
 * @example
 * ```ts
 * // Single string selection
 * const singleSelect = new SelectionState<string>();
 *
 * // Multiple string selection
 * const multiSelect = new SelectionState<string, true>({ multiple: true });
 *
 * // Custom type selection
 * interface User { id: number; name: string }
 * const userSelect = new SelectionState<User>();
 * ```
 */
export class SelectionState<T, Multiple extends _multiple_extends = _multiple_default> {
	#props!: SelectionStateProps<T, Multiple>;
	#internal_set = new SvelteSet<T>();

	isControlled = $derived(isSvelteSet(this.#props.value) || isFunction(this.#props.value));
	isMultiple = $derived(extract<boolean | undefined>(this.#props.multiple, false)) as Multiple;

	constructor(props: SelectionStateProps<T, Multiple>) {
		this.#props = props;

		if (this.isControlled) return;

		if (!isIterable(props.value) && props.value !== undefined) {
			this.#internal_set.add(props.value as T);
		} else if (isIterable(props.value)) {
			forEach(props.value, (v) => this.#internal_set.add(v as T));
		}

		watch(
			() => this.isMultiple,
			(isMultiple) => {
				if (isMultiple) return;
				const curr = this.current;
				this.#internal_set.clear();
				if (curr === undefined) return;
				this.#internal_set.add(curr as T);
			},
			{
				lazy: true,
			},
		);
	}

	/**
	 * Gets the current selection value(s)
	 * @returns For multiple selection, returns a SvelteSet of values. For single selection, returns a single value or undefined.
	 */
	get current(): SelectionStateValue<T, Multiple> {
		let value: T | Iterable<T> | undefined;

		if (isFunction(this.#props.value)) {
			value = this.#props.value() as T | Iterable<T> | undefined;
		} else if (isSvelteSet(this.#props.value)) {
			value = this.#props.value as SvelteSet<T>;
		} else {
			value = this.#internal_set;
		}

		if (this.isMultiple) {
			return toSet<T>(value) as SelectionStateValue<T, Multiple>;
		}
		return toSingle<T>(value) as SelectionStateValue<T, Multiple>;
	}

	/**
	 * Sets the current selection value(s)
	 * @param value - The new selection value(s)
	 */
	set current(value: SelectionStateValue<T, Multiple>) {
		this.onChange(value);
		if (this.isControlled) return;

		this.#internal_set.clear();
		if (isSvelteSet(value)) {
			value.forEach((v) => this.#internal_set.add(v as T));
		} else if (value !== undefined) {
			this.#internal_set.add(value as T);
		}
	}

	/**
	 * Manipulates the selection set through a callback
	 * @param cb - Callback function that receives the selection set for manipulation
	 * @internal
	 */
	manipulate(cb: (set: SvelteSet<T>) => void) {
		const set = this.isControlled ? toSet<T>(this.current as T | Iterable<T>) : this.#internal_set;
		const prevValue = $state.snapshot(this.isMultiple ? set : toSingle<T>(set));
		cb(set);

		const newValue = this.isMultiple ? set : toSingle<T>(set);
		if (dequal(prevValue, $state.snapshot(newValue))) return;
		this.onChange(newValue as SelectionStateValue<T, Multiple>);
	}

	/**
	 * Triggers the onChange callback with the current selection
	 * @param value - The current selection value(s)
	 * @internal
	 */
	onChange(value: SelectionStateValue<T, Multiple>) {
		if (!this.#props.onChange) return;
		this.#props.onChange(value);
	}

	/**
	 * Checks if an item is currently selected
	 * @param item - The item to check
	 * @returns True if the item is selected, false otherwise
	 */
	has(item: T) {
		return toSet<T>(this.current as T | Iterable<T>).has(item);
	}

	/**
	 * Adds an item to the selection
	 * For single selection, this replaces the current selection
	 * For multiple selection, this adds to the current selection
	 * @param value - The item to add
	 */
	add(value: T) {
		this.manipulate((set) => {
			if (!this.isMultiple) {
				set.clear();
			}
			set.add(value);
		});
	}

	/**
	 * Adds multiple items to the selection
	 * For single selection, only the first item is selected
	 * For multiple selection, all items are added to the selection
	 * @param items - The items to add
	 */
	addAll(items: Iterable<T>) {
		this.manipulate((set) => {
			if (!this.isMultiple) {
				set.clear();
				set.add(first(items)!);
			} else {
				forEach(items, (i) => set.add(i));
			}
		});
	}

	/**
	 * Removes an item from the selection
	 * @param value - The item to remove
	 */
	delete(value: T) {
		this.manipulate((set) => {
			set.delete(value);
		});
	}

	/**
	 * Removes multiple items from the selection
	 * @param items - The items to remove
	 */
	deleteAll(items: Iterable<T>) {
		this.manipulate((set) => forEach(items, set.delete));
	}

	/**
	 * Clears all selections
	 */
	clear() {
		this.manipulate((set) => set.clear());
	}

	/**
	 * Gets the number of selected items
	 * @returns The number of selected items
	 */
	size() {
		return toSet(this.current).size;
	}

	/**
	 * Toggles the selection state of an item
	 * If the item is selected, it will be deselected
	 * If the item is not selected, it will be selected
	 * @param item - The item to toggle
	 */
	toggle(item: T) {
		this.manipulate((set) => {
			if (set.has(item)) {
				set.delete(item);
			} else {
				if (!this.isMultiple) set.clear();
				set.add(item);
			}
		});
	}

	/**
	 * Converts the current selection to a SvelteSet
	 * @returns A SvelteSet containing the current selection
	 */
	toSet() {
		return toSet<T>(this.current as T | Iterable<T>);
	}

	/**
	 * Converts the current selection to an array
	 * @returns An array containing the current selection
	 */
	toArray() {
		return Array.from(this.toSet());
	}
}
