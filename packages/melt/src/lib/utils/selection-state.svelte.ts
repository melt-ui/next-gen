import type { MaybeGetter } from "$lib";
import { SvelteSet } from "svelte/reactivity";
import { extract } from "./extract";
import { first, forEach, last } from "./iterator";
import { isFunction, isIterable, isString, isSvelteSet } from "./is";

type Value<Multiple extends boolean> = Multiple extends true
	? SvelteSet<string>
	: string | undefined;

export type MaybeMultiple<Multiple extends boolean> = Multiple extends true
	? SvelteSet<string> | MaybeGetter<Iterable<string> | undefined>
	: MaybeGetter<string | undefined>;

type OnChange<Multiple extends boolean> = (value: Value<Multiple>) => void;

type SelectionStateProps<Multiple extends boolean> = {
	value?: MaybeMultiple<Multiple>;
	onChange?: OnChange<Multiple>;
	multiple?: MaybeGetter<Multiple | undefined>;
};

function toSet(v: Iterable<string> | string | undefined): SvelteSet<string> {
	if (isString(v)) return new SvelteSet([v]);
	if (isSvelteSet(v)) return v as SvelteSet<string>;
	return new SvelteSet(v);
}

function toSingle(v: Iterable<string> | string | undefined): string | undefined {
	if (isString(v) || v === undefined) return v;
	return last(v);
}

export class SelectionState<Multiple extends boolean = false> {
	#props!: SelectionStateProps<Multiple>;
	#internal_set = new SvelteSet<string>();

	isControlled = $derived(isSvelteSet(this.#props.value) || isFunction(this.#props.value));
	isMultiple = $derived(
		extract<boolean | undefined, false>(this.#props.multiple, false),
	) as Multiple;

	constructor(props: SelectionStateProps<Multiple>) {
		this.#props = props;

		if (this.isControlled) return;

		if (typeof props.value === "string") {
			this.#internal_set.add(props.value);
		} else if (isIterable(props.value)) {
			forEach(props.value, (v: string) => this.#internal_set.add(v));
		}
	}

	get current(): Value<Multiple> {
		if (isFunction(this.#props.value)) {
			const v = this.#props.value();
			return (this.isMultiple ? toSet(v) : toSingle(v)) as Value<Multiple>;
		}

		if (isSvelteSet(this.#props.value)) {
			return (
				this.isMultiple ? this.#props.value : toSingle(this.#props.value)
			) as Value<Multiple>;
		}

		return (
			this.isMultiple ? this.#internal_set : toSingle(this.#internal_set)
		) as Value<Multiple>;
	}

	manipulate(cb: (set: SvelteSet<string>) => void) {
		const set = this.isControlled ? toSet(this.current) : this.#internal_set;
		cb(set);

		const newValue = this.isMultiple ? set : toSingle(set); 
		this.onChange(newValue as Value<Multiple>)
	}

	onChange(value: Value<Multiple>) {
		if (!this.#props.onChange) return;
		this.#props.onChange(value);
	}

	set current(value: Value<Multiple>) {
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