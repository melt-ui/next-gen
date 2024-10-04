<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { Slider } from "melt/components";
</script>

<Preview>
	<Slider>
		{#snippet children(slider)}
			<div class="relative w-[350px]" {...slider.root}>
				<div
					class="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 bg-gray-500"
					{...slider.track}
				>
					<div class="absolute inset-0 right-16 bg-orange-300" {...slider.range}></div>
				</div>
				<div
					class="relative left-[var(--percentage)] size-6 -translate-x-1/2 rounded-full bg-white"
					{...slider.thumb}
				></div>
			</div>
		{/snippet}
	</Slider>
</Preview>
