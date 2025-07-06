<script lang="ts">
	import { SpatialMenu } from "$lib/builders/SpatialMenu.svelte.js";

	type Props = {
		initial: string[];
		wrap?: boolean;
		crossAxis?: boolean;
	};
	const { initial, wrap = false, crossAxis = false }: Props = $props();

	const cols = initial[0]?.split(" ").length ?? 0;

	type Item = {
		disabled?: boolean;
		id: string;
	};

	let highlighted: string | undefined | null = $state();

	const rows: Item[][] = [];

	initial.forEach((row, rowIndex) => {
		const res: Item[] = [];
		const cols = row.split(" ");
		cols.forEach((col, colIndex) => {
			const id = `${rowIndex}-${colIndex}`;
			res.push({
				id,
				disabled: col === "x",
			});
			if (col === "h") {
				highlighted = id;
			}
		});
		rows.push(res);
	});

	const menu = new SpatialMenu({
		highlighted: () => highlighted,
		onHighlightChange: (id) => {
			highlighted = id;
		},
		wrap,
		crossAxis,
	});

	export const getHighlighted = () => highlighted;
</script>

<div style="grid-template-columns: repeat({cols}, 1fr);" {...menu.root} data-testid="spatial-root">
	{#each rows as row}
		{#each row as col}
			{@const item = menu.getItem(col.id, { disabled: col.disabled })}
			<div {...item.attrs} data-testid="spatial-item">
				{col.id}
			</div>
		{/each}
	{/each}
</div>

<style>
	[data-melt-spatial-menu-root] {
		display: grid;

		padding: 0.5rem;
		border: 1px solid #ccc;
	}

	[data-melt-spatial-menu-item] {
		padding: 0.5rem;
		border: 1px solid #ccc;
	}

	[data-melt-spatial-menu-item][data-highlighted] {
		background-color: #ccc;
	}

	[data-melt-spatial-menu-item][data-disabled] {
		opacity: 0.5;
	}
</style>
