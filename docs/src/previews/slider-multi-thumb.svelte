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

	let value = $state([35, 65]);
</script>

<Preview>
	<div class="flex flex-col items-center gap-8">
		<div class="text-center font-semibold">Range: [{value.join(" - ")}]</div>

		<SliderMultiThumb bind:value {...controls}>
			{#snippet children(slider)}
				<span
					class="relative flex items-center justify-center p-3 outline-none
					{slider.horizontal ? 'h-[50px] w-[350px] max-w-[90%]' : 'h-[350px] w-[50px]'}"
					{...slider.root}
				>
					<span
						class="rounded-full bg-gray-500
						{slider.horizontal ? 'h-2 w-full' : 'h-full w-2'}"
					>
						<span
							class="bg-accent-500 rounded-full {slider.horizontal ? 'h-2' : 'w-2'}"
							{...slider.range}
						></span>
					</span>

					{#each slider.thumbs as thumb}
						<span
							class="focus-visible:ring-accent-300 border-accent-300 absolute size-6 rounded-md border-2 bg-white outline-none
						transition-all duration-200
						focus-visible:ring focus-visible:ring-offset-black
						data-[dragging]:transition-none
						dark:border-none dark:focus-visible:ring-offset-2
						{slider.horizontal
								? 'left-[var(--percentage)] top-1/2 -translate-x-1/2 -translate-y-1/2'
								: 'left-1/2 top-[var(--percentage)] -translate-x-1/2 -translate-y-1/2'}"
							{...thumb.trigger}
						></span>
					{/each}
				</span>
			{/snippet}
		</SliderMultiThumb>
	</div>
</Preview>
