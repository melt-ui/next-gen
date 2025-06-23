<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import { getters } from "melt";
	import { SpatialMenu } from "melt/builders";
	import { movies } from "./movies";

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

	type Movie = (typeof movies)[number];

	const spatialMenu = new SpatialMenu<Movie>({
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
			{#each movies as movie}
				{@const item = spatialMenu.getItem(movie)}
				<div class={["flex w-full scroll-m-2 flex-col"]} {...item.attrs}>
					<img
						class={["aspect-[9/14] border", item.highlighted && "border-accent-500 scale-[1.05]"]}
						src={movie.posterUrl}
						alt={movie.title}
					/>
					<span class="text-center text-sm font-medium text-gray-500">{movie.title}</span>
				</div>
			{/each}
		</div>
	</div>
</Preview>
