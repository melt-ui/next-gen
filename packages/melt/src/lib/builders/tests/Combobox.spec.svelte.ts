import { testWithEffect } from "$lib/utils/test.svelte";
import userEvent from "@testing-library/user-event";
import { SvelteSet } from "svelte/reactivity";
import { expect, expectTypeOf } from "vitest";
import { render } from "vitest-browser-svelte";
import { Combobox } from "../Combobox.svelte.js";
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

testWithEffect("Generic value type: number values", () => {
	const combobox = new Combobox<number>();

	expect(combobox.value).toBe(undefined);
	combobox.select(42);
	expect(combobox.value).toBe(42);
	expect(combobox.isSelected(42)).toBe(true);
	expect(combobox.isSelected(43)).toBe(false);
});

testWithEffect("Generic value type: complex object values", () => {
	interface User {
		id: number;
		name: string;
		email: string;
	}

	const combobox = new Combobox<User, true>({ multiple: true });

	const user1: User = { id: 1, name: "John", email: "john@example.com" };
	const user2: User = { id: 2, name: "Jane", email: "jane@example.com" };

	expect(combobox.value).toEqual(new SvelteSet([]));

	combobox.select(user1);
	expect(combobox.value).toEqual(new SvelteSet([user1]));
	expect(combobox.isSelected(user1)).toBe(true);

	combobox.select(user2);
	expect(combobox.value).toEqual(new SvelteSet([user1, user2]));
	expect(combobox.isSelected(user2)).toBe(true);

	// Test toggling off
	combobox.select(user1);
	expect(combobox.value).toEqual(new SvelteSet([user2]));
	expect(combobox.isSelected(user1)).toBe(false);
});

testWithEffect("Generic value type: Date values", () => {
	const combobox = new Combobox<Date>();

	const date1 = new Date("2023-01-01");
	const date2 = new Date("2023-12-31");

	expect(combobox.value).toBe(undefined);
	combobox.select(date1);
	expect(combobox.value).toBe(date1);
	expect(combobox.isSelected(date1)).toBe(true);
	expect(combobox.isSelected(date2)).toBe(false);
});

testWithEffect("Generic value type: array values", () => {
	const combobox = new Combobox<number[], true>({ multiple: true });

	const arr1 = [1, 2, 3];
	const arr2 = [4, 5, 6];

	expect(combobox.value).toEqual(new SvelteSet([]));

	combobox.select(arr1);
	expect(combobox.value).toEqual(new SvelteSet([arr1]));
	expect(combobox.isSelected(arr1)).toBe(true);

	combobox.select(arr2);
	expect(combobox.value).toEqual(new SvelteSet([arr1, arr2]));
	expect(combobox.isSelected(arr2)).toBe(true);
});

testWithEffect("Generic value type: highlighting with complex objects", () => {
	interface Product {
		id: string;
		name: string;
		price: number;
	}

	const combobox = new Combobox<Product>();

	const product1: Product = { id: "p1", name: "Laptop", price: 999 };
	const product2: Product = { id: "p2", name: "Mouse", price: 25 };

	expect(combobox.highlighted).toBe(null);

	combobox.highlight(product1);
	expect(combobox.highlighted).toEqual(product1);

	combobox.highlight(product2);
	expect(combobox.highlighted).toEqual(product2);

	// Test that highlighting doesn't affect selection
	expect(combobox.isSelected(product1)).toBe(false);
	expect(combobox.isSelected(product2)).toBe(false);
});

testWithEffect("Generic value type: option labels with complex objects", () => {
	interface Category {
		id: number;
		name: string;
		description: string;
	}

	const combobox = new Combobox<Category>();

	const category: Category = {
		id: 1,
		name: "Electronics",
		description: "Electronic devices and accessories",
	};

	// Before setting a label, should return empty string for complex objects
	expect(combobox.getOptionLabel(category)).toBe("");

	// After setting a label via getOption
	combobox.getOption(category, "Electronics Category");
	expect(combobox.getOptionLabel(category)).toBe("Electronics Category");
});

