import { describe, it, expect } from "vitest";
import { unique } from "./string.js";

describe("unique", () => {
	describe("primitives", () => {
		it("handles null", () => {
			expect(unique(null)).toBe("null");
		});

		it("handles undefined", () => {
			expect(unique(undefined)).toBe("undefined:undefined");
		});

		it("handles booleans", () => {
			expect(unique(true)).toBe("boolean:true");
			expect(unique(false)).toBe("boolean:false");
		});

		it("handles numbers", () => {
			expect(unique(42)).toBe("number:42");
			expect(unique(3.14)).toBe("number:3.14");
			expect(unique(NaN)).toBe("NaN");
			expect(unique(Infinity)).toBe("number:Infinity");
			expect(unique(-Infinity)).toBe("number:-Infinity");
		});

		it("handles strings", () => {
			expect(unique("hello")).toBe("string:hello");
			expect(unique("")).toBe("string:");
		});

		it("handles bigint", () => {
			expect(unique(BigInt(123))).toBe("bigint:123");
		});

		it("handles symbols", () => {
			const sym = Symbol("test");
			expect(unique(sym)).toBe(`symbol:${sym.toString()}`);
		});

		it("handles functions", () => {
			const fn = () => 42;
			expect(unique(fn)).toBe(`function:${fn.toString()}`);
		});
	});

	describe("objects", () => {
		it("handles empty objects", () => {
			expect(unique({})).toBe("object:{}");
		});

		it("handles simple objects", () => {
			expect(unique({ a: 1 })).toBe("object:{a:number:1}");
			expect(unique({ b: 2, a: 1 })).toBe("object:{a:number:1,b:number:2}");
		});

		it("handles nested objects", () => {
			const obj = { a: { b: 1 } };
			expect(unique(obj)).toBe("object:{a:object:{b:number:1}}");
		});

		it("produces same result for equivalent objects", () => {
			expect(unique({ a: 1, b: 2 })).toBe(unique({ b: 2, a: 1 }));
		});
	});

	describe("arrays", () => {
		it("handles empty arrays", () => {
			expect(unique([])).toBe("array:[]");
		});

		it("handles simple arrays", () => {
			expect(unique([1, 2, 3])).toBe("array:[number:1,number:2,number:3]");
		});

		it("handles nested arrays", () => {
			expect(unique([1, [2, 3]])).toBe("array:[number:1,array:[number:2,number:3]]");
		});

		it("produces same result for equivalent arrays", () => {
			expect(unique([1, 2, 3])).toBe(unique([1, 2, 3]));
		});
	});

	describe("dates", () => {
		it("handles dates", () => {
			const date = new Date("2023-01-01T00:00:00.000Z");
			expect(unique(date)).toBe("date:2023-01-01T00:00:00.000Z");
		});

		it("produces same result for equivalent dates", () => {
			const date1 = new Date("2023-01-01");
			const date2 = new Date("2023-01-01");
			expect(unique(date1)).toBe(unique(date2));
		});
	});

	describe("regexp", () => {
		it("handles regular expressions", () => {
			expect(unique(/test/gi)).toBe("regexp:/test/gi");
		});

		it("produces same result for equivalent regexps", () => {
			expect(unique(/test/i)).toBe(unique(/test/i));
		});
	});

	describe("maps", () => {
		it("handles empty maps", () => {
			expect(unique(new Map())).toBe("map:{}");
		});

		it("handles simple maps", () => {
			const map = new Map([
				["a", 1],
				["b", 2],
			]);
			expect(unique(map)).toBe("map:{string:a:number:1,string:b:number:2}");
		});

		it("produces same result for equivalent maps", () => {
			const map1 = new Map([
				["a", 1],
				["b", 2],
			]);
			const map2 = new Map([
				["b", 2],
				["a", 1],
			]);
			expect(unique(map1)).toBe(unique(map2));
		});

		it("handles complex keys", () => {
			const map = new Map([[{ x: 1 }, "value"]]);
			expect(unique(map)).toBe("map:{object:{x:number:1}:string:value}");
		});
	});

	describe("sets", () => {
		it("handles empty sets", () => {
			expect(unique(new Set())).toBe("set:{}");
		});

		it("handles simple sets", () => {
			const set = new Set([1, 2, 3]);
			expect(unique(set)).toBe("set:{number:1,number:2,number:3}");
		});

		it("produces same result for equivalent sets", () => {
			const set1 = new Set([1, 2, 3]);
			const set2 = new Set([3, 1, 2]);
			expect(unique(set1)).toBe(unique(set2));
		});
	});

	describe("circular references", () => {
		it("handles circular object references", () => {
			const obj: any = { a: 1 };
			obj.self = obj;
			const result = unique(obj);
			expect(result).toContain("[Circular]");
		});

		it("handles circular array references", () => {
			const arr: any[] = [1, 2];
			arr.push(arr);
			const result = unique(arr);
			expect(result).toContain("[Circular]");
		});
	});

	describe("complex nested structures", () => {
		it("handles mixed nested structures", () => {
			const complex = {
				arr: [1, { nested: true }],
				map: new Map([["key", new Set([1, 2])]]),
				date: new Date("2023-01-01"),
				fn: () => "test",
			};

			const result = unique(complex);
			expect(result).toContain("array:");
			expect(result).toContain("map:");
			expect(result).toContain("date:");
			expect(result).toContain("function:");
		});
	});

	describe("value equality", () => {
		it("returns same string for structurally identical values", () => {
			const obj1 = { a: 1, b: [2, 3], c: new Date("2023-01-01") };
			const obj2 = { b: [2, 3], a: 1, c: new Date("2023-01-01") };

			expect(unique(obj1)).toBe(unique(obj2));
		});

		it("returns different strings for different values", () => {
			expect(unique({ a: 1 })).not.toBe(unique({ a: 2 }));
			expect(unique([1, 2])).not.toBe(unique([2, 1]));
		});
	});
});
