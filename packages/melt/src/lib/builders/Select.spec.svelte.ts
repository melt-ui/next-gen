import { testWithEffect } from "$lib/utils/test.svelte";
import { expect } from "vitest";
import { Select } from "./Select.svelte.js";
import { SvelteSet } from "svelte/reactivity";

testWithEffect("Single selection should not toggle", () => {
	const select = new Select();
	expect(select.value).toBe(undefined);
	select.select("a");
	expect(select.value).toBe("a");
	select.select("a");
	expect(select.value).toBe("a");
});

testWithEffect("Multiple selection should toggle", () => {
	const select = new Select({ multiple: true });
	expect(select.value).toEqual(new SvelteSet([]));
	select.select("a");
	expect(select.value).toEqual(new SvelteSet(["a"]));
	select.select("a");
	expect(select.value).toEqual(new SvelteSet([]));
});
