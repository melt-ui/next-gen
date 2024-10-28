<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { Slider } from "melt/components";

	const controls = usePreviewControls({
		step: { type: "number", label: "Step", defaultValue: 1 },
		min: { type: "number", label: "Min", defaultValue: 0 },
		max: { type: "number", label: "Max", defaultValue: 100 },
		orientation: {
			type: "select",
			label: "Orientation",
			options: ["horizontal", "vertical"],
			defaultValue: "vertical",
		},
	});
</script>

<Preview>
	<Slider value={30} {...controls}>
		{#snippet children(slider)}
			<div class="group relative mx-auto w-[350px] outline-none" {...slider.root}>
				<div
					class="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-500"
					{...slider.track}
				>
					<div
						class="bg-accent-300 absolute inset-0 right-[var(--percentage-inv)] rounded-full transition-all data-[dragging]:transition-none"
						{...slider.range}
					></div>
				</div>
				<div
					class="group-focus-visible:ring-accent-300 relative left-[var(--percentage)] size-6 -translate-x-1/2 rounded-md bg-white outline-none transition-all
					group-focus-visible:ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-black
					data-[dragging]:transition-none"
					{...slider.thumb}
				></div>
			</div>
		{/snippet}
	</Slider>
</Preview>
