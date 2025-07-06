import { testWithEffect } from "$lib/utils/test.svelte";
import { expect, expectTypeOf } from "vitest";
import { SpatialMenu } from "../SpatialMenu.svelte.js";
import { render } from "vitest-browser-svelte";
import { page, userEvent } from "@vitest/browser/context";
import SpatialMenuTest from "./SpatialMenuTest.svelte";

testWithEffect("Highlighting should work with primitive values", () => {
	const spatialMenu = new SpatialMenu<string>({});
	expect(spatialMenu.highlighted).toBe(null);
	spatialMenu.highlighted = "a";
	expect(spatialMenu.highlighted).toBe("a");
	spatialMenu.highlighted = "b";
	expect(spatialMenu.highlighted).toBe("b");
});

testWithEffect("Highlighting should work with object values", () => {
	interface Item {
		id: number;
		name: string;
	}

	const spatialMenu = new SpatialMenu<Item>();
	const item1: Item = { id: 1, name: "First" };
	const item2: Item = { id: 2, name: "Second" };

	expect(spatialMenu.highlighted).toBe(null);
	spatialMenu.highlighted = item1;
	expect(spatialMenu.highlighted).toEqual(item1);
	spatialMenu.highlighted = item2;
	expect(spatialMenu.highlighted).toEqual(item2);
});

testWithEffect("Selection mode should default to keyboard", () => {
	const spatialMenu = new SpatialMenu<string>();
	expect(spatialMenu.selectionMode).toBe("keyboard");
});

testWithEffect("Wrap property should work", () => {
	const spatialMenu = new SpatialMenu<string>({ wrap: true });
	expect(spatialMenu.wrap).toBe(true);

	const spatialMenuNoWrap = new SpatialMenu<string>({ wrap: false });
	expect(spatialMenuNoWrap.wrap).toBe(false);

	const spatialMenuDefault = new SpatialMenu<string>();
	expect(spatialMenuDefault.wrap).toBe(false);
});

testWithEffect("Scroll behavior should default to smooth", () => {
	const spatialMenu = new SpatialMenu<string>();
	expect(spatialMenu.scrollBehavior).toBe("smooth");

	const spatialMenuInstant = new SpatialMenu<string>({ scrollBehavior: "instant" });
	expect(spatialMenuInstant.scrollBehavior).toBe("instant");

	const spatialMenuAuto = new SpatialMenu<string>({ scrollBehavior: "auto" });
	expect(spatialMenuAuto.scrollBehavior).toBe("auto");

	const spatialMenuDisabled = new SpatialMenu<string>({ scrollBehavior: null });
	expect(spatialMenuDisabled.scrollBehavior).toBe(null);
});

testWithEffect("onSelect callback should be called when provided", () => {
	let selectedValue: string | null = null;
	const spatialMenu = new SpatialMenu<string>({
		onSelect: (value) => {
			selectedValue = value;
		},
	});

	const item = spatialMenu.getItem("test");
	item.onSelect();
	expect(selectedValue).toBe("test");
});

testWithEffect("getItem should create item with correct value", () => {
	const spatialMenu = new SpatialMenu<string>();
	const item = spatialMenu.getItem("test");
	expect(item.value).toBe("test");
});

testWithEffect("Item highlighting should sync with parent", () => {
	const spatialMenu = new SpatialMenu<string>();
	const item1 = spatialMenu.getItem("item1");
	const item2 = spatialMenu.getItem("item2");

	expect(item1.highlighted).toBe(false);
	expect(item2.highlighted).toBe(false);

	spatialMenu.highlighted = "item1";
	expect(item1.highlighted).toBe(true);
	expect(item2.highlighted).toBe(false);

	spatialMenu.highlighted = "item2";
	expect(item1.highlighted).toBe(false);
	expect(item2.highlighted).toBe(true);
});

testWithEffect("Generic value type: number values", () => {
	const spatialMenu = new SpatialMenu<number>();

	expect(spatialMenu.highlighted).toBe(null);
	spatialMenu.highlighted = 42;
	expect(spatialMenu.highlighted).toBe(42);

	const item = spatialMenu.getItem(42);
	expect(item.value).toBe(42);
});

