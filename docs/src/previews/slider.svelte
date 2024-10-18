<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { Slider } from "melt/components";
</script>

<Preview>
	<Slider>
		{#snippet children(slider)}
			<div class="relative mx-auto w-[350px]" {...slider.root}>
				<div
					class="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-500"
					{...slider.track}
				>
					<div
						class="bg-accent-200 absolute inset-0 right-[var(--percentage-inv)] rounded-full transition-all data-[dragging]:transition-none"
						{...slider.range}
					></div>
				</div>
				<div
					class="focus-within:ring-accent-200 relative left-[var(--percentage)] size-6 -translate-x-1/2 rounded-full
					bg-white outline-none transition-all focus-within:ring data-[dragging]:transition-none"
					{...slider.thumb}
				></div>
			</div>
		{/snippet}
	</Slider>
</Preview>
