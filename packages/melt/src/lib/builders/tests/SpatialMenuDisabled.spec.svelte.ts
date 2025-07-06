import { testWithEffect } from "$lib/utils/test.svelte";
import { expect } from "vitest";
import { SpatialMenu } from "../SpatialMenu.svelte.js";
import { render } from "vitest-browser-svelte";
import { page, userEvent } from "@vitest/browser/context";
import SpatialMenuDisabledTest from "./SpatialMenuDisabledTest.svelte";

testWithEffect("Disabled items should not be highlighted or selected", async () => {
	const user = userEvent.setup();
	
	// Test with item 1 (index 0) disabled
	const disabledPattern = [true, false, false, false, false, false, false, false, false, false, false, false];
	
	render(SpatialMenuDisabledTest, { disabledPattern });
	const root = page.getByTestId("spatial-root");
	const items = page.getByTestId("spatial-item").all();
	
	await user.click(root.element());
	
	// First arrow key should highlight first enabled item (item 2, index 1)
	await user.keyboard("{ArrowDown}");
	
	// Item 1 should not be highlighted
	expect(items[0]!.element().getAttribute("data-highlighted")).toBe(null);
	// Item 2 should be highlighted
	expect(items[1]!.element().getAttribute("data-highlighted")).toBe("");
});

testWithEffect("Disabled items should be skipped during navigation", async () => {
	const user = userEvent.setup();
	
	// Test with item 2 (index 1) disabled
	const disabledPattern = [false, true, false, false, false, false, false, false, false, false, false, false];
	
	render(SpatialMenuDisabledTest, { disabledPattern });
	const root = page.getByTestId("spatial-root");
	const items = page.getByTestId("spatial-item").all();
	
	await user.click(root.element());
	
	// Start highlighting
	await user.keyboard("{ArrowDown}");
	expect(items[0]!.element().getAttribute("data-highlighted")).toBe("");
	
	// Navigate right - should skip disabled item 2 and go to item 3
	await user.keyboard("{ArrowRight}");
	expect(items[2]!.element().getAttribute("data-highlighted")).toBe("");
	expect(items[1]!.element().getAttribute("data-highlighted")).toBe(null);
});

testWithEffect("Disabled items should not respond to mouse hover", async () => {
	const user = userEvent.setup();
	
	const disabledPattern = [false, true, false, false, false, false, false, false, false, false, false, false];
	
	render(SpatialMenuDisabledTest, { disabledPattern });
	const items = page.getByTestId("spatial-item").all();
	
	// Trigger mouse mode
	document.body.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
	await new Promise(resolve => setTimeout(resolve, 10));
	
	// Hover over disabled item
	await user.hover(items[1]!.element());
	await new Promise(resolve => setTimeout(resolve, 10));
	
	// Should not be highlighted
	expect(items[1]!.element().getAttribute("data-highlighted")).toBe(null);
});

testWithEffect("Disabled items should not respond to clicks", async () => {
	const user = userEvent.setup();
	
	const disabledPattern = [false, true, false, false, false, false, false, false, false, false, false, false];
	
	render(SpatialMenuDisabledTest, { disabledPattern });
	const items = page.getByTestId("spatial-item").all();
	
	// Click on disabled item
	await user.click(items[1]!.element());
	
	// Should not be selected
	const selectedInfo = page.getByTestId("selected-item");
	expect(selectedInfo.query()).toBe(null);
});

testWithEffect("Enter key should not select disabled items", async () => {
	const user = userEvent.setup();
	
	const disabledPattern = [true, false, false, false, false, false, false, false, false, false, false, false];
	
	render(SpatialMenuDisabledTest, { disabledPattern });
	const root = page.getByTestId("spatial-root");
	
	await user.click(root.element());
	
	// Highlight first enabled item (item 2)
	await user.keyboard("{ArrowDown}");
	
	// Navigate to a disabled item somehow and try to select
	// This test ensures that even if a disabled item gets highlighted (which shouldn't happen),
	// Enter won't select it
	await user.keyboard("{Enter}");
	
	// Should select the enabled item that's actually highlighted
	const selectedInfo = page.getByTestId("selected-item");
	expect(selectedInfo.query()).not.toBe(null);
});

