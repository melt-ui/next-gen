<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { Tabs } from "@melt-ui/builders";

	const controls = usePreviewControls({
		loop: { label: "Loop", defaultValue: true },
		selectWhenFocused: { label: "Select when focused", defaultValue: true },
	});

	const tabIds = ["Movies & TV", "Anime", "Music", "Gaming"] as const;
	const tabs = new Tabs({
		loop: () => controls.loop,
		selectWhenFocused: () => controls.selectWhenFocused,
	});
</script>

<Preview>
	<div class="flex items-center justify-center gap-2" {...tabs.triggerList}>
		{#each tabIds as id}
			<button
				class="focus-visible:ring-accent-600 cursor-pointer rounded-full bg-transparent px-4 py-1 font-medium outline-none
				transition focus-visible:ring-4 data-[active]:bg-white data-[active]:text-black [&:not([data-active])]:hover:bg-white/10"
				{...tabs.getTrigger(id)}
			>
				{id}
			</button>
		{/each}
	</div>

	{#each tabIds as id}
		<div {...tabs.getContent(id)} class="[hidden]:hidden">
			{#if id === "Movies & TV"}
				{#snippet movie(name: string, src: string)}
					<div class="movie">
						<img
							class="h-full w-full rounded-xl object-cover"
							src="{src}"
							alt=""
						/>
						<p class="absolute bottom-3 left-3 text-white font-bold text-2xl z-10">{name}</p>
					</div>
				{/snippet}

				<div class="movie-grid mt-4">
					{@render movie("Breaking Bad", "/previews/breaking-bad.jpg")}
					{@render movie("Oldboy", "/previews/oldboy.jpg")}
					{@render movie("Severance", "/previews/severance.jpg")}
					{@render movie("The Truman Show", "/previews/truman-show.jpg")}
				</div>
			{/if}
		</div>
	{/each}
</Preview>

<style>
	.movie-grid {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		gap: 1rem;
		width: 550px;
	}

	.movie {
		position: relative;
		height: 250px;
	}

	.movie::after {
		position: absolute;
		content: "";
		inset: 0;
		z-index: 1;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5));
	}

	.movie-grid > :nth-child(1) {
		grid-column: 1 / 8;
	}

	.movie-grid > :nth-child(2) {
		grid-column: 8 / 12;
	}

	.movie-grid > :nth-child(3) {
		grid-column: 2 / 6;
	}

	.movie-grid > :nth-child(4) {
		grid-column: 6 / 13;
	}
</style>
