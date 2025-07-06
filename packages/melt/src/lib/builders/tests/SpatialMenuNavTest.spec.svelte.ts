import { page, userEvent } from "@vitest/browser/context";
import SpatialMenuNavTest from "./SpatialMenuNavTest.svelte";
import { render } from "vitest-browser-svelte";
import { testWithEffect } from "$lib/utils/test.svelte";
import { expect } from "vitest";

type Grid = string[];
type Direction = "up" | "down" | "left" | "right";

const directionArrowMap: Record<Direction, string> = {
	up: "ArrowUp",
	down: "ArrowDown",
	left: "ArrowLeft",
	right: "ArrowRight",
};

type TestCase = {
	initial: Grid;
	steps: Array<Grid | Direction>;
	crossAxis?: boolean;
	wrap?: boolean;
};

const cases: TestCase[] = [
	{
		// prettier-ignore
		initial: [
			"o h o",
			"o o o",
		],
		// prettier-ignore
		steps: [
			"right",
			[
				"o o h",
				"o o o"
			]
		],
	},
	{
		// prettier-ignore
		initial: [
			"o o h",
			"o o o",
		],
		// prettier-ignore
		steps: [
			"right",
			[
				"o o h",
				"o o o"
			]
		],
		wrap: false,
	},
	{
		// prettier-ignore
		initial: [
			"o o h",
			"o o o",
		],
		// prettier-ignore
		steps: [
			"right",
			[
				"h o o",
				"o o o"
			]
		],
		wrap: true,
	},
	{
		// prettier-ignore
		initial: [
			"h x o",
			"o o o",
		],
		// prettier-ignore
		steps: [
			"right",
			[
				"o x h",
				"o o o"
			]
		],
	},
	{
		// prettier-ignore
		initial: [
			"h x x",
			"o o o",
		],
		// prettier-ignore
		steps: [
			"right",
			[
				"h x x",
				"o o o"
			]
		],
		crossAxis: false,
	},
	{
		// prettier-ignore
		initial: [
			"h x x",
			"o o o",
		],
		// prettier-ignore
		steps: [
			"right",
			[
				"o x x",
				"o h o"
			]
		],
		crossAxis: true,
	},
	{
		// prettier-ignore
		initial: [
			"o o x",
			"o x o",
			"o h o",
		],
		// prettier-ignore
		steps: [
			"up",
			[
				"o h x",
				"o x o",
				"o o o",
			]
		],
	},
	{
		// prettier-ignore
		initial: [
			"o x x",
			"o x o",
			"o h o",
		],
		// prettier-ignore
		steps: [
			"up",
			[
				"o x x",
				"h x o",
				"o o o",
			]
		],
		crossAxis: true,
	},
	// Test 8: Simple cross-axis navigation
	{
		// prettier-ignore
		initial: [
			"h x",
			"x o",
		],
		// prettier-ignore
		steps: [
			"right",
			[
				"o x",
				"x h",
			],
		],
		crossAxis: true,
	},
	// Test 9: Wrap around with disabled items at edges
	{
		// prettier-ignore
		initial: [
			"x o o h",
			"o o o x",
		],
		// prettier-ignore
		steps: [
			"right",
			[
				"x h o o",
				"o o o x",
			],
		],
		wrap: true,
	},
	// Test 10: Vertical navigation with wrap and disabled items
	{
		// prettier-ignore
		initial: [
			"x o",
			"o h",
			"x o",
		],
		// prettier-ignore
		steps: [
			"down",
			[
				"x o",
				"o o",
				"x h",
			],
		],
		wrap: true,
	},
	// Test 11: L-shaped navigation pattern
	{
		// prettier-ignore
		initial: [
			"h o o",
			"x x o",
			"o o o",
		],
		// prettier-ignore
		steps: [
			"right",
			[
				"o h o",
				"x x o",
				"o o o",
			],
			"down",
			[
				"o o o",
				"x x o",
				"o h o",
			],
			"right",
			[
				"o o o",
				"x x o",
				"o o h",
			],
		],
		crossAxis: true,
	},
	// Test 12: No valid moves without crossAxis
	{
		// prettier-ignore
		initial: [
			"o x o",
			"x h x",
			"o x o",
		],
		// prettier-ignore
		steps: [
			"up",
			[
				"o x o",
				"x h x",
				"o x o",
			],
			"down",
			[
				"o x o",
				"x h x",
				"o x o",
			],
			"left",
			[
				"o x o",
				"x h x",
				"o x o",
			],
			"right",
			[
				"o x o",
				"x h x",
				"o x o",
			],
		],
		crossAxis: false,
	},
	// Test 13: Cross-axis navigation from center
	{
		// prettier-ignore
		initial: [
			"o x o",
			"x h x",
			"o x o",
		],
		// prettier-ignore
		steps: [
			"up",
			[
				"h x o",
				"x o x",
				"o x o",
			],
			"right",
			[
				"o x h",
				"x o x",
				"o x o",
			],
			"down",
			[
				"o x o",
				"x o x",
				"o x h",
			],
			"left",
			[
				"o x o",
				"x o x",
				"h x o",
			],
		],
		crossAxis: true,
	},
	// Test 14: Large grid navigation
	{
		// prettier-ignore
		initial: [
			"h o o o",
			"x x x o",
			"x o x o",
			"x x x o",
			"x o x o",
		],
		// prettier-ignore
		steps: [
			"down",
			[
				"o o o o",
				"x x x o",
				"x h x o",
				"x x x o",
				"x o x o",
			],
			"down",
			[
				"o o o o",
				"x x x o",
				"x o x o",
				"x x x o",
				"x h x o",
			],
			"right",
			[
				"o o o o",
				"x x x o",
				"x o x o",
				"x x x o",
				"x o x h",
			]
		],
		crossAxis: true,
	},
	// Test 15: Wrap around corners
	{
		// prettier-ignore
		initial: [
			"h o o",
			"o o o",
			"o o o",
		],
		// prettier-ignore
		steps: [
			"left",
			[
				"o o h",
				"o o o",
				"o o o",
			],
			"up",
			[
				"o o o",
				"o o o",
				"o o h",
			],
		],
		wrap: true,
	},
	// Test 16: Single row navigation
	{
		// prettier-ignore
		initial: [
			"h x o x o",
		],
		// prettier-ignore
		steps: [
			"right",
			[
				"o x h x o",
			],
			"right",
			[
				"o x o x h",
			],
			"right",
			[
				"h x o x o",
			],
		],
		wrap: true,
	},
	// Test 17: Single column navigation
	{
		// prettier-ignore
		initial: [
			"h",
			"x",
			"o",
			"x",
			"o",
		],
		// prettier-ignore
		steps: [
			"down",
			[
				"o",
				"x",
				"h",
				"x",
				"o",
			],
			"down",
			[
				"o",
				"x",
				"o",
				"x",
				"h",
			],
			"down",
			[
				"h",
				"x",
				"o",
				"x",
				"o",
			],
		],
		wrap: true,
	},
	// Test 18: Diagonal-like movement with crossAxis
	{
		// prettier-ignore
		initial: [
			"h x x x",
			"x x x x",
			"x x x x",
			"x x x o",
		],
		// prettier-ignore
		steps: [
			"right",
			[
				"o x x x",
				"x x x x",
				"x x x x",
				"x x x h",
			],
			"left",
			[
				"h x x x",
				"x x x x",
				"x x x x",
				"x x x o",
			],
		],
		crossAxis: true,
	},
	// Test 19: Mixed wrap and crossAxis behavior
	{
		// prettier-ignore
		initial: [
			"o x h",
			"x x x",
			"o x o",
		],
		// prettier-ignore
		steps: [
			"down",
			[
				"o x o",
				"x x x",
				"o x h",
			],
			"up",
			[
				"o x h",
				"x x x",
				"o x o",
			],
		],
		wrap: true,
		crossAxis: true,
	},
	// Test 20: Edge case with all items disabled except two
	{
		// prettier-ignore
		initial: [
			"h x x",
			"x x x",
			"x x o",
		],
		// prettier-ignore
		steps: [
			"right",
			[
				"o x x",
				"x x x",
				"x x h",
			],
			"left",
			[
				"h x x",
				"x x x",
				"x x o",
			],
		],
		crossAxis: true,
	},
];

