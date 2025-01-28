<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { SliderMultiThumb } from "melt/components";

	const controls = usePreviewControls({
		step: { type: "number", label: "Step", defaultValue: 1 },
		min: { type: "number", label: "Min", defaultValue: 0 },
		max: { type: "number", label: "Max", defaultValue: 100 },
		orientation: {
			type: "select",
			label: "Orientation",
			options: ["horizontal", "vertical"],
			defaultValue: "horizontal",
		},
		dir: {
			type: "select",
			label: "Direction",
			options: ["ltr", "rtl"],
			defaultValue: "ltr",
		},
		autoSort: {
			type: "boolean",
			defaultValue: true,
			label: "Auto Sort",
		},
	});

	let open = $state(true);
	let value = $state([0, 25, 50, 75, 100]);
</script>

<Preview>
	<div class="flex flex-col gap-8">
		<button onclick={() => value.push(20)}>push</button>
		<button onclick={() => (value[0] += 15)}>add</button>
		<button onclick={() => (open = !open)}>open: {open}</button>
		<div class="text-center">[{value}]</div>

		<SliderMultiThumb bind:value {...controls}>
			{#snippet children(slider)}
				<div
					class="relative mx-auto p-3 outline-none
					{slider.orientation === 'horizontal' ? 'h-[50px] w-[350px] max-w-[90%]' : 'h-[350px] w-[50px]'}"
					{...slider.root}
				>
					<div
						class="absolute rounded-full bg-gray-500
						{slider.orientation === 'horizontal'
							? 'left-0 right-0 top-1/2 h-2 -translate-y-1/2'
							: 'bottom-0 left-1/2 top-0 w-2 -translate-x-1/2'}"
					>
						<div class="bg-accent-500 h-2 rounded-full" {...slider.range}></div>
					</div>

					<!-- <div class="bg-accent-300 absolute inset-0 rounded-full"></div> -->

					{#if open}
						{#each slider.thumbs as thumb}
							<div
								class="focus-visible:ring-accent-300 border-accent-300 absolute size-6 rounded-md border-2 bg-white outline-none
							transition-all duration-200
							focus-visible:ring focus-visible:ring-offset-black
							data-[dragging]:transition-none
							dark:border-none dark:focus-visible:ring-offset-2
							{slider.orientation === 'horizontal'
									? 'left-[var(--percentage)] top-1/2 -translate-x-1/2 -translate-y-1/2'
									: 'left-1/2 top-[var(--percentage)] -translate-x-1/2 -translate-y-1/2'}"
								{...thumb.trigger}
							></div>
						{/each}
					{/if}
				</div>
			{/snippet}
		</SliderMultiThumb>
	</div>
</Preview>