testWithEffect("Generic value type: option IDs are unique for different objects", () => {
	interface Item {
		id: number;
		value: string;
	}

	const combobox = new Combobox<Item>();

	const item1: Item = { id: 1, value: "first" };
	const item2: Item = { id: 2, value: "second" };
	const item3: Item = { id: 1, value: "different" }; // Same id but different object

	const id1 = combobox.getOptionId(item1);
	const id2 = combobox.getOptionId(item2);
	const id3 = combobox.getOptionId(item3);

	expect(id1).not.toBe(id2);
	expect(id1).not.toBe(id3);
	expect(id2).not.toBe(id3);
});

testWithEffect("Generic value type: valueAsString with complex objects", () => {
	interface Tag {
		id: number;
		name: string;
	}

	const combobox = new Combobox<Tag, true>({ multiple: true });

	const tag1: Tag = { id: 1, name: "urgent" };
	const tag2: Tag = { id: 2, name: "bug" };

	// Set labels for the tags
	combobox.getOption(tag1, "Urgent");
	combobox.getOption(tag2, "Bug");

	combobox.select(tag1);
	combobox.select(tag2);

	// valueAsString should work with the labels
	expect(combobox.valueAsString).toBe("Urgent, Bug");
});

testWithEffect("getOptionLabel returns correct labels", () => {
	const combobox = new Combobox<{ id: number; name: string }>();

	const item = { id: 1, name: "Test Item" };

	// Before setting a label, should return empty string
	expect(combobox.getOptionLabel(item)).toBe("");

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

	const screen = render(ComboboxTest);
	const input = screen.getByTestId("combobox");
	const listbox = screen.getByTestId("combobox-content");

	await expect.element(listbox).toHaveAttribute(
		"aria-expanded",
		"false",
	);

	await user.click(input.element());

	await expect.element(listbox).toHaveAttribute("aria-expanded", "true");

	const options = screen.getByTestId("combobox-option").all();
	expect(options).toHaveLength(3);

	// Click on the first option (number 1)
	await user.click(options[0]!.element()!);

	// Should be selected
	expect(options[0]!.element().getAttribute("aria-selected")).toEqual("true");
});

testWithEffect("Type tests: string combobox single selection", () => {
	const combobox = new Combobox<string>();

	// Value should be string | undefined for single selection
	expectTypeOf(combobox.value).toEqualTypeOf<string | undefined>();

	// Select method should accept string
	expectTypeOf(combobox.select).parameter(0).toEqualTypeOf<string>();

	// isSelected should accept string and return boolean
	expectTypeOf(combobox.isSelected).parameter(0).toEqualTypeOf<string>();
	expectTypeOf(combobox.isSelected).returns.toEqualTypeOf<boolean>();

	// highlighted should be string | null
	expectTypeOf(combobox.highlighted).toEqualTypeOf<string | null>();
});

testWithEffect("Type tests: string combobox multiple selection", () => {
	const combobox = new Combobox<string, true>({ multiple: true });

	// Value should be SvelteSet<string> for multiple selection
	expectTypeOf(combobox.value).toEqualTypeOf<SvelteSet<string>>();

	// Select method should still accept string
	expectTypeOf(combobox.select).parameter(0).toEqualTypeOf<string>();

	// isSelected should accept string and return boolean
	expectTypeOf(combobox.isSelected).parameter(0).toEqualTypeOf<string>();
	expectTypeOf(combobox.isSelected).returns.toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: number combobox single selection", () => {
	const combobox = new Combobox<number>();

	// Value should be number | undefined for single selection
	expectTypeOf(combobox.value).toEqualTypeOf<number | undefined>();

	// Select method should accept number
	expectTypeOf(combobox.select).parameter(0).toEqualTypeOf<number>();

	// isSelected should accept number and return boolean
	expectTypeOf(combobox.isSelected).parameter(0).toEqualTypeOf<number>();
	expectTypeOf(combobox.isSelected).returns.toEqualTypeOf<boolean>();

	// highlighted should be number | null
	expectTypeOf(combobox.highlighted).toEqualTypeOf<number | null>();
});

testWithEffect("Type tests: number combobox multiple selection", () => {
	const combobox = new Combobox<number, true>({ multiple: true });

	// Value should be SvelteSet<number> for multiple selection
	expectTypeOf(combobox.value).toEqualTypeOf<SvelteSet<number>>();

	// Select method should still accept number
	expectTypeOf(combobox.select).parameter(0).toEqualTypeOf<number>();
});