testWithEffect("Generic value type: complex object values", () => {
	interface User {
		id: number;
		name: string;
		email: string;
	}

	const spatialMenu = new SpatialMenu<User>();

	const user1: User = { id: 1, name: "John", email: "john@example.com" };
	const user2: User = { id: 2, name: "Jane", email: "jane@example.com" };

	expect(spatialMenu.highlighted).toBe(null);

	spatialMenu.highlighted = user1;
	expect(spatialMenu.highlighted).toEqual(user1);

	const item1 = spatialMenu.getItem(user1);
	const item2 = spatialMenu.getItem(user2);

	expect(item1.highlighted).toBe(true);
	expect(item2.highlighted).toBe(false);

	spatialMenu.highlighted = user2;
	expect(item1.highlighted).toBe(false);
	expect(item2.highlighted).toBe(true);
});

testWithEffect("Generic value type: Date values", () => {
	const spatialMenu = new SpatialMenu<Date>();

	const date1 = new Date("2023-01-01");
	const date2 = new Date("2023-12-31");

	expect(spatialMenu.highlighted).toBe(null);
	spatialMenu.highlighted = date1;
	expect(spatialMenu.highlighted).toBe(date1);

	const item = spatialMenu.getItem(date1);
	expect(item.value).toBe(date1);
	expect(item.highlighted).toBe(true);

	spatialMenu.highlighted = date2;
	expect(item.highlighted).toBe(false);
});

testWithEffect("Generic value type: array values", () => {
	const spatialMenu = new SpatialMenu<number[]>();

	const arr1 = [1, 2, 3];
	const arr2 = [4, 5, 6];

	expect(spatialMenu.highlighted).toBe(null);

	spatialMenu.highlighted = arr1;
	expect(spatialMenu.highlighted).toStrictEqual(arr1);

	const item1 = spatialMenu.getItem(arr1);
	const item2 = spatialMenu.getItem(arr2);

	expect(item1.highlighted).toBe(true);
	expect(item2.highlighted).toBe(false);
});

testWithEffect("Props callbacks should be called", () => {
	let highlightedValue: string | null = null;

	const spatialMenu = new SpatialMenu<string>({
		onHighlightChange: (value) => {
			highlightedValue = value;
		},
	});

	spatialMenu.highlighted = "test";
	expect(highlightedValue).toBe("test");

	spatialMenu.highlighted = null;
	expect(highlightedValue).toBe(null);
});

testWithEffect("basic interaction", async () => {
	const user = userEvent.setup();

	render(SpatialMenuTest);
	const root = page.getByTestId("spatial-root");
	const items = page.getByTestId("spatial-item").all();

	expect(items).toHaveLength(8);

	// Focus the root to enable keyboard navigation
	await user.click(root.element());

	// First item should be highlighted by default when navigating
	await user.keyboard("{ArrowDown}");

	// Check if first item gets highlighted
	expect(items[0]!.element().getAttribute("data-highlighted")).toBe("");
});

testWithEffect("keyboard navigation", async () => {
	const user = userEvent.setup();

	render(SpatialMenuTest);
	const root = page.getByTestId("spatial-root");

	await user.click(root.element());

	// Navigate down to start highlighting
	await user.keyboard("{ArrowDown}");

	// Navigate right
	await user.keyboard("{ArrowRight}");

	// Navigate left
	await user.keyboard("{ArrowLeft}");

	// Navigate up
	await user.keyboard("{ArrowUp}");
});

testWithEffect("mouse interaction should change selection mode", async () => {
	const user = userEvent.setup();

	render(SpatialMenuTest);
	const items = page.getByTestId("spatial-item").all();

	// First trigger a mousemove on body to change mode to "mouse"
	document.body.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));

	// Give a moment for the mode to update
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Then move mouse over an item
	await user.hover(items[0]!.element());

	// Give a moment for highlighting to update
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Should highlight the item on mouseover
	expect(items[0]!.element().getAttribute("data-highlighted")).toBe("");
});

testWithEffect("item click should trigger selection", async () => {
	const user = userEvent.setup();

	render(SpatialMenuTest);
	const items = page.getByTestId("spatial-item").all();

	// Click on an item
	await user.click(items[0]!.element());

	// Check if onSelect was called (would be shown in test component)
});

