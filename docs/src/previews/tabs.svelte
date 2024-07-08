<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { Tabs } from "@melt-ui/builders";
	import { Debounced, ElementSize, Previous, useDebounce, useEventListener, watch } from "runed";
	import Transition from "@components/transition.svelte";
	import { Map } from "svelte/reactivity";

	const controls = usePreviewControls({
		loop: { label: "Loop", defaultValue: true },
		selectWhenFocused: { label: "Select when focused", defaultValue: true },
	});

	const tabIds = ["Movies & TV", "Anime & Manga", "Gaming", "Music"] as const;
	type TabId = (typeof tabIds)[number];
	const tabs = new Tabs<TabId>({
		value: "Anime & Manga",
		loop: () => controls.loop,
		selectWhenFocused: () => controls.selectWhenFocused,
	});

	let inner = $state<HTMLElement>();
	const innerSize = new ElementSize(() => inner);

	const transitioningElements = new Map<Element, boolean>();
	const transitioning = $derived([...transitioningElements.values()].some(Boolean));
	$inspect(transitioningElements);

	function detectTransitions(node: HTMLElement) {
		const children = [...node.children];
		children.forEach((c) => {
			useEventListener(
				() => c,
				"transitionstart",
				() => {
					transitioningElements.set(c, true);
				},
			);
			useEventListener(
				() => c,
				"transitionend",
				() => {
					transitioningElements.set(c, false);
				},
			);
			useEventListener(
				() => c,
				"transitioncancel",
				() => {
					transitioningElements.set(c, false);
				},
			);
		});
	}

	let activeTab = $state<TabId>(tabs.value);
	// Hack to make sure transitions behave
	const debouncedTab = new Debounced(() => activeTab, 1);

	$effect(() => {
		if (transitioning) return;
		activeTab = tabs.value;
	});

	const previousTab = new Previous(() => activeTab);
	const forwards = $derived.by(() => {
		if (!previousTab.current) return true;
		return tabIds.indexOf(tabs.value) > tabIds.indexOf(previousTab.current);
	});
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
			class="relative overflow-visible transition-all duration-300"
			style="height: {innerSize.height ? `${innerSize.height}px` : 'auto'}"
		>
			<div class="inner" bind:this={inner} use:detectTransitions>
				{#each tabIds as id}
					{@const isActive = id === debouncedTab.current}
					<Transition
						show={isActive}
						leaveFrom="-translate-x-1/2 !duration-0"
						leaveTo="opacity-0 {forwards
							? 'translate-x-[calc(-50%-5rem)]'
							: 'translate-x-[calc(-50%+5rem)]'}"
						leave="absolute left-1/2 duration-300"
						enterFrom="opacity-0 {forwards ? 'translate-x-[5rem]' : 'translate-x-[-5rem]'} "
						enter="duration-300 relative z-10"
					>
						<div {...tabs.getContent(id)} class="top-0 !block">
							{#if id === "Movies & TV"}
								{#snippet movie(name: string, src: string)}
									<div class="movie-media">
										<img class="h-full w-full rounded-xl object-cover" {src} alt="" />
										<p class="absolute bottom-2 left-3 z-10 text-2xl font-bold text-white">
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
							{:else if id === "Anime & Manga"}
								{#snippet anime(name: string, src: string)}
									<div class="anime-media">
										<img class="h-full w-full rounded-xl object-cover" {src} alt="" />
										<p class="absolute bottom-1 left-3 z-10 text-2xl font-bold text-white">
											{name}
										</p>
									</div>
								{/snippet}

								<div class="anime-grid mt-4">
									{@render anime("Attack on Titan", "/previews/aot.jpg")}
									{@render anime("Jujutsu Kaisen", "/previews/nah-id-win.jpg")}
									{@render anime("Demon Slayer", "/previews/demon-slayer.webp")}
									{@render anime("Berserk", "/previews/berserk.avif")}
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

	[class*="-grid"] {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		gap: 1rem;
	}

	[class*="-media"] {
		position: relative;
		object-fit: cover;
	}

	[class*="-media"]::after {
		position: absolute;
		content: "";
		inset: 0;
		z-index: 1;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5));
	}

	/* Movies */
	.movie-grid {
		grid-template-rows: repeat(auto-fill, 250px);
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

	/* Anime */
	.anime-grid {
		grid-template-rows: repeat(auto-fill, 200px);
	}

	.anime-grid > :nth-child(1) {
		grid-column: 1 / 9;
	}

	.anime-grid > :nth-child(2) {
		grid-column: 9 / 13;
	}

	.anime-grid > :nth-child(3) {
		grid-column: 1 / 6;
	}

	.anime-grid > :nth-child(4) {
		grid-column: 6 / 13;
	}
</style>