testWithEffect("Type tests: complex object combobox", () => {
	interface User {
		id: number;
		name: string;
		email: string;
	}

	const combobox = new Combobox<User>();

	// Value should be User | undefined for single selection
	expectTypeOf(combobox.value).toEqualTypeOf<User | undefined>();

	// Select method should accept User
	expectTypeOf(combobox.select).parameter(0).toEqualTypeOf<User>();

	// isSelected should accept User and return boolean
	expectTypeOf(combobox.isSelected).parameter(0).toEqualTypeOf<User>();
	expectTypeOf(combobox.isSelected).returns.toEqualTypeOf<boolean>();

	// highlighted should be User | null
	expectTypeOf(combobox.highlighted).toEqualTypeOf<User | null>();

	// getOptionLabel should accept User and return string
	expectTypeOf(combobox.getOptionLabel).parameter(0).toEqualTypeOf<User>();
	expectTypeOf(combobox.getOptionLabel).returns.toEqualTypeOf<string>();

	// getOptionId should accept User and return string
	expectTypeOf(combobox.getOptionId).parameter(0).toEqualTypeOf<User>();
	expectTypeOf(combobox.getOptionId).returns.toEqualTypeOf<string>();
});

testWithEffect("Type tests: complex object combobox multiple selection", () => {
	interface Product {
		id: string;
		name: string;
		price: number;
	}

	const combobox = new Combobox<Product, true>({ multiple: true });

	// Value should be SvelteSet<Product> for multiple selection
	expectTypeOf(combobox.value).toEqualTypeOf<SvelteSet<Product>>();

	// Select method should accept Product
	expectTypeOf(combobox.select).parameter(0).toEqualTypeOf<Product>();

	// isSelected should accept Product and return boolean
	expectTypeOf(combobox.isSelected).parameter(0).toEqualTypeOf<Product>();
	expectTypeOf(combobox.isSelected).returns.toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: array value types", () => {
	const combobox = new Combobox<number[]>();

	// Value should be number[] | undefined for single selection
	expectTypeOf(combobox.value).toEqualTypeOf<number[] | undefined>();

	// Select method should accept number[]
	expectTypeOf(combobox.select).parameter(0).toEqualTypeOf<number[]>();

	// isSelected should accept number[] and return boolean
	expectTypeOf(combobox.isSelected).parameter(0).toEqualTypeOf<number[]>();
	expectTypeOf(combobox.isSelected).returns.toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: Date value types", () => {
	const combobox = new Combobox<Date, true>({ multiple: true });

	// Value should be SvelteSet<Date> for multiple selection
	expectTypeOf(combobox.value).toEqualTypeOf<SvelteSet<Date>>();

	// Select method should accept Date
	expectTypeOf(combobox.select).parameter(0).toEqualTypeOf<Date>();

	// isSelected should accept Date and return boolean
	expectTypeOf(combobox.isSelected).parameter(0).toEqualTypeOf<Date>();
	expectTypeOf(combobox.isSelected).returns.toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: getOption method types", () => {
	interface Item {
		id: number;
		value: string;
	}

	const combobox = new Combobox<Item>();

	// getOption should accept Item, optional string label, and optional callback
	expectTypeOf(combobox.getOption).parameter(0).toEqualTypeOf<Item>();
	expectTypeOf(combobox.getOption).parameter(1).toEqualTypeOf<string | undefined>();
	expectTypeOf(combobox.getOption).parameter(2).toEqualTypeOf<(() => void) | undefined>();

	// getOption should return object with specific properties
	const option = combobox.getOption({ id: 1, value: "test" });
	expectTypeOf(option).toHaveProperty("id").toEqualTypeOf<string>();
	expectTypeOf(option).toHaveProperty("role").toEqualTypeOf<"option">();
	expectTypeOf(option).toHaveProperty("aria-selected").toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: valueAsString always returns string", () => {
	const stringCombobox = new Combobox<string, true>({ multiple: true });
	const numberCombobox = new Combobox<number, true>({ multiple: true });
	const objectCombobox = new Combobox<{ id: number }, true>({ multiple: true });

	// valueAsString should always return string regardless of T
	expectTypeOf(stringCombobox.valueAsString).toEqualTypeOf<string>();
	expectTypeOf(numberCombobox.valueAsString).toEqualTypeOf<string>();
	expectTypeOf(objectCombobox.valueAsString).toEqualTypeOf<string>();
});

