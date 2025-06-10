import { testWithEffect } from "$lib/utils/test.svelte";
import type { SvelteSet } from "svelte/reactivity";
import { expectTypeOf } from "vitest";
import { Accordion } from "../Accordion.svelte";

testWithEffect("Should have valid types", () => {
	const a1 = new Accordion();
	expectTypeOf(a1.value).toMatchTypeOf<string | undefined>();

	const a2 = new Accordion({ multiple: true });
	expectTypeOf(a2.value).toMatchTypeOf<SvelteSet<string>>();
});
