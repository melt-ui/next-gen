import type { MaybeGetter } from "$lib";
import { SvelteSet } from "svelte/reactivity";
import { extract } from "./extract";
import { first, forEach, last } from "./iterator";
import { isFunction, isIterable, isString, isSvelteSet } from "./is";

type _multiple_extends = boolean;
type _multiple_default = false;

type _value<Multiple extends _multiple_extends> = Multiple extends true
	? SvelteSet<string>
	: string | undefined;

export type MaybeMultiple<Multiple extends _multiple_extends> = Multiple extends true
	? SvelteSet<string> | MaybeGetter<Iterable<string> | undefined>
	: MaybeGetter<string | undefined>;

type _onChange<Multiple extends _multiple_extends> = Multiple extends true
	? ((value: SvelteSet<string>) => void) | undefined
	: ((value: string | undefined) => void) | undefined;

type _props<Multiple extends _multiple_extends> = {
	value?: MaybeMultiple<Multiple>;
	onChange?: _onChange<Multiple>;
	multiple?: MaybeGetter<Multiple | undefined>;
} & (Multiple extends true
	? { multiple: MaybeGetter<Multiple | undefined> }
	: Record<never, never>);

function toSet(v: Iterable<string> | string | undefined): SvelteSet<string> {
	if (isString(v)) return new SvelteSet([v]);
	if (isSvelteSet(v)) return v as SvelteSet<string>;
	return new SvelteSet(v);
}

function toSingle(v: Iterable<string> | string | undefined): string | undefined {
	if (isString(v) || v === undefined) return v;
	return last(v);
}

export class SelectionState<Multiple extends _multiple_extends = _multiple_default> {
	#props!: _props<Multiple>;
	#internal_set = new SvelteSet<string>();

	isControlled = $derived(isSvelteSet(this.#props.value) || isFunction(this.#props.value));
	isMultiple = $derived(
		extract<boolean | undefined, false>(this.#props.multiple, false),
	) as Multiple;

	constructor(props: _props<Multiple>) {
		this.#props = props;

		if (this.isControlled) return;

		if (typeof props.value === "string") {
			this.#internal_set.add(props.value);
		} else if (isIterable(props.value)) {
			forEach(props.value, (v: string) => this.#internal_set.add(v));
		}
	}

	get current(): _value<Multiple> {
		if (isFunction(this.#props.value)) {
			const v = this.#props.value();
			return (this.isMultiple ? toSet(v) : toSingle(v)) as _value<Multiple>;
		}

		if (isSvelteSet(this.#props.value)) {
			return (
				this.isMultiple ? this.#props.value : toSingle(this.#props.value)
			) as _value<Multiple>;
		}

		return (
			this.isMultiple ? this.#internal_set : toSingle(this.#internal_set)
		) as _value<Multiple>;
	}

	manipulate(cb: (set: SvelteSet<string>) => void) {
		const set = this.isControlled ? toSet(this.current) : this.#internal_set;
		//const { size } = set;
		cb(set);
		//if (size === set.size) return;
		this.onChange(this.isMultiple ? set : toSingle(set));
	}

	onChange(value: string | SvelteSet<string> | undefined) {
		if (!this.#props.onChange) return;
		const nv = this.isMultiple ? toSet(value) : toSingle(value);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.#props.onChange?.(nv as any);
	}

	set current(value: _value<Multiple>) {
		this.onChange(value);
		if (this.isControlled) return;

		this.#internal_set.clear();
		if (isSvelteSet(value)) {
			value.forEach((v) => this.#internal_set.add(v));
		} else if (value !== undefined) {
			this.#internal_set.add(value);
		}
	}

	has(item: string) {
		return toSet(this.current).has(item);
	}

	add(value: string) {
		this.manipulate((set) => {
			if (!this.isMultiple) {
				set.clear();
			}
			set.add(value);
		});
	}

	addAll(items: Iterable<string>) {
		this.manipulate((set) => {
			if (!this.isMultiple) {
				set.clear();
				set.add(first(items)!);
			} else {
				console.log(items);
				forEach(items, (i) => set.add(i));
			}
		});
	}

	delete(value: string) {
		this.manipulate((set) => set.delete(value));
	}

	deleteAll(items: Iterable<string>) {
		this.manipulate((set) => forEach(items, set.delete));
	}

	clear() {
		this.manipulate((set) => set.clear());
	}

	size() {
		return toSet(this.current).size;
	}

	toggle(item: string) {
		this.manipulate((set) => {
			if (set.has(item)) {
				set.delete(item);
			} else {
				set.add(item);
			}
		});
	}

	toSet() {
		return toSet(this.current);
	}
}
