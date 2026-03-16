import { testWithEffect } from "$lib/utils/test.svelte";
import { expect, expectTypeOf } from "vitest";
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

testWithEffect("Disabled state", () => {
	render(SelectTest, {
		target: document.body,
		props: {
			disabled: true,
		},
	});

	const trigger = page.getByRole("combobox");
	expect(trigger).toBeDisabled();
});

testWithEffect("Generic value type: number values", () => {
	const select = new Select<number>();

	expect(select.value).toBe(undefined);
	select.select(42);
	expect(select.value).toBe(42);
	expect(select.isSelected(42)).toBe(true);
	expect(select.isSelected(43)).toBe(false);
});

testWithEffect("Generic value type: complex object values", () => {
	interface User {
		id: number;
		name: string;
		email: string;
	}

	const select = new Select<User, true>({ multiple: true });

	const user1: User = { id: 1, name: "John", email: "john@example.com" };
	const user2: User = { id: 2, name: "Jane", email: "jane@example.com" };

	expect(select.value).toEqual(new SvelteSet([]));

	select.select(user1);
	expect(select.value).toEqual(new SvelteSet([user1]));
	expect(select.isSelected(user1)).toBe(true);

	select.select(user2);
	expect(select.value).toEqual(new SvelteSet([user1, user2]));
	expect(select.isSelected(user2)).toBe(true);

	// Test toggling off
	select.select(user1);
	expect(select.value).toEqual(new SvelteSet([user2]));
	expect(select.isSelected(user1)).toBe(false);
});

testWithEffect("Generic value type: Date values", () => {
	const select = new Select<Date>();

	const date1 = new Date("2023-01-01");
	const date2 = new Date("2023-12-31");

	expect(select.value).toBe(undefined);
	select.select(date1);
	expect(select.value).toBe(date1);
	expect(select.isSelected(date1)).toBe(true);
	expect(select.isSelected(date2)).toBe(false);
});

testWithEffect("Generic value type: array values", () => {
	const select = new Select<number[], true>({ multiple: true });

	const arr1 = [1, 2, 3];
	const arr2 = [4, 5, 6];

	expect(select.value).toEqual(new SvelteSet([]));

	select.select(arr1);
	expect(select.value).toEqual(new SvelteSet([arr1]));
	expect(select.isSelected(arr1)).toBe(true);

	select.select(arr2);
	expect(select.value).toEqual(new SvelteSet([arr1, arr2]));
	expect(select.isSelected(arr2)).toBe(true);
});

testWithEffect("Generic value type: highlighting with complex objects", () => {
	interface Product {
		id: string;
		name: string;
		price: number;
	}

	const select = new Select<Product>();

	const product1: Product = { id: "p1", name: "Laptop", price: 999 };
	const product2: Product = { id: "p2", name: "Mouse", price: 25 };

	expect(select.highlighted).toBe(null);

	select.highlighted = product1;
	expect(select.highlighted).toEqual(product1);

	select.highlighted = product2;
	expect(select.highlighted).toEqual(product2);

	// Test that highlighting doesn't affect selection
	expect(select.isSelected(product1)).toBe(false);
	expect(select.isSelected(product2)).toBe(false);
});

testWithEffect("Generic value type: option labels with complex objects", () => {
	interface Category {
		id: number;
		name: string;
		description: string;
	}

	const select = new Select<Category>();

	const category: Category = {
		id: 1,
		name: "Electronics",
		description: "Electronic devices and accessories",
	};

	// Before setting a label, should return empty string for complex objects
	expect(select.getOptionLabel(category)).toBe("");

	// After setting a label via getOption
	select.getOption(category, "Electronics Category");
	expect(select.getOptionLabel(category)).toBe("Electronics Category");
});

testWithEffect("Generic value type: option IDs are unique for different objects", () => {
	interface Item {
		id: number;
		value: string;
	}

	const select = new Select<Item>();

	const item1: Item = { id: 1, value: "first" };
	const item2: Item = { id: 2, value: "second" };
	const item3: Item = { id: 1, value: "different" }; // Same id but different object

	const id1 = select.getOptionId(item1);
	const id2 = select.getOptionId(item2);
	const id3 = select.getOptionId(item3);

	expect(id1).not.toBe(id2);
	expect(id1).not.toBe(id3);
	expect(id2).not.toBe(id3);
});

