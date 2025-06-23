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
		wrap: {
			type: "boolean",
			defaultValue: false,
			label: "Wrap Around",
		},
		columns: {
			type: "number",
			defaultValue: 3,
			min: 2,
			max: 6,
			label: "Columns",
		},
		itemCount: {
			type: "number",
			defaultValue: 9,
			min: 4,
			max: 20,
			label: "Item Count",
		},
	});

	const allItems = [
		"Dashboard",
		"Analytics",
		"Settings",
		"Profile",
		"Home",
		"Messages",
		"Calendar",
		"Tasks",
		"Help",
		"Reports",
		"Users",
		"Admin",
		"Notifications",
		"Search",
		"Export",
		"Import",
		"Archive",
		"Backup",
		"Security",
		"Logs",
	];

	const items = $derived(
		allItems.slice(0, controls.itemCount).map((label, i) => ({
			id: `item-${i + 1}`,
			label,
		})),
	);

	const spatialMenu = new SpatialMenu<string>({
		highlighted: "item-1",
		onSelect: (value) => {
			const item = items.find((i) => i.id === value);
			console.log(`Selected: ${item?.label}`);
		},
		...getters(controls),
	});
</script>

<Preview>
	<div class="mx-auto flex max-w-2xl flex-col gap-4">
		<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
			<Grid3x3 class="size-4" />
			<span
				>Use arrow keys to navigate • {controls.wrap
					? "Wrap-around enabled"
					: "No wrap-around"}</span
			>
		</div>

		<div
			{...spatialMenu.root}
			class="grid gap-3 rounded-xl border border-gray-300 bg-gray-50 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
			style={`grid-template-columns: repeat(${controls.columns}, 1fr);`}
		>
			{#each items as item}
				{@const menuItem = spatialMenu.getItem(item.id)}
				<div
					{...menuItem.attrs}
					class={[
						"flex min-h-16 items-center justify-center rounded-lg border p-3 text-sm font-medium transition-all",
						"hover:bg-gray-100 active:scale-95 dark:hover:bg-gray-700",
						menuItem.highlighted
							? "border-blue-500 bg-blue-50 text-blue-700 shadow-md dark:border-blue-400 dark:bg-blue-900/50 dark:text-blue-300"
							: "border-gray-200 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300",
					]}
				>
					{item.label}
				</div>
			{/each}
		</div>

		<div class="text-center text-sm text-gray-500 dark:text-gray-400">
			Highlighted: {items.find((i) => i.id === spatialMenu.highlighted)?.label || "None"}
		</div>
	</div>
</Preview>