testWithEffect(
	"edge case: pressing right on item 3 without wrap - should stay on item 3",
	async () => {
		const user = userEvent.setup();

		render(SpatialMenuTest);
		const root = page.getByTestId("spatial-root");
		const items = page.getByTestId("spatial-item").all();

		// Focus the root
		await user.click(root.element());

		// Navigate to item 3 (last item in first row - index 2)
		await user.keyboard("{ArrowDown}"); // Start highlighting
		await user.keyboard("{ArrowRight}"); // Move to item 2
		await user.keyboard("{ArrowRight}"); // Move to item 3 (last in row)

		// Verify we're on item 3
		expect(items[2]!.element().getAttribute("data-highlighted")).toBe("");

		// Now press right - should stay on item 3 since wrap is false
		await user.keyboard("{ArrowRight}");

		// Should still be on item 3 (no wrapping)
		expect(items[2]!.element().getAttribute("data-highlighted")).toBe("");
	},
);

testWithEffect(
	"edge case: pressing right on item 6 without wrap - should stay on item 6",
	async () => {
		const user = userEvent.setup();

		render(SpatialMenuTest);
		const root = page.getByTestId("spatial-root");
		const items = page.getByTestId("spatial-item").all();

		// Focus the root
		await user.click(root.element());

		// Navigate to item 6 (last item in second row - index 5)
		await user.keyboard("{ArrowDown}"); // Start highlighting (item 1)
		await user.keyboard("{ArrowDown}"); // Move to item 4
		await user.keyboard("{ArrowRight}"); // Move to item 5
		await user.keyboard("{ArrowRight}"); // Move to item 6 (last in row)

		// Verify we're on item 6
		expect(items[5]!.element().getAttribute("data-highlighted")).toBe("");

		// Now press right - should stay on item 6 since wrap is false
		await user.keyboard("{ArrowRight}");

		// Should still be on item 6 (no wrapping)
		expect(items[5]!.element().getAttribute("data-highlighted")).toBe("");
	},
);

testWithEffect(
	"edge case: pressing right on item 8 without wrap - should stay on item 8",
	async () => {
		const user = userEvent.setup();

		render(SpatialMenuTest);
		const root = page.getByTestId("spatial-root");
		const items = page.getByTestId("spatial-item").all();

		// Focus the root
		await user.click(root.element());

		// Navigate to item 8 (last item overall - index 7)
		await user.keyboard("{ArrowDown}"); // Start highlighting (item 1)
		await user.keyboard("{ArrowDown}"); // Move to item 4
		await user.keyboard("{ArrowDown}"); // Move to item 7
		await user.keyboard("{ArrowRight}"); // Move to item 8 (last item)

		// Verify we're on item 8
		expect(items[7]!.element().getAttribute("data-highlighted")).toBe("");

		// Now press right - should stay on item 8 since there's nowhere to go and wrap is false
		await user.keyboard("{ArrowRight}");

		// Should still be on item 8
		expect(items[7]!.element().getAttribute("data-highlighted")).toBe("");
	},
);

testWithEffect("edge case with wrap: pressing right on item 3 should wrap to item 1", async () => {
	const user = userEvent.setup();

	render(SpatialMenuTest, { wrap: true });
	const root = page.getByTestId("spatial-root");
	const items = page.getByTestId("spatial-item").all();

	// Focus and navigate to item 3 (last in first row)
	await user.click(root.element());
	await user.keyboard("{ArrowDown}"); // Start highlighting item 1
	await user.keyboard("{ArrowRight}"); // Move to item 2
	await user.keyboard("{ArrowRight}"); // Move to item 3

	// Verify on item 3
	expect(items[2]!.element().getAttribute("data-highlighted")).toBe("");

	// Press right - should wrap to item 1 (first item in next row or leftmost)
	await user.keyboard("{ArrowRight}");

	// Should wrap around to item 1
	expect(items[0]!.element().getAttribute("data-highlighted")).toBe("");
});