testWithEffect("Generic value type: valueAsString with complex objects", () => {
	interface Tag {
		id: number;
		name: string;
	}

	const select = new Select<Tag, true>({ multiple: true });

	const tag1: Tag = { id: 1, name: "urgent" };
	const tag2: Tag = { id: 2, name: "bug" };

	// Set labels for the tags
	select.getOption(tag1, "Urgent");
	select.getOption(tag2, "Bug");

	select.select(tag1);
	select.select(tag2);

	// valueAsString should work with the labels
	expect(select.valueAsString).toBe("Urgent, Bug");
});

testWithEffect("Type tests: string select single selection", () => {
	const select = new Select<string>();

	// Value should be string | undefined for single selection
	expectTypeOf(select.value).toEqualTypeOf<string | undefined>();

	// Select method should accept string
	expectTypeOf(select.select).parameter(0).toEqualTypeOf<string>();

	// isSelected should accept string and return boolean
	expectTypeOf(select.isSelected).parameter(0).toEqualTypeOf<string>();
	expectTypeOf(select.isSelected).returns.toEqualTypeOf<boolean>();

	// highlighted should be string | null
	expectTypeOf(select.highlighted).toEqualTypeOf<string | null>();
});

testWithEffect("Type tests: string select multiple selection", () => {
	const select = new Select<string, true>({ multiple: true });

	// Value should be SvelteSet<string> for multiple selection
	expectTypeOf(select.value).toEqualTypeOf<SvelteSet<string>>();

	// Select method should still accept string
	expectTypeOf(select.select).parameter(0).toEqualTypeOf<string>();

	// isSelected should accept string and return boolean
	expectTypeOf(select.isSelected).parameter(0).toEqualTypeOf<string>();
	expectTypeOf(select.isSelected).returns.toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: number select single selection", () => {
	const select = new Select<number>();

	// Value should be number | undefined for single selection
	expectTypeOf(select.value).toEqualTypeOf<number | undefined>();

	// Select method should accept number
	expectTypeOf(select.select).parameter(0).toEqualTypeOf<number>();

	// isSelected should accept number and return boolean
	expectTypeOf(select.isSelected).parameter(0).toEqualTypeOf<number>();
	expectTypeOf(select.isSelected).returns.toEqualTypeOf<boolean>();

	// highlighted should be number | null
	expectTypeOf(select.highlighted).toEqualTypeOf<number | null>();
});

testWithEffect("Type tests: number select multiple selection", () => {
	const select = new Select<number, true>({ multiple: true });

	// Value should be SvelteSet<number> for multiple selection
	expectTypeOf(select.value).toEqualTypeOf<SvelteSet<number>>();

	// Select method should still accept number
	expectTypeOf(select.select).parameter(0).toEqualTypeOf<number>();
});

testWithEffect("Type tests: complex object select", () => {
	interface User {
		id: number;
		name: string;
		email: string;
	}

	const select = new Select<User>();

	// Value should be User | undefined for single selection
	expectTypeOf(select.value).toEqualTypeOf<User | undefined>();

	// Select method should accept User
	expectTypeOf(select.select).parameter(0).toEqualTypeOf<User>();

	// isSelected should accept User and return boolean
	expectTypeOf(select.isSelected).parameter(0).toEqualTypeOf<User>();
	expectTypeOf(select.isSelected).returns.toEqualTypeOf<boolean>();

	// highlighted should be User | null
	expectTypeOf(select.highlighted).toEqualTypeOf<User | null>();

	// getOptionLabel should accept User and return string
	expectTypeOf(select.getOptionLabel).parameter(0).toEqualTypeOf<User>();
	expectTypeOf(select.getOptionLabel).returns.toEqualTypeOf<string>();

	// getOptionId should accept User and return string
	expectTypeOf(select.getOptionId).parameter(0).toEqualTypeOf<User>();
	expectTypeOf(select.getOptionId).returns.toEqualTypeOf<string>();
});

