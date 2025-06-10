import { testWithEffect } from "$lib/utils/test.svelte";
import { expect } from "vitest";
import { Select } from "../Select.svelte.js";
import { SvelteSet } from "svelte/reactivity";
import { render } from "vitest-browser-svelte";
import { page, userEvent } from "@vitest/browser/context";
import SelectTest from "./SelectTest.svelte";

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

testWithEffect("Allows selecting non-strings", () => {
	type Item = { label: string; value: unknown };
	const select = new Select<Item, true>({
		multiple: true,
	});

	const items: Item[] = [
		{ label: "one", value: 1 },
		{ label: "a", value: "a" },
		{ label: "obj", value: { a: 1, b: 2 } },
	];

	expect(select.value).toEqual(new SvelteSet([]));
	select.select(items[0]!);
	expect(select.value).toEqual(new SvelteSet([items[0]]));
	select.select(items[1]!);
	expect(select.value).toEqual(new SvelteSet([items[0], items[1]]));
});

testWithEffect("typeahead", async () => {
	const { container } = render(SelectTest);

	const trigger = page.getByRole("combobox");
	const listbox = page.getByRole("listbox");

	expect(trigger).toHaveTextContent("Select an item");
	expect(container.querySelector("[role='listbox']")).toHaveAttribute("aria-expanded", "false");

	await trigger.click();

	expect(listbox).toHaveAttribute("aria-expanded", "true");

	const firstOption = page.getByRole("option").first();
	await firstOption.hover();
	expect(firstOption).toHaveAttribute("data-highlighted", "");

	await userEvent.type(trigger, "o");
	await new Promise((resolve) => setTimeout(resolve, 100));
	// TODO: fix
	// const thirdOption = page.getByRole("option").nth(2);
	// await expect(thirdOption).toHaveAttribute("data-highlighted", "");
});
