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
