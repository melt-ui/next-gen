import { describe, it, expect } from "vitest";
import { Collection } from "./collection";
import { SvelteSet } from "svelte/reactivity";

describe("Collection", () => {
	describe("constructor", () => {
		it("should create empty collection with no args", () => {
			const collection = new Collection();
			expect([...collection]).toEqual([]);
		});

		it("should create collection with default value", () => {
			const collection = new Collection(undefined, [1, 2, 3]);
			expect([...collection]).toEqual([1, 2, 3]);
		});

		it("should handle Set input", () => {
			const set = new Set([1, 2, 3]);
			const collection = new Collection(set);
			expect([...collection]).toEqual([1, 2, 3]);
		});

		it("should handle array input", () => {
			const arr = [1, 2, 3];
			const collection = new Collection(arr);
			expect([...collection]).toEqual([1, 2, 3]);
		});

		it("should handle getter function", () => {
			const getter = () => [1, 2, 3];
			const collection = new Collection(getter);
			expect([...collection]).toEqual([1, 2, 3]);
		});
	});

	describe("iteration methods", () => {
		it("should provide keys", () => {
			const collection = new Collection([1, 2, 3]);
			expect([...collection.keys()]).toEqual([0, 1, 2]);
		});

		it("should provide values", () => {
			const collection = new Collection([1, 2, 3]);
			expect([...collection.values()]).toEqual([1, 2, 3]);
		});

		it("should provide entries", () => {
			const collection = new Collection([1, 2, 3]);
			expect([...collection.entries()]).toEqual([
				[0, 1],
				[1, 2],
				[2, 3],
			]);
		});

		it("should handle empty collection in iteration methods", () => {
			const collection = new Collection();
			expect([...collection.keys()]).toEqual([]);
			expect([...collection.values()]).toEqual([]);
			expect([...collection.entries()]).toEqual([]);
		});
	});

	describe("conversion methods", () => {
		it("should convert to array", () => {
			const collection = new Collection([1, 2, 3]);
			expect(collection.toArray()).toEqual([1, 2, 3]);
		});

		it("should convert to set", () => {
			const collection = new Collection([1, 2, 2, 3]);
			expect(collection.toSet()).toEqual(new Set([1, 2, 3]));
		});

		it("should handle empty collection in conversion methods", () => {
			const collection = new Collection();
			expect(collection.toArray()).toEqual([]);
			expect(collection.toSet()).toEqual(new Set());
		});
	});

	describe("utility methods", () => {
		it("should return correct size", () => {
			const collection = new Collection([1, 2, 3]);
			expect(collection.size()).toBe(3);
		});

		it("should check if empty", () => {
			const empty = new Collection();
			const nonEmpty = new Collection([1, 2, 3]);
			expect(empty.isEmpty()).toBe(true);
			expect(nonEmpty.isEmpty()).toBe(false);
		});

		it("should get first element", () => {
			const collection = new Collection([1, 2, 3]);
			expect(collection.first()).toBe(1);
			expect(new Collection().first()).toBeUndefined();
		});

		it("should get last element", () => {
			const collection = new Collection([1, 2, 3]);
			expect(collection.last()).toBe(3);
			expect(new Collection().last()).toBeUndefined();
		});
	});

	describe("predicate methods", () => {
		it("should find elements", () => {
			const collection = new Collection([1, 2, 3]);
			expect(collection.find((x) => x > 2)).toBe(3);
			expect(collection.find((x) => x > 3)).toBeUndefined();
		});

		it("should check if some elements match", () => {
			const collection = new Collection([1, 2, 3]);
			expect(collection.some((x) => x > 2)).toBe(true);
			expect(collection.some((x) => x > 3)).toBe(false);
		});

		it("should check if every element matches", () => {
			const collection = new Collection([1, 2, 3]);
			expect(collection.every((x) => x > 0)).toBe(true);
			expect(collection.every((x) => x > 1)).toBe(false);
		});

		it("should handle empty collection in predicate methods", () => {
			const collection = new Collection();
			expect(collection.find((x) => true)).toBeUndefined();
			expect(collection.some((x) => true)).toBe(false);
			expect(collection.every((x) => false)).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("should handle undefined source with no default", () => {
			const collection = new Collection(undefined, undefined);
			expect([...collection]).toEqual([]);
		});

		it("should handle null values in iterable", () => {
			const collection = new Collection([null, undefined, 1]);
			expect([...collection]).toEqual([null, undefined, 1]);
		});

		it("should handle getter that returns undefined", () => {
			const collection = new Collection(() => undefined);
			expect([...collection]).toEqual([]);
		});

		it("should handle nested iterables", () => {
			const collection = new Collection([
				[1, 2],
				[3, 4],
			]);
			expect([...collection]).toEqual([
				[1, 2],
				[3, 4],
			]);
		});
	});

	describe("dynamic updates", () => {
		it("should reflect changes in source getter", () => {
			let data = $state([1, 2, 3]);
			const getter = () => data;
			const collection = new Collection(getter);

			expect([...collection]).toEqual([1, 2, 3]);

			data = [4, 5, 6];
			expect([...collection]).toEqual([4, 5, 6]);
		});

		it("should reflect changes in source array", () => {
			const data = [1, 2, 3];
			const collection = new Collection(data);

			expect([...collection]).toEqual([1, 2, 3]);

			data.push(4);
			expect([...collection]).toEqual([1, 2, 3, 4]);
		});

		it("should reflect changes in source set", () => {
			const data = new SvelteSet([1, 2, 3]);
			const collection = new Collection(data);

			expect([...collection]).toEqual([1, 2, 3]);

			data.add(4);
			expect([...collection]).toEqual([1, 2, 3, 4]);
		});
	});
});
