import { describe, expect, vi } from "vitest";
import { SpatialMenu } from "./SpatialMenu.svelte.js";
import { testWithEffect } from "../utils/test.svelte.js";

describe("SpatialMenu", () => {
	testWithEffect("should initialize with default props", () => {
		const spatialMenu = new SpatialMenu<string>();
		expect(spatialMenu.highlighted).toBeNull();
		expect(spatialMenu.wrap).toBe(false);
	});

	testWithEffect("should initialize with highlighted value", () => {
		const spatialMenu = new SpatialMenu<string>({
			highlighted: "item-1",
		});
		expect(spatialMenu.highlighted).toBe("item-1");
	});

	testWithEffect("should initialize with wrap enabled", () => {
		const spatialMenu = new SpatialMenu<string>({
			wrap: true,
		});
		expect(spatialMenu.wrap).toBe(true);
	});

	testWithEffect("should call onHighlightChange when highlighted changes", () => {
		let calledWith: string | null = null;
		const spatialMenu = new SpatialMenu<string>({
			highlighted: "item-1",
			onHighlightChange: (value) => {
				calledWith = value;
			},
		});

		spatialMenu.highlighted = "item-2";
		expect(calledWith).toBe("item-2");
	});

	testWithEffect("should call onSelect when item is selected", () => {
		let selectedValue: string | null = null;
		const spatialMenu = new SpatialMenu<string>({
			onSelect: (value) => {
				selectedValue = value;
			},
		});

		const item = spatialMenu.getItem("test-item");
		item.onSelect();
		expect(selectedValue).toBe("test-item");
	});

	testWithEffect("should track highlighted state in items", () => {
		const spatialMenu = new SpatialMenu<string>({
			highlighted: "item-1",
		});

		const item1 = spatialMenu.getItem("item-1");
		const item2 = spatialMenu.getItem("item-2");

		expect(item1.highlighted).toBe(true);
		expect(item2.highlighted).toBe(false);

		spatialMenu.highlighted = "item-2";
		expect(item1.highlighted).toBe(false);
		expect(item2.highlighted).toBe(true);
	});

	testWithEffect("should handle keyboard navigation with no items", () => {
		const spatialMenu = new SpatialMenu<string>();
		const rootAttrs = spatialMenu.root;

		// Should not throw when no items exist
		const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
		rootAttrs.onkeydown(event);
		expect(spatialMenu.highlighted).toBeNull();
	});

	testWithEffect("should prevent default on arrow key events", () => {
		const spatialMenu = new SpatialMenu<string>();
		const rootAttrs = spatialMenu.root;

		const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
		const preventDefaultSpy = vi.spyOn(event, "preventDefault");

		rootAttrs.onkeydown(event);
		expect(preventDefaultSpy).toHaveBeenCalled();
	});

	testWithEffect("should not handle non-arrow keys", () => {
		const spatialMenu = new SpatialMenu<string>({
			highlighted: "item-1",
		});
		const rootAttrs = spatialMenu.root;

		const event = new KeyboardEvent("keydown", { key: "Enter" });
		rootAttrs.onkeydown(event);

		expect(spatialMenu.highlighted).toBe("item-1"); // Should remain unchanged
	});
});