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
			defaultValue: "horizontal",
		},
	});
</script>

<Preview>
	<Slider value={30} {...controls}>
		{#snippet children(slider)}
			<div
				class="group relative mx-auto p-3 outline-none
				{slider.orientation === 'horizontal' ? 'w-[350px]' : 'h-[350px] w-[50px]'}"
				{...slider.root}
			>
				<div
					class="absolute rounded-full bg-gray-500
					{slider.orientation === 'horizontal'
						? 'left-0 right-0 top-1/2 h-2 -translate-y-1/2'
						: 'bottom-0 left-1/2 top-0 w-2 -translate-x-1/2'}"
				>
					<div
						class="bg-accent-300 absolute inset-0 rounded-full transition-all group-data-[dragging]:transition-none
						{slider.orientation === 'horizontal' ? 'right-[var(--percentage-inv)]' : 'top-[var(--percentage)]'}"
					></div>
				</div>
				<div
					class="focus-visible:ring-accent-300 absolute size-6 rounded-md bg-white outline-none
					transition-all focus-visible:ring focus-visible:ring-offset-2
					focus-visible:ring-offset-black data-[dragging]:transition-none
					{slider.orientation === 'horizontal'
						? 'left-[var(--percentage)] top-1/2 -translate-x-1/2 -translate-y-1/2'
						: 'left-1/2 top-[var(--percentage)] -translate-x-1/2 -translate-y-1/2'}"
					{...slider.thumb}
				></div>
			</div>
		{/snippet}
	</Slider>
</Preview>
