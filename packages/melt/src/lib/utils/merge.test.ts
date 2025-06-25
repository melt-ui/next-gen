import { describe, it, expect } from "vitest";
import { deepMerge } from "./merge";

describe("deepMerge", () => {
	it("should merge arrays by concatenating them", () => {
		const target = { arr: [1, 2, 3] };
		const source = { arr: [4, 5, 6] };
		const result = deepMerge(target, source);
		expect(result.arr).toEqual([1, 2, 3, 4, 5, 6]);
	});

	it("should handle arrays when only source has an array", () => {
		const target = { arr: "not an array" };
		const source = { arr: [1, 2, 3] };
		const result = deepMerge(target, source);
		expect(result.arr).toEqual([1, 2, 3]);
	});

	it("should merge nested objects recursively", () => {
		const target = {
			nested: {
				a: 1,
				b: 2,
				arr: [1, 2],
			},
		};
		const source = {
			nested: {
				b: 3,
				c: 4,
				arr: [3, 4],
			},
		};
		const result = deepMerge(target, source);
		expect(result).toEqual({
			nested: {
				a: 1,
				b: 3,
				c: 4,
				arr: [1, 2, 3, 4],
			},
		});
	});

	it("should handle null and undefined values", () => {
		const target = { a: null, b: undefined, c: 1 };
		const source = { a: 2, b: 3, c: null };
		const result = deepMerge(target, source);
		expect(result).toEqual({ a: 2, b: 3, c: null });
	});

	it("should handle class instances as primitive values", () => {
		class TestClass {
			constructor(public value: number) {}
		}
		const instance = new TestClass(42);
		const target = { obj: instance };
		const source = { obj: new TestClass(43) };
		const result = deepMerge(target, source);
		expect(result.obj).toBeInstanceOf(TestClass);
		expect(result.obj.value).toBe(43);
	});

	// Specific test for Floating UI middleware use case
	it("should correctly merge Floating UI middleware arrays", () => {
		const mockMiddleware1 = { name: "shift" };
		const mockMiddleware2 = { name: "flip" };
		const mockMiddleware3 = { name: "offset", options: { mainAxis: 8 } };
		const mockMiddleware4 = { name: "custom" };

		const baseOptions = {
			middleware: [mockMiddleware1, mockMiddleware2, mockMiddleware3],
		};

		const userOptions = {
			middleware: [mockMiddleware4],
		};

		const result = deepMerge(baseOptions, userOptions);
		expect(result.middleware).toEqual([
			mockMiddleware1,
			mockMiddleware2,
			mockMiddleware3,
			mockMiddleware4,
		]);
	});
});
