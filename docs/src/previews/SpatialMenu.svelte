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

	const items = [...new Array(30)].fill(0).map((_, i) => `Item ${i + 1}`);

	const spatialMenu = new SpatialMenu<string>({
		...getters(controls),
	});

	let search = $state("");
</script>

<Preview>
	<div
		class="mx-auto flex h-96 flex-col items-center gap-2 overflow-hidden border p-2"
		{...spatialMenu.root}
	>
		<label class="focus-within:border-accent-500 w-64 border-b-2 border-gray-800 transition">
			<input
				class="w-full bg-transparent !outline-none"
				bind:value={search}
				placeholder="Search for movies"
				{...spatialMenu.input}
			/>
		</label>

		<div
			class="shrink-1 grid min-h-0 w-[30rem] flex-1 gap-4 overflow-y-auto border border-red-500 p-2"
			style:grid-template-columns="repeat(auto-fill,minmax(100px,1fr))"
		>
			{#each items as item}
				{@const spatialItem = spatialMenu.getItem(item)}
				<div class={["flex w-full scroll-m-2 flex-col"]} {...spatialItem.attrs}>
					<img
						class={[
							"aspect-[9/14] border",
							spatialItem.highlighted && "border-accent-500 scale-[1.05]",
						]}
						src="fuck"
						alt={item}
					/>
					<span class="text-center text-sm font-medium text-gray-500">{item}</span>
				</div>
			{/each}
		</div>
	</div>
</Preview>