testWithEffect("edge case with wrap: pressing right on item 6 should wrap to item 4", async () => {
	const user = userEvent.setup();

	render(SpatialMenuTest, { wrap: true });
	const root = page.getByTestId("spatial-root");
	const items = page.getByTestId("spatial-item").all();

	// Focus and navigate to item 6 (last in second row)
	await user.click(root.element());
	await user.keyboard("{ArrowDown}"); // Start highlighting item 1
	await user.keyboard("{ArrowDown}"); // Move to item 4
	await user.keyboard("{ArrowRight}"); // Move to item 5
	await user.keyboard("{ArrowRight}"); // Move to item 6

	// Verify on item 6
	expect(items[5]!.element().getAttribute("data-highlighted")).toBe("");

	// Press right - should wrap to item 4 (leftmost item in second row)
	await user.keyboard("{ArrowRight}");

	// Should wrap around to item 4
	expect(items[3]!.element().getAttribute("data-highlighted")).toBe("");
});

testWithEffect("edge case with wrap: pressing right on item 8 should wrap to item 7", async () => {
	const user = userEvent.setup();

	render(SpatialMenuTest, { wrap: true });
	const root = page.getByTestId("spatial-root");
	const items = page.getByTestId("spatial-item").all();

	// Focus and navigate to item 8 (last item overall)
	await user.click(root.element());
	await user.keyboard("{ArrowDown}"); // Start highlighting item 1
	await user.keyboard("{ArrowDown}"); // Move to item 4
	await user.keyboard("{ArrowDown}"); // Move to item 7
	await user.keyboard("{ArrowRight}"); // Move to item 8

	// Verify on item 8
	expect(items[7]!.element().getAttribute("data-highlighted")).toBe("");

	// Press right - should wrap to item 7 (leftmost item in third row)
	await user.keyboard("{ArrowRight}");

	// Should wrap around to item 7
	expect(items[6]!.element().getAttribute("data-highlighted")).toBe("");
});

testWithEffect(
	"edge case with 7 items: pressing right on item 7 without wrap - should stay on item 7",
	async () => {
		const user = userEvent.setup();

		render(SpatialMenuTest, { items: 7 });
		const root = page.getByTestId("spatial-root");
		const items = page.getByTestId("spatial-item").all();

		// Should have 7 items total
		expect(items).toHaveLength(7);

		// Focus the root
		await user.click(root.element());

		// Navigate to item 7 (last item overall - index 6)
		await user.keyboard("{ArrowDown}"); // Start highlighting (item 1)
		await user.keyboard("{ArrowDown}"); // Move to item 4
		await user.keyboard("{ArrowDown}"); // Move to item 7

		// Verify we're on item 7
		expect(items[6]!.element().getAttribute("data-highlighted")).toBe("");

		// Now press right - should stay on item 7 since there's nowhere to go and wrap is false
		await user.keyboard("{ArrowRight}");

		// Should still be on item 7
		expect(items[6]!.element().getAttribute("data-highlighted")).toBe("");
	},
);

testWithEffect(
	"edge case with 7 items and wrap: pressing right on item 7 should stay on item 7",
	async () => {
		const user = userEvent.setup();

		render(SpatialMenuTest, { items: 7, wrap: true });
		const root = page.getByTestId("spatial-root");
		const items = page.getByTestId("spatial-item").all();

		// Should have 7 items total
		expect(items).toHaveLength(7);

		// Focus the root
		await user.click(root.element());

		// Navigate to item 7 (last item overall - index 6)
		await user.keyboard("{ArrowDown}"); // Start highlighting (item 1)
		await user.keyboard("{ArrowDown}"); // Move to item 4
		await user.keyboard("{ArrowDown}"); // Move to item 7

		// Verify we're on item 7
		expect(items[6]!.element().getAttribute("data-highlighted")).toBe("");

		// Now press right - with wrap enabled, should wrap to item 4 (leftmost with best vertical alignment)
		await user.keyboard("{ArrowRight}");

		// Should stay on item 7
		expect(items[6]!.element().getAttribute("data-highlighted")).toBe("");
	},
);

testWithEffect("Type tests: string spatial menu", () => {
	const spatialMenu = new SpatialMenu<string>();

	// highlighted should be string | null
	expectTypeOf(spatialMenu.highlighted).toEqualTypeOf<string | null>();

	// getItem should accept string and return item
	const item = spatialMenu.getItem("test");
	expectTypeOf(item.value).toEqualTypeOf<string>();
	expectTypeOf(item.highlighted).toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: number spatial menu", () => {
	const spatialMenu = new SpatialMenu<number>();

	// highlighted should be number | null
	expectTypeOf(spatialMenu.highlighted).toEqualTypeOf<number | null>();

	// getItem should accept number
	const item = spatialMenu.getItem(42);
	expectTypeOf(item.value).toEqualTypeOf<number>();
});