testWithEffect("Type tests: complex object select multiple selection", () => {
	interface Product {
		id: string;
		name: string;
		price: number;
	}

	const select = new Select<Product, true>({ multiple: true });

	// Value should be SvelteSet<Product> for multiple selection
	expectTypeOf(select.value).toEqualTypeOf<SvelteSet<Product>>();

	// Select method should accept Product
	expectTypeOf(select.select).parameter(0).toEqualTypeOf<Product>();

	// isSelected should accept Product and return boolean
	expectTypeOf(select.isSelected).parameter(0).toEqualTypeOf<Product>();
	expectTypeOf(select.isSelected).returns.toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: array value types", () => {
	const select = new Select<number[]>();

	// Value should be number[] | undefined for single selection
	expectTypeOf(select.value).toEqualTypeOf<number[] | undefined>();

	// Select method should accept number[]
	expectTypeOf(select.select).parameter(0).toEqualTypeOf<number[]>();

	// isSelected should accept number[] and return boolean
	expectTypeOf(select.isSelected).parameter(0).toEqualTypeOf<number[]>();
	expectTypeOf(select.isSelected).returns.toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: Date value types", () => {
	const select = new Select<Date, true>({ multiple: true });

	// Value should be SvelteSet<Date> for multiple selection
	expectTypeOf(select.value).toEqualTypeOf<SvelteSet<Date>>();

	// Select method should accept Date
	expectTypeOf(select.select).parameter(0).toEqualTypeOf<Date>();

	// isSelected should accept Date and return boolean
	expectTypeOf(select.isSelected).parameter(0).toEqualTypeOf<Date>();
	expectTypeOf(select.isSelected).returns.toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: getOption method types", () => {
	interface Item {
		id: number;
		value: string;
	}

	const select = new Select<Item>();

	// getOption should accept Item and optional string label
	expectTypeOf(select.getOption).parameter(0).toEqualTypeOf<Item>();
	expectTypeOf(select.getOption).parameter(1).toEqualTypeOf<string | undefined>();

	// getOption should return object with specific properties
	const option = select.getOption({ id: 1, value: "test" });
	expectTypeOf(option).toHaveProperty("role").toEqualTypeOf<"option">();
	expectTypeOf(option).toHaveProperty("aria-selected").toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: valueAsString always returns string", () => {
	const stringSelect = new Select<string, true>({ multiple: true });
	const numberSelect = new Select<number, true>({ multiple: true });
	const objectSelect = new Select<{ id: number }, true>({ multiple: true });

	// valueAsString should always return string regardless of T
	expectTypeOf(stringSelect.valueAsString).toEqualTypeOf<string>();
	expectTypeOf(numberSelect.valueAsString).toEqualTypeOf<string>();
	expectTypeOf(objectSelect.valueAsString).toEqualTypeOf<string>();
});

testWithEffect("Type inference tests: default generic should infer unknown", () => {
	// When no generic is provided, should default to unknown
	const select = new Select();

	// Should infer T as unknown
	expectTypeOf(select.value).toEqualTypeOf<unknown>();
	expectTypeOf(select.select).parameter(0).toEqualTypeOf<unknown>();
	expectTypeOf(select.isSelected).parameter(0).toEqualTypeOf<unknown>();
	expectTypeOf(select.highlighted).toEqualTypeOf<unknown>();
});

testWithEffect("Type inference tests: default multiple should infer false", () => {
	// When no multiple is provided, should default to false
	const select = new Select<number>();

	// Should infer Multiple as false, so value is T | undefined
	expectTypeOf(select.value).toEqualTypeOf<number | undefined>();

	// With explicit multiple: true
	const multipleSelect = new Select<number, true>({ multiple: true });
	expectTypeOf(multipleSelect.value).toEqualTypeOf<SvelteSet<number>>();
});

testWithEffect("Type inference tests: props value type inference", () => {
	// Test that props correctly infer the generic types
	const stringValue = "test";
	const numberValue = 42;
	const objectValue = { id: 1, name: "test" };

	// String value should infer string type
	const stringSelect = new Select({ value: stringValue });
	expectTypeOf(stringSelect.value).toEqualTypeOf<string | undefined>();

	// Number value should infer number type
	const numberSelect = new Select({ value: numberValue });
	expectTypeOf(numberSelect.value).toEqualTypeOf<number | undefined>();

	// Object value should infer object type
	const objectSelect = new Select({ value: objectValue });
	expectTypeOf(objectSelect.value).toEqualTypeOf<{ id: number; name: string } | undefined>();
});

