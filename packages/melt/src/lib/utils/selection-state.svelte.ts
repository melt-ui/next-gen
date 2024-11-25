import type { MaybeGetter } from "$lib/types.js";
import { SvelteSet } from "svelte/reactivity";
import { isFunction } from "./is.js";

export type SingleSelectionStateProps = {
	value?: MaybeGetter<string | undefined>;
	onChange?: (value: string | undefined) => void;
};

export abstract class SingleSelectionState {
	abstract current?: string;

	readonly type = "single";

	size() {
		return this.current === undefined ? 0 : 1;
	}

	has(item: string) {
		return this.current === item;
	}

	add(item: string) {
		this.current = item;
	}

	set(item: string) {
		this.current = item;
	}

	toggle(item: string) {
		if (this.current === item) {
			this.current = undefined;
		} else {
			this.current = item;
		}
	}

	delete(item: string) {
		if (this.current === item) {
			this.current = undefined;
		}
	}

	clear() {
		this.current = undefined;
	}

	static create(props: SingleSelectionStateProps = {}): SingleSelectionState {
		const { value, onChange } = props;
		if (isFunction(value)) {
			return new ControlledSingleSelectionState(value, onChange);
		}
		return new UncontrolledSingleSelectionState(value, onChange);
	}
}

class ControlledSingleSelectionState extends SingleSelectionState {
	#value: () => string | undefined;
	#onChange?: (value: string | undefined) => void;

	constructor(value: () => string | undefined, onChange?: (value: string | undefined) => void) {
		super();
		this.#value = value;
		this.#onChange = onChange;
	}

	#current = $derived.by(() => this.#value());

	get current() {
		return this.#current;
	}

	set current(value) {
		if (this.#current !== value) {
			this.#onChange?.(value);
		}
	}
}

class UncontrolledSingleSelectionState extends SingleSelectionState {
	#current: string | undefined = $state();
	#onChange?: (value: string | undefined) => void;

	constructor(value: string | undefined, onChange?: (value: string | undefined) => void) {
		super();
		this.#current = value;
		this.#onChange = onChange;
	}

	get current() {
		return this.#current;
	}

	set current(value) {
		if (this.#current !== value) {
			this.#current = value;
			this.#onChange?.(value);
		}
	}
}

export type MultiSelectionStateProps = {
	value?: MaybeGetter<Iterable<string> | undefined>;
	onChange?: (value: Set<string>) => void;
};

export abstract class MultiSelectionState {
	#onChange?: (value: Set<string>) => void;

	constructor(onChange?: (value: Set<string>) => void) {
		this.#onChange = onChange;
	}

	abstract readonly current: Set<string>;

	readonly type = "multiple";

	get size() {
		return this.current.size;
	}

	has(item: string) {
		return this.current.has(item);
	}

	add(item: string) {
		const { current } = this;
		const { size } = current;
		current.add(item);
		if (current.size !== size) {
			this.#onChange?.(current);
		}
	}

	addAll(items: Iterable<string>) {
		const { current } = this;
		const { size } = current;
		for (const item of items) {
			current.add(item);
		}
		if (current.size !== size) {
			this.#onChange?.(current);
		}
	}

	set(item: string) {
		const { current } = this;
		if (current.size === 1 && current.has(item)) {
			return;
		}

		current.clear();
		current.add(item);
		this.#onChange?.(current);
	}

	toggle(item: string) {
		const { current } = this;
		const deleted = current.delete(item);
		if (!deleted) {
			current.add(item);
		}
		this.#onChange?.(current);
	}

	delete(item: string) {
		const { current } = this;
		const deleted = current.delete(item);
		if (deleted) {
			this.#onChange?.(current);
		}
	}

	deleteAll(items: Iterable<string>) {
		const { current } = this;
		let deleted = false;
		for (const item of items) {
			deleted = current.delete(item) || deleted;
		}
		if (deleted) {
			this.#onChange?.(current);
		}
	}

	clear() {
		const { current } = this;
		if (current.size !== 0) {
			current.clear();
			this.#onChange?.(current);
		}
	}

	update(updater: (current: Set<string>) => void) {
		const { current } = this;
		updater(current);
		this.#onChange?.(current);
	}

	[Symbol.iterator]() {
		return this.current[Symbol.iterator]();
	}

	static create(props: MultiSelectionStateProps): MultiSelectionState {
		const { value, onChange } = props;
		if (isFunction(value)) {
			return new ControlledMultiSelectionState(value, onChange);
		}
		return new UncontrolledMultiSelectionState(value, onChange);
	}
}

class ControlledMultiSelectionState extends MultiSelectionState {
	#value: () => Iterable<string> | undefined;

	constructor(value: () => Iterable<string> | undefined, onChange?: (value: Set<string>) => void) {
		super(onChange);
		this.#value = value;
	}

	readonly current = $derived.by(() => new Set(this.#value()));
}

class UncontrolledMultiSelectionState extends MultiSelectionState {
	#current: SvelteSet<string>;

	constructor(value: Iterable<string> | undefined, onChange?: (value: Set<string>) => void) {
		super(onChange);
		this.#current = new SvelteSet(value);
	}

	get current() {
		return this.#current;
	}
}

export type SelectionState = SingleSelectionState | MultiSelectionState;
