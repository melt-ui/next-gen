import { SvelteSet } from "svelte/reactivity";
import type { MaybeGetter } from "./types.js";

type SyncedSetArgs<T> = {
	value?: MaybeGetter<Iterable<T>> | SvelteSet<T> | undefined;
	onChange?: (value: SvelteSet<T>) => void;
};

/**
 * If the value arg is a static iterable, it will be used as the default value.
 *
 * Otherwise, if it is a getter, or a `SvelteSet`, that will be used as the source of truth.
 *
 * onChange is called every time the value changes.
 */
export class SyncedSet<T> implements Set<T> {
	#set: SvelteSet<T>;
	#args!: SyncedSetArgs<T>;

	constructor(args: SyncedSetArgs<T>) {
		this.#args = args;
		const { value } = args;

		if (value instanceof SvelteSet) {
			this.#set = value;
		} else if (typeof value !== "function") {
			this.#set = new SvelteSet(value);
		} else if (value === undefined) {
			this.#set = new SvelteSet();
		} else {
			this.#set = new SvelteSet();
			$effect(() => {
				this.#set.clear();
				for (const item of value()) {
					this.#set.add(item);
				}
			});
		}
	}

	get set(): SvelteSet<T> {
		return this.#set;
	}

	#triggerOnChange() {
		this.#args.onChange?.(this.set);
	}

	add(value: T): this {
		this.#set.add(value);
		this.#triggerOnChange();
		return this;
	}

	delete(value: T): boolean {
		const result = this.#set.delete(value);
		this.#triggerOnChange();
		return result;
	}

	clear(): void {
		this.#set.clear();
		this.#triggerOnChange();
	}

	forEach(...args: Parameters<Set<T>["forEach"]>): ReturnType<Set<T>["forEach"]> {
		return this.#set.forEach(...args);
	}

	has(...args: Parameters<Set<T>["has"]>): ReturnType<Set<T>["has"]> {
		return this.#set.has(...args);
	}

	entries(...args: Parameters<Set<T>["entries"]>): ReturnType<Set<T>["entries"]> {
		return this.#set.entries(...args);
	}

	keys(...args: Parameters<Set<T>["keys"]>): ReturnType<Set<T>["keys"]> {
		return this.#set.keys(...args);
	}

	values(...args: Parameters<Set<T>["values"]>): ReturnType<Set<T>["values"]> {
		return this.#set.values(...args);
	}

	get size(): number {
		return this.#set.size;
	}

	[Symbol.iterator](): IterableIterator<T> {
		return this.#set[Symbol.iterator]();
	}

	get [Symbol.toStringTag](): string {
		return this.#set[Symbol.toStringTag];
	}
}