function getSupposedHighlightedIdx(grid: Grid): number {
	const cells = grid.flatMap((r) => r.split(" "));
	return cells.findIndex((c) => c === "h");
}

cases.forEach((c, i) => {
	testWithEffect(`Navigation test: ${i}`, async () => {
		const user = userEvent.setup();

		render(SpatialMenuNavTest, { initial: c.initial, wrap: c.wrap, crossAxis: c.crossAxis });

		const root = page.getByTestId("spatial-root");
		const items = page.getByTestId("spatial-item").all();

		await user.click(root.element());
		expect(root).toHaveFocus();

		let grid = c.initial;
		const idx = getSupposedHighlightedIdx(grid);
		expect(items[idx]!.element().getAttribute("data-highlighted")).toBe("");

		let step_idx = -1;
		while (grid && step_idx < c.steps.length - 1) {
			step_idx++;
			const step = c.steps[step_idx];
			if (typeof step === "string") {
				const direction = step as Direction;
				const arrowKey = directionArrowMap[direction];
				await user.keyboard(`{${arrowKey}}`);
			} else {
				grid = step as Grid;
				const idx = getSupposedHighlightedIdx(grid);
				expect(items[idx]!.element().getAttribute("data-highlighted")).toBe("");
			}
		}
	});
});