testWithEffect("Type inference tests: default generic should infer unknown", () => {
	// When no generic is provided, should default to string
	const combobox = new Combobox();

	// Should infer T as string
	expectTypeOf(combobox.value).toEqualTypeOf<unknown>();
	expectTypeOf(combobox.select).parameter(0).toEqualTypeOf<unknown>();
	expectTypeOf(combobox.isSelected).parameter(0).toEqualTypeOf<unknown>();
	expectTypeOf(combobox.highlighted).toEqualTypeOf<unknown>();
});

testWithEffect("Type inference tests: default multiple should infer false", () => {
	// When no multiple is provided, should default to false
	const combobox = new Combobox<number>();

	// Should infer Multiple as false, so value is T | undefined
	expectTypeOf(combobox.value).toEqualTypeOf<number | undefined>();

	// With explicit multiple: true
	const multipleCombobox = new Combobox<number, true>({ multiple: true });
	expectTypeOf(multipleCombobox.value).toEqualTypeOf<SvelteSet<number>>();
});

testWithEffect("Type inference tests: props value type inference", () => {
	// Test that props correctly infer the generic types
	const stringValue = "test";
	const numberValue = 42;
	const objectValue = { id: 1, name: "test" };

	// String value should infer string type
	const stringCombobox = new Combobox({ value: stringValue });
	expectTypeOf(stringCombobox.value).toEqualTypeOf<string | undefined>();

	// Number value should infer number type
	const numberCombobox = new Combobox({ value: numberValue });
	expectTypeOf(numberCombobox.value).toEqualTypeOf<number | undefined>();

	// Object value should infer object type
	const objectCombobox = new Combobox({ value: objectValue });
	expectTypeOf(objectCombobox.value).toEqualTypeOf<{ id: number; name: string } | undefined>();
});

testWithEffect("Type inference tests: multiple value type inference", () => {
	// Test that multiple selection with SvelteSet infers correctly
	const stringSet = new SvelteSet(["a", "b"]);
	const numberSet = new SvelteSet([1, 2, 3]);

	const stringCombobox = new Combobox({ value: stringSet, multiple: true });
	expectTypeOf(stringCombobox.value).toEqualTypeOf<SvelteSet<string>>();

	const numberCombobox = new Combobox({ value: numberSet, multiple: true });
	expectTypeOf(numberCombobox.value).toEqualTypeOf<SvelteSet<number>>();
});

testWithEffect("Type inference tests: callback parameter inference", () => {
	// Test that callback parameters infer the correct types
	const _combobox = new Combobox({
		value: "string",
		onValueChange: (value) => {
			// value should be inferred as string | undefined for single selection
			expectTypeOf(value).toEqualTypeOf<string | undefined>();
		},
		onHighlightChange: (highlighted) => {
			// highlighted should be inferred as string | null
			expectTypeOf(highlighted).toEqualTypeOf<string | null>();
		},
		onInputValueChange: (inputValue) => {
			// inputValue should always be string
			expectTypeOf(inputValue).toEqualTypeOf<string>();
		},
	});

	const _multipleCombobox = new Combobox({
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
	const getInputValue = () => "input";

	const combobox = new Combobox({
		value: getValue,
		highlighted: getHighlighted,
		inputValue: getInputValue,
	});

	// Should infer string from the getter return type
	expectTypeOf(combobox.value).toEqualTypeOf<string | undefined>();
	expectTypeOf(combobox.highlighted).toEqualTypeOf<string | null>();
	expectTypeOf(combobox.inputValue).toEqualTypeOf<string>();
});

testWithEffect("Type inference tests: complex inference scenarios", () => {
	interface User {
		id: number;
		name: string;
	}

	// Test inference with complex object and getter
	const getUsers = () => new SvelteSet<User>();
	const getUserHighlighted = () => null as User | null;

	const combobox = new Combobox({
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

	expectTypeOf(combobox.value).toEqualTypeOf<SvelteSet<User>>();
	expectTypeOf(combobox.highlighted).toEqualTypeOf<User | null>();
});