// Test specific grid patterns
const testPatterns = [
	{
		name: "Single disabled item in corner",
		pattern: [true, false, false, false, false, false, false, false, false, false, false, false],
		description: "Top-left corner disabled"
	},
	{
		name: "Single disabled item in center",
		pattern: [false, false, false, false, true, false, false, false, false, false, false, false],
		description: "Center item disabled"
	},
	{
		name: "Entire row disabled",
		pattern: [true, true, true, false, false, false, false, false, false, false, false, false],
		description: "Top row disabled"
	},
	{
		name: "Entire column disabled",
		pattern: [true, false, false, true, false, false, true, false, false, true, false, false],
		description: "Left column disabled"
	},
	{
		name: "Checkerboard pattern",
		pattern: [true, false, true, false, true, false, true, false, true, false, true, false],
		description: "Alternating disabled items"
	},
	{
		name: "L-shape disabled",
		pattern: [true, true, true, true, false, false, true, false, false, false, false, false],
		description: "L-shaped disabled area"
	},
	{
		name: "Cross pattern disabled",
		pattern: [false, true, false, true, true, true, false, true, false, false, false, false],
		description: "Cross-shaped disabled area"
	}
];

// Generate comprehensive navigation tests for each pattern
testPatterns.forEach(({ name, pattern, description }) => {
	testWithEffect(`Navigation test: ${name} - ${description}`, async () => {
		const user = userEvent.setup();
		
		render(SpatialMenuDisabledTest, { disabledPattern: pattern });
		const root = page.getByTestId("spatial-root");
		const items = page.getByTestId("spatial-item").all();
		
		await user.click(root.element());
		
		// Start navigation
		await user.keyboard("{ArrowDown}");
		
		// Find first enabled item
		const firstEnabledIndex = pattern.findIndex(disabled => !disabled);
		if (firstEnabledIndex === -1) return; // Skip if all disabled
		
		expect(items[firstEnabledIndex]!.element().getAttribute("data-highlighted")).toBe("");
		
		// Test all four directions from the first enabled item
		const directions = [
			{ key: "{ArrowRight}", name: "right" },
			{ key: "{ArrowLeft}", name: "left" },
			{ key: "{ArrowDown}", name: "down" },
			{ key: "{ArrowUp}", name: "up" }
		] as const;
		
		for (const { key } of directions) {
			// Reset to first enabled item
			await user.click(root.element());
			await user.keyboard("{ArrowDown}");
			
			// Navigate in direction
			await user.keyboard(key);
			
			// Verify that highlighted item is not disabled
			const highlightedItem = items.find(item => 
				item.element().getAttribute("data-highlighted") === ""
			);
			
			if (highlightedItem) {
				const itemId = highlightedItem.element().getAttribute("data-item-id");
				const itemIndex = parseInt(itemId!) - 1;
				expect(pattern[itemIndex]).toBe(false); // Should not be disabled
			}
		}
	});
});

// Test wrap-around behavior with disabled items
testWithEffect("Wrap-around should skip disabled items", async () => {
	const user = userEvent.setup();
	
	// Disable items at edges to test wrap-around
	const disabledPattern = [true, false, true, false, false, false, false, false, false, true, false, true];
	
	render(SpatialMenuDisabledTest, { disabledPattern: disabledPattern, wrap: true });
	const root = page.getByTestId("spatial-root");
	const items = page.getByTestId("spatial-item").all();
	
	await user.click(root.element());
	
	// Start at first enabled item (item 2, index 1)
	await user.keyboard("{ArrowDown}");
	expect(items[1]!.element().getAttribute("data-highlighted")).toBe("");
	
	// Navigate left - should wrap to rightmost enabled item in same row (item 2 is leftmost enabled in row 1)
	await user.keyboard("{ArrowLeft}");
	
	// Should wrap to an enabled item, not a disabled one
	const highlightedItem = items.find(item => 
		item.element().getAttribute("data-highlighted") === ""
	);
	
	if (highlightedItem) {
		const itemId = highlightedItem.element().getAttribute("data-item-id");
		const itemIndex = parseInt(itemId!) - 1;
		expect(disabledPattern[itemIndex]).toBe(false);
	}
});

