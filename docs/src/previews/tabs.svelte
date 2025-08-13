<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import { Tabs } from "melt/builders";
	import { Debounced, ElementSize, Previous } from "runed";
	import Transition from "@components/transition.svelte";

	const controls = usePreviewControls({
		loop: { label: "Loop", defaultValue: true, type: "boolean" },
		selectWhenFocused: { label: "Select when focused", defaultValue: true, type: "boolean" },
		orientation: {
			label: "Orientation",
			defaultValue: "horizontal",
			type: "select",
			options: ["horizontal", "vertical"],
		},
	});

	const tabIds = ["Movies & TV", "Anime & Manga", "Games", "Music"] as const;
	type TabId = (typeof tabIds)[number];
	const tabs = new Tabs<TabId>({
		value: "Movies & TV",
		loop: () => controls.loop,
		selectWhenFocused: () => controls.selectWhenFocused,
		orientation: () => controls.orientation,
	});

	let inner = $state<HTMLElement>();
	const innerSize = new ElementSize(() => inner);

	let transitioning = $state(false);
	let activeTab = $state<TabId>(tabs.value);
	$effect(() => {
		if (transitioning || activeTab === tabs.value) return;
		activeTab = tabs.value;
		transitioning = true;
		setTimeout(() => (transitioning = false), 350);
	});

	// Hack to make sure transitions behave
	const debouncedTab = new Debounced(() => activeTab, 1);

	const previousTab = new Previous(() => activeTab);
	const forwards = $derived.by(() => {
		const prevIndex = tabIds.indexOf(previousTab.current ?? tabIds[0]);
		const currIndex = tabIds.indexOf(activeTab);

		const isLooping = [prevIndex, currIndex].every((i) => i === 0 || i === tabIds.length - 1);
		return isLooping ? prevIndex > currIndex : prevIndex < currIndex;
	});

	const transitionConfigs = $derived({
		horizontal: {
			leaveFrom: "-translate-x-1/2 !duration-0",
			leaveTo: `opacity-0 ${forwards ? "translate-x-[calc(-50%-5rem)]" : "translate-x-[calc(-50%+5rem)]"}`,
			leave: "absolute left-1/2 duration-300",
			enterFrom: `opacity-0 ${forwards ? "translate-x-[5rem]" : "translate-x-[-5rem]"}`,
			enter: "duration-300 relative z-10",
		},
		vertical: {
			leaveFrom: "-translate-y-1/2 !duration-0",
			leaveTo: `opacity-0 ${forwards ? "translate-y-[calc(-50%-5rem)]" : "translate-y-[calc(-50%+5rem)]"}`,
			leave: "absolute top-1/2 duration-300",
			enterFrom: `opacity-0 ${forwards ? "translate-y-[10rem]" : "translate-y-[-10rem]"}`,
			enter: "duration-300 relative z-10",
			enterTo: "translate-y-0",
		},
	});
	const transitionConfig = $derived(transitionConfigs[tabs.orientation]);
</script>

