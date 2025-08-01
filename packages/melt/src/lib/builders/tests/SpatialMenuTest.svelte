<script lang="ts">
	import { SpatialMenu } from "../SpatialMenu.svelte.js";

	interface Props {
		wrap?: boolean;
		items?: number;
		crossAxis?: boolean;
		toleranceCol?: number | null;
		toleranceRow?: number | null;
	}

	let { wrap = false, items = 8, crossAxis = false, toleranceCol = 16, toleranceRow = 16 }: Props = $props();

	type Item = { id: number; name: string; color: string };

	const allColors = [
		{ name: "Red", color: "#ef4444" },
		{ name: "Blue", color: "#3b82f6" },
		{ name: "Green", color: "#10b981" },
		{ name: "Yellow", color: "#f59e0b" },
		{ name: "Purple", color: "#8b5cf6" },
		{ name: "Pink", color: "#ec4899" },
		{ name: "Orange", color: "#f97316" },
		{ name: "Cyan", color: "#06b6d4" },
		{ name: "Indigo", color: "#6366f1" },
		{ name: "Teal", color: "#14b8a6" },
		{ name: "Rose", color: "#f43f5e" },
		{ name: "Emerald", color: "#059669" },
		{ name: "Amber", color: "#d97706" },
		{ name: "Lime", color: "#65a30d" },
		{ name: "Sky", color: "#0284c7" },
		{ name: "Violet", color: "#7c3aed" },
		{ name: "Fuchsia", color: "#c026d3" },
		{ name: "Slate", color: "#475569" },
		{ name: "Zinc", color: "#71717a" },
		{ name: "Stone", color: "#78716c" },
	];

	const itemsArray: Item[] = Array.from({ length: items }, (_, i) => {
		const colorIndex = i % allColors.length;
		return {
			id: i + 1,
			name: allColors[colorIndex]?.name ?? "Unknown",
			color: allColors[colorIndex]?.color ?? "#ccc",
		};
	});

	let selectedItem: Item | null = $state(null);

	const spatialMenu = new SpatialMenu<Item>({
		wrap,
		crossAxis,
		toleranceCol,
		toleranceRow,
		scrollBehavior: "smooth",
		onSelect: (item) => {
			selectedItem = item;
		},
		onHighlightChange: () => {
			// Track highlight changes for testing
		},
	});
</script>

<div data-testid="spatial-root" class="test-container" {...spatialMenu.root}>
	<h2>Spatial Menu Test</h2>

	<input
		data-testid="spatial-input"
		placeholder="Type to test input navigation"
		{...spatialMenu.input}
	/>

	<div class="items-grid">
		{#each itemsArray as item}
			{@const menuItem = spatialMenu.getItem(item)}
			<div
				data-testid="spatial-item"
				data-item-id={item.id}
				class="item"
				class:highlighted={menuItem.highlighted}
				style:background-color={item.color}
				{...menuItem.attrs}
			>
				<span class="item-name">{item.name}</span>
				<span class="item-id">#{item.id}</span>
			</div>
		{/each}
	</div>

	{#if selectedItem}
		<div data-testid="selected-item" class="selected-info">
			Selected: {selectedItem.name} (#{selectedItem.id})
		</div>
	{/if}

	<div data-testid="highlighted-item" class="highlighted-info">
		Highlighted: {spatialMenu.highlighted?.name ?? "None"}
	</div>

	<div data-testid="selection-mode" class="mode-info">
		Mode: {spatialMenu.selectionMode}
	</div>
</div>

<style>
	.test-container {
		padding: 20px;
		border: 2px solid #ccc;
		border-radius: 8px;
		font-family: sans-serif;
		max-width: 600px;
		margin: 0 auto;
	}

	.test-container:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	h2 {
		margin: 0 0 16px 0;
		color: #333;
	}

	input {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid #ccc;
		border-radius: 4px;
		margin-bottom: 20px;
		font-size: 14px;
	}

	input:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
		border-color: #3b82f6;
	}

	.items-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		margin-bottom: 20px;
	}

	.item {
		padding: 16px;
		border-radius: 8px;
		color: white;
		font-weight: bold;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 2px solid transparent;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.item.highlighted {
		border-color: #fff;
		transform: scale(1.05);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
	}

	.item-name {
		font-size: 16px;
	}

	.item-id {
		font-size: 12px;
		opacity: 0.8;
	}

	.selected-info,
	.highlighted-info,
	.mode-info {
		padding: 8px 12px;
		background: #f5f5f5;
		border-radius: 4px;
		margin-bottom: 8px;
		font-size: 14px;
		color: #666;
	}

	.selected-info {
		background: #dcfce7;
		color: #166534;
		font-weight: bold;
	}
</style>