testWithEffect("Type inference tests: multiple value type inference", () => {
	// Test that multiple selection with SvelteSet infers correctly
	const stringSet = new SvelteSet(["a", "b"]);
	const numberSet = new SvelteSet([1, 2, 3]);

	const stringSelect = new Select({ value: stringSet, multiple: true });
	expectTypeOf(stringSelect.value).toEqualTypeOf<SvelteSet<string>>();

	const numberSelect = new Select({ value: numberSet, multiple: true });
	expectTypeOf(numberSelect.value).toEqualTypeOf<SvelteSet<number>>();
});

testWithEffect("Type inference tests: callback parameter inference", () => {
	// Test that callback parameters infer the correct types
	const _select = new Select({
		value: "string",
		onValueChange: (value) => {
			// value should be inferred as string | undefined for single selection
			expectTypeOf(value).toEqualTypeOf<string | undefined>();
		},
		onHighlightChange: (highlighted) => {
			// highlighted should be inferred as string | null
			expectTypeOf(highlighted).toEqualTypeOf<string | null>();
		},
	});

	const _multipleSelect = new Select({
		value: "string",
		multiple: true,
		onValueChange: (value) => {
			// value should be inferred as SvelteSet<string> for multiple selection
			expectTypeOf(value).toEqualTypeOf<SvelteSet<string>>();
		},
	});
});

testWithEffect("Type inference tests: getter function inference", () => {
	// Test that getter functions infer correctly
	const getValue = () => "test" as string | undefined;
	const getHighlighted = () => null as string | null;

	const select = new Select({
		value: getValue,
		highlighted: getHighlighted,
	});

	// Should infer string from the getter return type
	expectTypeOf(select.value).toEqualTypeOf<string | undefined>();
	expectTypeOf(select.highlighted).toEqualTypeOf<string | null>();
});

testWithEffect("Type inference tests: complex inference scenarios", () => {
	interface User {
		id: number;
		name: string;
	}

	// Test inference with complex object and getter
	const getUsers = () => new SvelteSet<User>();
	const getUserHighlighted = () => null as User | null;

	const select = new Select({
		value: getUsers,
		highlighted: getUserHighlighted,
		multiple: true,
		onValueChange: (value) => {
			// Should infer SvelteSet<User>
			expectTypeOf(value).toEqualTypeOf<SvelteSet<User>>();
		},
		onHighlightChange: (highlighted) => {
			// Should infer User | null
			expectTypeOf(highlighted).toEqualTypeOf<User | null>();
		},
	});

	expectTypeOf(select.value).toEqualTypeOf<SvelteSet<User>>();
	expectTypeOf(select.highlighted).toEqualTypeOf<User | null>();
});

testWithEffect("Type tests: label getter", () => {
	const select = new Select<string>();

	// label should return HTMLLabelAttributes
	expectTypeOf(select.label).toHaveProperty("for").toEqualTypeOf<string>();
});

testWithEffect("Type tests: trigger getter", () => {
	const select = new Select<string>();

	// trigger should return object with specific properties
	expectTypeOf(select.trigger).toHaveProperty("id").toEqualTypeOf<string>();
	expectTypeOf(select.trigger).toHaveProperty("aria-expanded").toEqualTypeOf<boolean>();
	expectTypeOf(select.trigger).toHaveProperty("disabled").toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: content getter", () => {
	const select = new Select<string>();

	// content should return object with specific properties
	expectTypeOf(select.content).toHaveProperty("role").toEqualTypeOf<"listbox">();
	expectTypeOf(select.content).toHaveProperty("aria-expanded").toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: scrollAlignment property", () => {
	const select = new Select<string>();

	// scrollAlignment should be derived from props
	expectTypeOf(select.scrollAlignment).toEqualTypeOf<"nearest" | "center" | null>();
});

testWithEffect("Type tests: multiple property", () => {
	const singleSelect = new Select<string>();
	const multipleSelect = new Select<string, true>({ multiple: true });

	// multiple should be boolean derived from props
	expectTypeOf(singleSelect.multiple).toEqualTypeOf<false>();
	expectTypeOf(multipleSelect.multiple).toEqualTypeOf<true>();
});

testWithEffect("Type tests: disabled property", () => {
	const enabledSelect = new Select<string>();
	const disabledSelect = new Select<string>({
		disabled: true,
	});

	// disabled should be boolean derived from props
	expectTypeOf(enabledSelect.disabled).toEqualTypeOf<boolean>(false);
	expectTypeOf(disabledSelect.disabled).toEqualTypeOf<boolean>(true);
});
