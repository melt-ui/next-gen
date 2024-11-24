import type { MaybeGetter } from "$lib";
import { SvelteSet } from "svelte/reactivity";
import { extract } from "./extract";
import { first, forEach } from "./iterator";
import { isFunction, isIterable, isString, isSvelteSet } from "./is";

type _multiple_extends = boolean;
type _multiple_default = false;

type _value<Multiple extends _multiple_extends> = Multiple extends true
	? SvelteSet<string>
	: string | undefined;

type _propValue<Multiple extends _multiple_extends> = Multiple extends true
	? SvelteSet<string> | MaybeGetter<Iterable<string> | undefined>
	: MaybeGetter<string | undefined>;

type _onChange<Multiple extends _multiple_extends> = Multiple extends true
	? ((value: SvelteSet<string>) => void) | undefined
	: ((value: string | undefined) => void) | undefined;

type _props<Multiple extends _multiple_extends> = {
	value: _propValue<Multiple>;
	onChange?: _onChange<Multiple>;
	multiple: MaybeGetter<Multiple | undefined>;
};

function toSet(v: Iterable<string> | string | undefined): SvelteSet<string> {
	if (isString(v)) return new SvelteSet([v]);
	if (isSvelteSet(v)) return v as SvelteSet<string>;
	return new SvelteSet(v);
}

function toSingle(v: Iterable<string> | string | undefined): string | undefined {
	if (isString(v) || v === undefined) return v;
	return first(v);
}

export class AltSelectionState<Multiple extends _multiple_extends = _multiple_default> {
	#props!: _props<Multiple>;
	#internal_set = new SvelteSet<string>();

	isControlled = isSvelteSet(this.#props.value) || isFunction(this.#props.value);
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

	onChange(value: string | SvelteSet<string> | undefined) {
		if (!this.#props.onChange) return;

		if (this.isMultiple) {
			this.#props.onChange?.(toSet(value) as any);
		} else {
			this.#props.onChange?.(toSingle(value) as any);
		}
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

	add(value: string) {
		const set = toSet(this.current);
		if (!this.isMultiple) {
			set.clear();
		}
		set.add(value);

		this.onChange(set);
	}
}
