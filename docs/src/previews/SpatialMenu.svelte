<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import { getters } from "melt";
	import { SpatialMenu } from "melt/builders";
	import Grid3x3 from "~icons/lucide/grid-3x3";

	const controls = usePreviewControls({
		disabled: {
			type: "boolean",
			defaultValue: false,
			label: "Disabled",
		},
	});

	const items = [
		{ id: "item-1", label: "Dashboard", position: "top-left" },
		{ id: "item-2", label: "Analytics", position: "top-center" },
		{ id: "item-3", label: "Settings", position: "top-right" },
		{ id: "item-4", label: "Profile", position: "middle-left" },
		{ id: "item-5", label: "Home", position: "center" },
		{ id: "item-6", label: "Messages", position: "middle-right" },
		{ id: "item-7", label: "Calendar", position: "bottom-left" },
		{ id: "item-8", label: "Tasks", position: "bottom-center" },
		{ id: "item-9", label: "Help", position: "bottom-right" },
	];

	const spatialMenu = new SpatialMenu<string>({
		highlighted: "item-5",
		onSelect: (value) => {
			const item = items.find((i) => i.id === value);
			console.log(`Selected: ${item?.label}`);
		},
		...getters(controls),
	});
</script>

<Preview>
	<div class="mx-auto flex w-[400px] flex-col gap-4">
		<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
			<Grid3x3 class="size-4" />
			<span>Use arrow keys to navigate the grid</span>
		</div>

		<div
			{...spatialMenu.root}
			class="grid grid-cols-3 gap-3 rounded-xl border border-gray-300 bg-gray-50 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
		>
			{#each items as item}
				{@const menuItem = spatialMenu.getItem(item.id)}
				<button
					{...menuItem.attrs}
					onclick={() => menuItem.onSelect()}
					class={[
						"flex items-center justify-center rounded-lg border p-4 text-sm font-medium transition-all",
						"hover:bg-gray-100 active:scale-95 dark:hover:bg-gray-700",
						menuItem.highlighted
							? "border-blue-500 bg-blue-50 text-blue-700 shadow-md dark:border-blue-400 dark:bg-blue-900/50 dark:text-blue-300"
							: "border-gray-200 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300",
					]}
				>
					{item.label}
				</button>
			{/each}
		</div>

		<div class="text-center text-sm text-gray-500 dark:text-gray-400">
			Highlighted: {items.find((i) => i.id === spatialMenu.highlighted)?.label || "None"}
		</div>
	</div>
</Preview>