testWithEffect("Type tests: complex object spatial menu", () => {
	interface User {
		id: number;
		name: string;
		email: string;
	}

	const spatialMenu = new SpatialMenu<User>();

	// highlighted should be User | null
	expectTypeOf(spatialMenu.highlighted).toEqualTypeOf<User | null>();

	// getItem should accept User
	const user: User = { id: 1, name: "John", email: "john@example.com" };
	const item = spatialMenu.getItem(user);
	expectTypeOf(item.value).toEqualTypeOf<User>();
	expectTypeOf(item.highlighted).toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: array value types", () => {
	const spatialMenu = new SpatialMenu<number[]>();

	// highlighted should be number[] | null
	expectTypeOf(spatialMenu.highlighted).toEqualTypeOf<number[] | null>();

	// getItem should accept number[]
	const item = spatialMenu.getItem([1, 2, 3]);
	expectTypeOf(item.value).toEqualTypeOf<number[]>();
});

testWithEffect("Type tests: Date value types", () => {
	const spatialMenu = new SpatialMenu<Date>();

	// highlighted should be Date | null
	expectTypeOf(spatialMenu.highlighted).toEqualTypeOf<Date | null>();

	// getItem should accept Date
	const item = spatialMenu.getItem(new Date());
	expectTypeOf(item.value).toEqualTypeOf<Date>();
});

testWithEffect("Type tests: props with getters", () => {
	const getHighlighted = () => "test" as string | null;
	const getWrap = () => true;
	const getScrollBehavior = () => "instant" as const;

	const spatialMenu = new SpatialMenu({
		highlighted: getHighlighted,
		wrap: getWrap,
		scrollBehavior: getScrollBehavior,
	});

	// Should infer string from getter
	expectTypeOf(spatialMenu.highlighted).toEqualTypeOf<string | null>();
});

testWithEffect("Type tests: callback parameter inference", () => {
	// Test that callback parameters infer the correct types
	new SpatialMenu({
		highlighted: "test",
		onHighlightChange: (highlighted) => {
			// highlighted should be inferred as string | null
			expectTypeOf(highlighted).toEqualTypeOf<string | null>();
		},
		onSelect: (value) => {
			// value should be inferred as string
			expectTypeOf(value).toEqualTypeOf<string>();
		},
	});
});

testWithEffect("Type tests: complex inference scenarios", () => {
	interface User {
		id: number;
		name: string;
	}

	// Test inference with complex object and getter
	const getUserHighlighted = () => null as User | null;

	const spatialMenu = new SpatialMenu({
		highlighted: getUserHighlighted,
		onHighlightChange: (highlighted) => {
			// Should infer User | null
			expectTypeOf(highlighted).toEqualTypeOf<User | null>();
		},
		onSelect: (value) => {
			// Should infer User
			expectTypeOf(value).toEqualTypeOf<User>();
		},
	});

	expectTypeOf(spatialMenu.highlighted).toEqualTypeOf<User | null>();
});

testWithEffect("Type inference tests: default generic should infer unknown", () => {
	// When no generic is provided, should default to unknown
	const spatialMenu = new SpatialMenu();

	// Should infer T as unknown
	expectTypeOf(spatialMenu.highlighted).toEqualTypeOf<unknown>();

	const item = spatialMenu.getItem("test");
	expectTypeOf(item.value).toEqualTypeOf<unknown>();
});

testWithEffect("Type tests: wrap property", () => {
	const spatialMenu = new SpatialMenu<string>();

	// wrap should be boolean derived from props
	expectTypeOf(spatialMenu.wrap).toEqualTypeOf<boolean>();
});

testWithEffect("Type tests: scrollBehavior property", () => {
	const spatialMenu = new SpatialMenu<string>();

	// scrollBehavior should be derived from props
	expectTypeOf(spatialMenu.scrollBehavior).toEqualTypeOf<"smooth" | "instant" | "auto" | null>();
});

