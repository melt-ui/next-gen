<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { Tabs } from "@melt-ui/builders";
	import { Debounced, ElementSize, Previous } from "runed";
	import Transition from "@components/transition.svelte";

	const controls = usePreviewControls({
		loop: { label: "Loop", defaultValue: true },
		selectWhenFocused: { label: "Select when focused", defaultValue: true },
	});

	const tabIds = ["Movies & TV", "Anime", "Music", "Gaming"] as const;
	type TabId = (typeof tabIds)[number];
	const tabs = new Tabs<TabId>({
		loop: () => controls.loop,
		selectWhenFocused: () => controls.selectWhenFocused,
	});

	const previousTab = new Previous(() => tabs.value);
	const forwards = $derived.by(() => {
		if (!previousTab.current) return true;
		return tabIds.indexOf(tabs.value) > tabIds.indexOf(previousTab.current);
	});

	let inner = $state<HTMLElement>();
	const innerSize = new ElementSize(() => inner);

	// This is a little hack to ensure the transition classes get updated
	// before the transition is triggerred.
	const debouncedTab = new Debounced(() => tabs.value, 1);
	const activeTab = $derived(debouncedTab.current);
</script>

<Preview>
	<div class="flex h-[600px] flex-col items-center justify-center">
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

		<div
			class="relative overflow-visible transition-all duration-500"
			style="height: {innerSize.height}px"
		>
			<div class="inner" bind:this={inner}>
				{#each tabIds as id}
					{@const isActive = id === activeTab}
					<Transition
						show={isActive}
						leaveFrom="-translate-x-1/2 duration-0"
						leaveTo="opacity-0 {forwards ? '-translate-x-full' : 'translate-x-full'}"
						leave="absolute left-1/2 duration-500"
						enterFrom="opacity-0 {forwards ? 'translate-x-full' : '-translate-x-full'} "
						enter="duration-500"
					>
						<div
							{...tabs.getContent(id)}
							class="top-0 !block transition
						"
						>
							{#if id === "Movies & TV"}
								{#snippet movie(name: string, src: string)}
									<div class="movie">
										<img class="h-full w-full rounded-xl object-cover" {src} alt="" />
										<p class="absolute bottom-3 left-3 z-10 text-2xl font-bold text-white">
											{name}
										</p>
									</div>
								{/snippet}

								<div class="movie-grid mt-4">
									{@render movie("Breaking Bad", "/previews/breaking-bad.jpg")}
									{@render movie("Oldboy", "/previews/oldboy.jpg")}
									{@render movie("Severance", "/previews/severance.jpg")}
									{@render movie("The Truman Show", "/previews/truman-show.jpg")}
								</div>
							{:else if id === "Anime"}
								{#snippet movie(name: string, src: string)}
									<div class="movie">
										<img class="h-full w-full rounded-xl object-cover" {src} alt="" />
										<p class="absolute bottom-3 left-3 z-10 text-2xl font-bold text-white">
											{name}
										</p>
									</div>
								{/snippet}

								<div class="movie-grid mt-4">
									{@render movie("Oldboy", "/previews/oldboy.jpg")}
									{@render movie("Breaking Bad", "/previews/breaking-bad.jpg")}
								</div>
							{:else if id === "Music"}
								{#snippet movie(name: string, src: string)}
									<div class="movie">
										<img class="h-full w-full rounded-xl object-cover" {src} alt="" />
										<p class="absolute bottom-3 left-3 z-10 text-2xl font-bold text-white">
											{name}
										</p>
									</div>
								{/snippet}

								<div class="movie-grid mt-4">
									{@render movie("Oldboy", "/previews/severance.jpg")}
									{@render movie("Breaking Bad", "/previews/breaking-bad.jpg")}
								</div>
							{/if}
						</div>
					</Transition>
				{/each}
			</div>
		</div>
	</div>
</Preview>

<style>
	[data-melt-tabs-content] {
		width: 550px;
	}

	.movie-grid {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		gap: 1rem;
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
