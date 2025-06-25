<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { getters } from "melt";
	import { SpatialMenu } from "melt/builders";
	import { movies } from "./movies";
	import fuzzysearch from "./utils/search";

	const controls = usePreviewControls({
		wrap: {
			type: "boolean",
			defaultValue: false,
			label: "Wrap Around",
		},
	});

	type Movie = (typeof movies)[number];

	const spatialMenu = new SpatialMenu<Movie>({
		...getters(controls),
	});

	let search = $state("");

	const filtered = $derived(fuzzysearch({ needle: search, haystack: movies, property: "title" }));
</script>

<Preview>
	<div
		class="h-140 mx-auto flex flex-col items-center gap-3 overflow-hidden p-2"
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

		<div class="shrink-1 movie-list-mask min-h-0 w-[30rem] flex-1 overflow-y-auto px-2 py-4">
			<div class="grid gap-4 p-2" style:grid-template-columns="repeat(auto-fill,minmax(100px,1fr))">
				{#each filtered as movie}
					{@const item = spatialMenu.getItem(movie)}
					<div
						class={[
							"flex w-full scroll-mb-8 scroll-mt-14 flex-col gap-2 transition",
							item.highlighted && "scale-105",
						]}
						{...item.attrs}
					>
						<img
							class={[
								"aspect-[9/14] rounded-md outline-2 outline-offset-2 transition-all",
								item.highlighted ? "outline-accent-500 " : "!outline-transparent",
							]}
							src={movie.posterUrl}
							alt={movie.title}
						/>
						<span
							class={[
								"text-center text-xs font-medium transition",
								item.highlighted
									? "text-accent-500 dark:text-accent-200"
									: "text-gray-800 dark:text-gray-200",
							]}>{movie.title}</span
						>
					</div>
				{/each}
			</div>
		</div>
	</div>
</Preview>

<style>
	.movie-list-mask {
		--shadow-height: 20px;
		--scrollbar-width: 12px;
		position: relative;

		--mask-image: linear-gradient(
				to bottom,
				transparent,
				#000 var(--shadow-height),
				#000 calc(100% - var(--shadow-height)),
				transparent 100%
			),
			linear-gradient(to left, #fff var(--scrollbar-width), transparent var(--scrollbar-width));

		mask-image: var(--mask-image);
		-webkit-mask-image: var(--mask-image);
	}
</style>
