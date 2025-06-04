import { testWithEffect } from "$lib/utils/test.svelte";
import { expect } from "vitest";
import { Combobox } from "../Combobox.svelte.js";
import { SvelteSet } from "svelte/reactivity";
import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import ComboboxTest from "./ComboboxTest.svelte";

testWithEffect("Single selection should not toggle", () => {
	const combobox = new Combobox();
	expect(combobox.value).toBe(undefined);
	combobox.select("a");
	expect(combobox.value).toBe("a");
	combobox.select("a");
	expect(combobox.value).toBe("a");
});

testWithEffect("Multiple selection should toggle", () => {
	const combobox = new Combobox({ multiple: true });
	expect(combobox.value).toEqual(new SvelteSet([]));
	combobox.select("a");
	expect(combobox.value).toEqual(new SvelteSet(["a"]));
	combobox.select("a");
	expect(combobox.value).toEqual(new SvelteSet([]));
});

testWithEffect("Allows selecting non-strings", () => {
	type Item = { label: string; value: unknown };
	const combobox = new Combobox<Item, true>({
		multiple: true,
	});

	const items: Item[] = [
		{ label: "one", value: 1 },
		{ label: "a", value: "a" },
		{ label: "obj", value: { a: 1, b: 2 } },
	];

	expect(combobox.value).toEqual(new SvelteSet([]));
	combobox.select(items[0]!);
	expect(combobox.value).toEqual(new SvelteSet([items[0]]));
	combobox.select(items[1]!);
	expect(combobox.value).toEqual(new SvelteSet([items[0], items[1]]));
});

testWithEffect("valueAsString works with non-strings", () => {
	const combobox = new Combobox<{ id: number; name: string }, true>({
		multiple: true,
	});

	const item1 = { id: 1, name: "Item 1" };
	const item2 = { id: 2, name: "Item 2" };

	// Test with custom labels
	combobox.getOption(item1, "Custom Label 1");
	combobox.getOption(item2, "Custom Label 2");

	combobox.select(item1);
	expect(combobox.valueAsString).toBe("Custom Label 1");

	combobox.select(item2);
	expect(combobox.valueAsString).toBe("Custom Label 1, Custom Label 2");
});

testWithEffect("getOptionLabel returns correct labels", () => {
	const combobox = new Combobox<{ id: number; name: string }>();

	const item = { id: 1, name: "Test Item" };

	// Before setting a label, should return stringified value
	expect(combobox.getOptionLabel(item)).toBe("[object Object]");

	// After setting a label via getOption
	combobox.getOption(item, "Custom Label");
	expect(combobox.getOptionLabel(item)).toBe("Custom Label");
});

testWithEffect("highlighting works with non-strings", () => {
	const combobox = new Combobox<{ id: number; name: string }>();

	const item1 = { id: 1, name: "Item 1" };
	const item2 = { id: 2, name: "Item 2" };

	expect(combobox.highlighted).toBe(null);

	combobox.highlight(item1);
	expect(combobox.highlighted).toEqual(item1);

	combobox.highlight(item2);
	expect(combobox.highlighted).toEqual(item2);
});

testWithEffect("basic interaction with non-string values", async () => {
	const user = userEvent.setup();

	const _ = render(ComboboxTest);
	const input = screen.getByRole("combobox");
	const listbox = screen.getByRole("listbox");
	expect(listbox.getAttribute("aria-expanded")).toEqual("false");

	await user.click(input);

	expect(listbox.getAttribute("aria-expanded")).toEqual("true");

	const options = screen.getAllByRole("option");
	expect(options).toHaveLength(3);

	// Click on the first option (number 1)
	await user.click(options[0]!);
	
	// Should be selected
	expect(options[0]?.getAttribute("aria-selected")).toEqual("true");
});