<Preview>
	<div
		class="h-[700px] items-center gap-4
		{tabs.orientation === 'horizontal'
			? 'flex flex-col items-center justify-center'
			: 'grid grid-cols-12'}
		"
	>
		<div
			class="flex w-full flex-wrap
			{tabs.orientation === 'horizontal'
				? 'items-center justify-center  overflow-x-clip'
				: 'col-span-3 flex-col justify-center overflow-y-clip py-4'}
			"
			{...tabs.triggerList}
		>
			{#each tabIds as id}
				<button
					class="group min-w-0 max-w-full cursor-pointer text-ellipsis whitespace-nowrap bg-transparent text-start font-medium
					!outline-none transition {tabs.orientation === 'horizontal' ? 'px-2' : 'py-0.5'}"
					{...tabs.getTrigger(id)}
				>
					<div
						class="group-focus-visible:ring-accent-600 group-data-[active]:bg-accent-500 overflow-clip rounded-full px-4
						py-1 transition
						group-focus-visible:ring-4 group-[&:not([data-active]):hover]:bg-gray-200
						group-data-[active]:text-white dark:group-[&:not([data-active]):hover]:bg-white/10 dark:group-data-[active]:bg-white dark:group-data-[active]:text-black"
					>
						{id}
					</div>
				</button>
			{/each}
		</div>

		{#snippet media(name: string, src: string)}
			<div class="media overflow-hidden">
				<img class="h-full w-full rounded-xl object-cover" {src} alt="" />
				<p
					class="absolute bottom-2 left-2 z-10 w-[calc(100%-1rem)] overflow-hidden text-ellipsis
					whitespace-nowrap text-sm font-extrabold text-white sm:left-3 sm:text-xl"
				>
					{name}
				</p>
			</div>
		{/snippet}

		<div
			class="relative overflow-visible transition-all duration-300
			{tabs.orientation === 'horizontal' ? '' : 'col-span-9'}"
			style="height: {innerSize.height ? `${innerSize.height}px` : 'auto'}"
		>
			<div class="inner" bind:this={inner}>
				{#each tabIds as id}
					{@const isActive = id === debouncedTab.current}
					<Transition
						show={isActive}
						leaveFrom={transitionConfig.leaveFrom}
						leaveTo={transitionConfig.leaveTo}
						leave={transitionConfig.leave}
						enterFrom={transitionConfig.enterFrom}
						enter={transitionConfig.enter}
					>
						<div {...tabs.getContent(id)} class="top-0 !block">
							{#if id === "Movies & TV"}
								<div class="movie-grid">
									{@render media("Breaking Bad", "/previews/breaking-bad.jpg")}
									{@render media("Oldboy", "/previews/oldboy.jpg")}
									{@render media("Severance", "/previews/severance.jpg")}
									{@render media("The Truman Show", "/previews/truman-show.jpg")}
								</div>
							{:else if id === "Anime & Manga"}
								<div class="anime-grid">
									{@render media("Attack on Titan", "/previews/aot.jpg")}
									{@render media("JJK", "/previews/nah-id-win.jpg")}
									{@render media("Solo Leveling", "/previews/sung-jinwoo.jpg")}
									{@render media("Berserk", "/previews/berserk.avif")}
								</div>
							{:else if id === "Games"}
								<div class="game-grid">
									{@render media("Elden Ring", "/previews/elden-ring.avif")}
									{@render media("Outer Wilds", "/previews/outer-wilds.webp")}
									{@render media("Ultrakill", "/previews/ultrakill.jpg")}
									{@render media("Animal Well", "/previews/animal-well.jpg")}
								</div>
							{:else if id === "Music"}
								<div class="music-grid">
									{@render media("Spiritbox", "/previews/spiritbox.jpg")}
									{@render media("Nothing but Thieves", "/previews/moral-panic.jpg")}
									{@render media("Deftones", "/previews/white-pony.jpg")}
									{@render media("Slipknot", "/previews/iowa.jpg")}
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
	[data-melt-tabs-content][data-orientation="horizontal"] {
		width: min(550px, 50vw);
	}

	[class*="-grid"] {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		gap: 1rem;
	}

	.media {
		position: relative;
		object-fit: cover;
	}

	.media::after {
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

	/* Games */
	.game-grid {
		grid-template-rows: 260px 200px;
	}

	.game-grid > :nth-child(1) {
		grid-column: 1 / 13;
	}

	.game-grid > :nth-child(2) {
		grid-column: 1 / 5;
	}

	.game-grid > :nth-child(3) {
		grid-column: 5 / 9;
	}

	.game-grid > :nth-child(4) {
		grid-column: 9 / 13;
	}

	/* Music */
	.music-grid {
		grid-template-rows: repeat(2, 220px);
	}

	.music-grid > :nth-child(1) {
		grid-column: 1 / 7;
	}

	.music-grid > :nth-child(2) {
		grid-column: 7 / 13;
	}

	.music-grid > :nth-child(3) {
		grid-column: 1 / 7;
	}

	.music-grid > :nth-child(4) {
		grid-column: 7 / 13;
	}
</style>
