<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { Popover } from "melt";
	import { spring } from "svelte/motion";
	import { fade } from "svelte/transition";
	import PhHeartBold from "~icons/ph/heart-bold";
	import PhHeartFill from "~icons/ph/heart-fill";

	const controls = usePreviewControls({});

	const popover = new Popover({ forceVisible: true });
</script>

<Preview>
	<button
		class="relative size-16 rounded-xl bg-transparent text-xl
				transition-all hover:cursor-pointer hover:bg-gray-500/50 active:bg-gray-600/50
			  disabled:cursor-not-allowed disabled:bg-gray-500 disabled:opacity-50"
		{...popover.trigger}
	>
		open
	</button>

	{#if popover.open}
		<div {...popover.content} transition:fade>hey</div>
	{/if}
</Preview>

<style>
	div:popover-open {
		color: red;
	}
</style>
