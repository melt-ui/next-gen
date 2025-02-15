import type { IterableProp } from "$lib/types";

export class Collection<T> {
	private source: IterableProp<T>;
	private defaultValue: Iterable<T> | undefined;

	constructor(source?: IterableProp<T>, defaultValue?: Iterable<T>) {
		this.source = source;
		this.defaultValue = defaultValue;
	}

	private getIterable(): Iterable<T> | undefined {
		if (!this.source) {
			return this.defaultValue !== undefined ? this.defaultValue : [];
		}
		return typeof this.source === "function" ? this.source() : this.source;
	}

	*[Symbol.iterator](): Iterator<T> {
		const iterable = this.getIterable();
		if (iterable) {
			yield* iterable;
		}
	}

	*keys(): IterableIterator<number> {
		const iterable = this.getIterable();
		if (iterable) {
			let index = 0;
			for (const _ of iterable) {
				yield index++;
			}
		}
	}

	*values(): IterableIterator<T> {
		const iterable = this.getIterable();
		if (iterable) {
			yield* iterable;
		}
	}

	*entries(): IterableIterator<[number, T]> {
		const iterable = this.getIterable();
		if (iterable) {
			let index = 0;
			for (const value of iterable) {
				yield [index++, value];
			}
		}
	}

	toArray(): T[] {
		const iterable = this.getIterable();
		return iterable ? Array.from(iterable) : [];
	}

	toSet(): Set<T> {
		const iterable = this.getIterable();
		return new Set(iterable);
	}

	size(): number {
		const iterable = this.getIterable();
		if (!iterable) return 0;

		let count = 0;
		for (const _ of iterable) {
			count++;
		}
		return count;
	}

	isEmpty(): boolean {
		const iterable = this.getIterable();
		if (!iterable) return true;

		for (const _ of iterable) {
			return false;
		}
		return true;
	}

	first(): T | undefined {
		const iterable = this.getIterable();
		if (!iterable) return undefined;

		for (const value of iterable) {
			return value;
		}
		return undefined;
	}

	last(): T | undefined {
		const iterable = this.getIterable();
		if (!iterable) return undefined;

		let lastValue: T | undefined;
		for (const value of iterable) {
			lastValue = value;
		}
		return lastValue;
	}

	find(predicate: (value: T) => boolean): T | undefined {
		const iterable = this.getIterable();
		if (!iterable) return undefined;

		for (const value of iterable) {
			if (predicate(value)) {
				return value;
			}
		}
		return undefined;
	}

	some(predicate: (value: T) => boolean): boolean {
		const iterable = this.getIterable();
		if (!iterable) return false;

		for (const value of iterable) {
			if (predicate(value)) {
				return true;
			}
		}
		return false;
	}

	every(predicate: (value: T) => boolean): boolean {
		const iterable = this.getIterable();
		if (!iterable) return true;

		for (const value of iterable) {
			if (!predicate(value)) {
				return false;
			}
		}
		return true;
	}
}
