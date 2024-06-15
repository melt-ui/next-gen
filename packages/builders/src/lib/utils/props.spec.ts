import type { MaybeGetter } from "$lib/types";
import { describe, expectTypeOf, test } from "vitest";
import type { ParsedProps, WithDefault } from "./props.svelte";

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