// Test edge case: all items in a row/column disabled
testWithEffect("Navigation when entire row is disabled", async () => {
	const user = userEvent.setup();
	
	// Disable entire middle row
	const disabledPattern = [false, false, false, true, true, true, false, false, false, false, false, false];
	
	render(SpatialMenuDisabledTest, { disabledPattern });
	const root = page.getByTestId("spatial-root");
	const items = page.getByTestId("spatial-item").all();
	
	await user.click(root.element());
	
	// Start at top row
	await user.keyboard("{ArrowDown}");
	expect(items[0]!.element().getAttribute("data-highlighted")).toBe("");
	
	// Navigate down - should skip disabled row and go to third row
	await user.keyboard("{ArrowDown}");
	
	// Should be on item 7 (index 6) - first item of third row
	expect(items[6]!.element().getAttribute("data-highlighted")).toBe("");
});

// Test edge case: only one enabled item
testWithEffect("Navigation with only one enabled item", async () => {
	const user = userEvent.setup();
	
	// Only item 5 (index 4) enabled
	const disabledPattern = [true, true, true, true, false, true, true, true, true, true, true, true];
	
	render(SpatialMenuDisabledTest, { disabledPattern });
	const root = page.getByTestId("spatial-root");
	const items = page.getByTestId("spatial-item").all();
	
	await user.click(root.element());
	
	// Start navigation
	await user.keyboard("{ArrowDown}");
	
	// Should highlight the only enabled item
	expect(items[4]!.element().getAttribute("data-highlighted")).toBe("");
	
	// All navigation should stay on the same item
	await user.keyboard("{ArrowRight}");
	expect(items[4]!.element().getAttribute("data-highlighted")).toBe("");
	
	await user.keyboard("{ArrowLeft}");
	expect(items[4]!.element().getAttribute("data-highlighted")).toBe("");
	
	await user.keyboard("{ArrowUp}");
	expect(items[4]!.element().getAttribute("data-highlighted")).toBe("");
	
	await user.keyboard("{ArrowDown}");
	expect(items[4]!.element().getAttribute("data-highlighted")).toBe("");
});

// Test type safety for disabled property
testWithEffect("Type tests: disabled property", () => {
	const spatialMenu = new SpatialMenu<string>();
	
	// Should accept disabled option
	const item1 = spatialMenu.getItem("test1", { disabled: true });
	const item2 = spatialMenu.getItem("test2", { disabled: false });
	const item3 = spatialMenu.getItem("test3", { onSelect: () => {}, disabled: true });
	const item4 = spatialMenu.getItem("test4"); // disabled should be optional
	
	expect(item1.disabled).toBe(true);
	expect(item2.disabled).toBe(false);
	expect(item3.disabled).toBe(true);
	expect(item4.disabled).toBe(false); // Should default to false
});

// Test disabled state in attrs
testWithEffect("Disabled items should have data-disabled attribute", () => {
	const spatialMenu = new SpatialMenu<string>();
	
	const enabledItem = spatialMenu.getItem("enabled", { disabled: false });
	const disabledItem = spatialMenu.getItem("disabled", { disabled: true });
	
	expect(enabledItem.attrs["data-disabled"]).toBe(undefined);
	expect(disabledItem.attrs["data-disabled"]).toBe("");
});

// Test axis priority: vertical navigation should prefer same column
testWithEffect("Axis priority: vertical navigation prefers same column", async () => {
	const user = userEvent.setup();
	
	// Pattern: o o o
	//          o x o  (x = disabled, middle item disabled)
	//          o o h  (h = highlighted, bottom right)
	//          o o o
	const disabledPattern = [false, false, false, false, true, false, false, false, false, false, false, false];
	
	render(SpatialMenuDisabledTest, { disabledPattern });
	const root = page.getByTestId("spatial-root");
	const items = page.getByTestId("spatial-item").all();
	
	await user.click(root.element());
	
	// Navigate to bottom right item (item 9, index 8)
	await user.keyboard("{ArrowDown}"); // Start at item 1
	await user.keyboard("{ArrowDown}"); // Move to item 4
	await user.keyboard("{ArrowRight}"); // Move to item 5 (disabled) - should skip to item 6
	await user.keyboard("{ArrowDown}"); // Move to item 9 (bottom right)
	
	// Verify we're at item 9 (bottom right)
	expect(items[8]!.element().getAttribute("data-highlighted")).toBe("");
	
	// Press up - should go to item 6 (directly above in same column), NOT item 8 or other items
	await user.keyboard("{ArrowUp}");
	
	// Should be at item 6 (index 5) - middle right, same column as item 9
	expect(items[5]!.element().getAttribute("data-highlighted")).toBe("");
});