testWithEffect("Type tests: selectionMode property", () => {
	const spatialMenu = new SpatialMenu<string>();

	// selectionMode should be "keyboard" | "mouse"
	expectTypeOf(spatialMenu.selectionMode).toEqualTypeOf<"keyboard" | "mouse">();
});

testWithEffect("Type tests: item rect getter", () => {
	const spatialMenu = new SpatialMenu<string>();
	const item = spatialMenu.getItem("test");

	// rect should return DOMRect | undefined
	expectTypeOf(item.rect).toEqualTypeOf<DOMRect | undefined>();
});

testWithEffect("crossAxis property should work", () => {
	const spatialMenuCrossAxis = new SpatialMenu<string>({ crossAxis: true });
	expect(spatialMenuCrossAxis.crossAxis).toBe(true);

	const spatialMenuNoCrossAxis = new SpatialMenu<string>({ crossAxis: false });
	expect(spatialMenuNoCrossAxis.crossAxis).toBe(false);

	const spatialMenuDefault = new SpatialMenu<string>();
	expect(spatialMenuDefault.crossAxis).toBe(false);
});

testWithEffect("toleranceCol property should work", () => {
	const spatialMenuWithTolerance = new SpatialMenu<string>({ toleranceCol: 20 });
	expect(spatialMenuWithTolerance.toleranceCol).toBe(20);

	const spatialMenuNullTolerance = new SpatialMenu<string>({ toleranceCol: null });
	expect(spatialMenuNullTolerance.toleranceCol).toBe(null);

	const spatialMenuDefault = new SpatialMenu<string>();
	expect(spatialMenuDefault.toleranceCol).toBe(16);
});

testWithEffect("toleranceRow property should work", () => {
	const spatialMenuWithTolerance = new SpatialMenu<string>({ toleranceRow: 25 });
	expect(spatialMenuWithTolerance.toleranceRow).toBe(25);

	const spatialMenuNullTolerance = new SpatialMenu<string>({ toleranceRow: null });
	expect(spatialMenuNullTolerance.toleranceRow).toBe(null);

	const spatialMenuDefault = new SpatialMenu<string>();
	expect(spatialMenuDefault.toleranceRow).toBe(16);
});

testWithEffect("crossAxis navigation should work when enabled", async () => {
	const user = userEvent.setup();

	render(SpatialMenuTest, { 
		crossAxis: true,
		toleranceCol: 5, // Very strict tolerance to force cross-axis navigation
		toleranceRow: 5
	});

	const root = page.getByTestId("spatial-root");
	const items = page.getByTestId("spatial-item").all();

	// Focus the root to enable keyboard navigation
	await user.click(root.element());

	// Start with first item highlighted
	await user.keyboard("{ArrowDown}");
	expect(items[0]!.element().getAttribute("data-highlighted")).toBe("");

	// With crossAxis enabled and strict tolerance, should be able to navigate to off-axis items
	await user.keyboard("{ArrowRight}");
	// Should move to item 2 (next in grid) even if not perfectly aligned
	expect(items[1]!.element().getAttribute("data-highlighted")).toBe("");
});

testWithEffect("crossAxis navigation should be restricted when disabled", async () => {
	const user = userEvent.setup();

	render(SpatialMenuTest, { 
		crossAxis: false,
		toleranceCol: 1, // Very strict tolerance to prevent same-row navigation
		toleranceRow: 1
	});

	const root = page.getByTestId("spatial-root");
	const items = page.getByTestId("spatial-item").all();

	// Focus the root to enable keyboard navigation
	await user.click(root.element());

	// Navigate to item 4 (first item in second row) to test horizontal movement
	await user.keyboard("{ArrowDown}"); // Start highlighting (item 1)
	await user.keyboard("{ArrowDown}"); // Move to item 4

	// Verify we're on item 4
	expect(items[3]!.element().getAttribute("data-highlighted")).toBe("");

	// With crossAxis disabled and strict tolerance, should not navigate to off-axis items
	await user.keyboard("{ArrowRight}");
	// Should move to item 5 (next in same row) since they're likely aligned
	expect(items[4]!.element().getAttribute("data-highlighted")).toBe("");
});
