<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { Popover } from "melt/builders";
	import { fade } from "svelte/transition";

	const controls = usePreviewControls({});

	const popover = new Popover({ forceVisible: true });
	const popover2 = new Popover({ forceVisible: false });
</script>

<Preview>
	<button
		class="relative h-16 rounded-xl bg-transparent text-xl
				transition-all hover:cursor-pointer hover:bg-gray-500/50 active:bg-gray-600/50
			  disabled:cursor-not-allowed disabled:bg-gray-500 disabled:opacity-50"
		{...popover.trigger}
	>
		{popover.open ? "close" : "open"} force visible
	</button>

	{#if popover.open}
		<div {...popover.content} transition:fade>hey</div>
	{/if}

	<button
		class="relative h-16 rounded-xl bg-transparent text-xl
				transition-all hover:cursor-pointer hover:bg-gray-500/50 active:bg-gray-600/50
			  disabled:cursor-not-allowed disabled:bg-gray-500 disabled:opacity-50"
		{...popover2.trigger}
	>
		{popover2.open ? "close" : "open"} non force visible
	</button>

	<div {...popover2.content}>ho</div>
</Preview>

<style>
	div:popover-open {
		color: red;
	}
</style>