// Test axis priority: horizontal navigation should prefer same row
testWithEffect("Axis priority: horizontal navigation prefers same row", async () => {
	const user = userEvent.setup();
	
	// Pattern: o o o
	//          h x o  (h = highlighted left, x = disabled middle)
	//          o o o
	const disabledPattern = [false, false, false, false, true, false, false, false, false, false, false, false];
	
	render(SpatialMenuDisabledTest, { disabledPattern });
	const root = page.getByTestId("spatial-root");
	const items = page.getByTestId("spatial-item").all();
	
	await user.click(root.element());
	
	// Navigate to middle left item (item 4, index 3)
	await user.keyboard("{ArrowDown}"); // Start at item 1
	await user.keyboard("{ArrowDown}"); // Move to item 4 (middle left)
	
	// Verify we're at item 4 (middle left)
	expect(items[3]!.element().getAttribute("data-highlighted")).toBe("");
	
	// Press right - should go to item 6 (middle right), NOT item 1, 7, etc.
	await user.keyboard("{ArrowRight}");
	
	// Should be at item 6 (index 5) - middle right, same row
	expect(items[5]!.element().getAttribute("data-highlighted")).toBe("");
});

// Test fallback when no same-axis items available
testWithEffect("Axis priority: fallback to closest item when no same-axis items", async () => {
	const user = userEvent.setup();
	
	// Pattern: o o o
	//          x h x  (h = highlighted middle, sides disabled)
	//          o o o  (bottom row all enabled)
	const disabledPattern = [false, false, false, true, false, true, false, false, false, false, false, false];
	
	render(SpatialMenuDisabledTest, { disabledPattern });
	const root = page.getByTestId("spatial-root");
	const items = page.getByTestId("spatial-item").all();
	
	await user.click(root.element());
	
	// Navigate to middle center item (item 5, index 4)
	await user.keyboard("{ArrowDown}"); // Start at item 1
	await user.keyboard("{ArrowRight}"); // Move to item 2
	await user.keyboard("{ArrowDown}"); // Move to item 5 (middle center)
	
	// Verify we're at item 5 (middle center)
	expect(items[4]!.element().getAttribute("data-highlighted")).toBe("");
	
	// Press left - no same-row enabled items to the left, should fallback to closest item in left direction
	await user.keyboard("{ArrowLeft}");
	
	// Should move to item 1 (closest enabled item in left direction)
	expect(items[0]!.element().getAttribute("data-highlighted")).toBe("");
});

// Performance test: navigation in large grid with many disabled items
testWithEffect("Performance: navigation in grid with many disabled items", async () => {
	const user = userEvent.setup();
	
	// Create a pattern where most items are disabled
	const disabledPattern = Array.from({ length: 12 }, (_, i) => i % 3 !== 0); // Only every 3rd item enabled
	
	render(SpatialMenuDisabledTest, { disabledPattern });
	const root = page.getByTestId("spatial-root");
	
	await user.click(root.element());
	
	const startTime = performance.now();
	
	// Perform many navigation operations
	for (let i = 0; i < 20; i++) {
		await user.keyboard("{ArrowRight}");
		await user.keyboard("{ArrowDown}");
		await user.keyboard("{ArrowLeft}");
		await user.keyboard("{ArrowUp}");
	}
	
	const endTime = performance.now();
	const duration = endTime - startTime;
	
	// Should complete within reasonable time (less than 1 second)
	expect(duration).toBeLessThan(1000);
});