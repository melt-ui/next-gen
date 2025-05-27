import { testWithEffect } from "$lib/utils/test.svelte";
import { expect } from "vitest";
import { Select } from "../Select.svelte.js";
import { SvelteSet } from "svelte/reactivity";
import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
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
	const user = userEvent.setup();

	const _ = render(SelectTest);
	const trigger = screen.getByRole("combobox");
	const listbox = screen.getByRole("listbox");
	expect(trigger.textContent).toEqual("Select an item");
	expect(listbox.getAttribute("aria-expanded")).toEqual("false");

	await user.click(trigger);

	expect(listbox.getAttribute("aria-expanded")).toEqual("true");

	const options = screen.getAllByRole("option");
	await user.hover(options[0]!);
	expect(options[0]?.dataset.highlighted).toEqual("");

	await user.keyboard("o");
	await new Promise((resolve) => setTimeout(resolve, 100));
	// TODO: fix
	// console.log(options);
	// expect(options[2]?.dataset.highlighted).toEqual("");
});
