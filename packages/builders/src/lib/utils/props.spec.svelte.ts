import type { MaybeGetter } from "$lib/types";
import { describe, expect, expectTypeOf, test } from "vitest";
import { parseProps, type ParsedProps, type WithDefault } from "./props.svelte";

export function testWithEffect(name: string, fn: () => void | Promise<void>) {
	test(name, async () => {
		let promise: void | Promise<void>;
		const cleanup = $effect.root(() => {
			promise = fn();
		});

		try {
			await promise!;
		} finally {
			cleanup();
		}
	});
}

testWithEffect("parseProps", () => {
	type Props = {
		a: number;
		b?: number;
		c?: number;
	};

	type Defaults = {
		b: number;
		c: number;
	};

	const parsed = parseProps<Props, Defaults>({ a: 1, b: undefined }, { b: 2, c: 3 });
	expect(parsed).toEqual({ a: 1, b: 2, c: 3 });
});

describe("parseProps types", () => {
	test("WithDefault", () => {
		type A = string | undefined;
		type DefaultA = "a";
		type AWithDefault = WithDefault<A, DefaultA>;
		expectTypeOf<AWithDefault>().toMatchTypeOf<string>();

		type B = string | undefined;
		type BWithDefault = WithDefault<B, undefined>;
		expectTypeOf<BWithDefault>().toMatchTypeOf<string | undefined>();
	});

	test("ParsedProps", () => {
		type Props = {
			a: string;
			b?: string;
			c: MaybeGetter<number>;
			d?: MaybeGetter<number>;
			e?: MaybeGetter<number | undefined>;
			f?: string;
			g?: MaybeGetter<string | undefined>;
		};

		type Defaults = {
			b: string;
			c: number;
			d: number;
			e: number;
		};

		type Parsed = ParsedProps<Props, Defaults>;
		type Expected = {
			a: string;
			b: string;
			c: number;
			d: number;
			e: number;
			f?: string;
			g?: string;
		};

		expectTypeOf<Parsed>().toMatchTypeOf<Expected>();
	});
});
