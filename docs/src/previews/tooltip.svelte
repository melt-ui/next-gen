<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { Tooltip } from "melt/builders";
	import { fade } from "svelte/transition";
	import PhPlus from "~icons/ph/plus";

	let controls = usePreviewControls({
		open: {
			label: "Open",
			type: "boolean",
			defaultValue: false,
		},
		forceVisible: {
			label: "Force visible",
			type: "boolean",
			defaultValue: false,
		},
		closeOnPointerDown: {
			label: "Close on pointer down",
			type: "boolean",
			defaultValue: true,
		},
		disableHoverableContent: {
			label: "Disable hoverable content",
			type: "boolean",
			defaultValue: false,
		},
		placement: {
			label: "Placement",
			type: "select",
			options: ["top", "bottom", "left", "right"],
			defaultValue: "bottom"
		},
		openDelay: {
			label: "Open delay",
			type: "number",
			defaultValue: 1000,
		},
		closeDelay: {
			label: "Close delay",
			type: "number",
			defaultValue: 0,
		},
	});

	const computePositionOptions = $derived({ placement: controls.placement });

	const tooltip = new Tooltip({
		open: () => controls.open,
		onOpenChange: (v) => (controls.open = v),
		forceVisible: () => controls.forceVisible,
		computePositionOptions: () => computePositionOptions,
		closeOnPointerDown: () => controls.closeOnPointerDown,
		disableHoverableContent: () => controls.disableHoverableContent,
		openDelay: () => controls.openDelay,
		closeDelay: () => controls.closeDelay,
	});
	
	const tooltip2 = new Tooltip({
		forceVisible: () => controls.forceVisible,
		closeOnPointerDown: () => controls.closeOnPointerDown,
		disableHoverableContent: () => controls.disableHoverableContent,
		openDelay: () => controls.openDelay,
		closeDelay: () => controls.closeDelay,
	});
</script>

<Preview>
	<div class="flex justify-center">
		<button type="button" class="trigger" aria-label="Add" {...tooltip.trigger}>
			<PhPlus class="size-4" aria-label="Plus"></PhPlus>
		</button>
	</div>
	{#if controls.open}
		<div 
			{...tooltip.content}
			transition:fade={{ duration: 100 }}
			class="z-10 rounded-lg bg-white shadow"
		>
			<div {...tooltip.arrow}></div>
			<p 
				class="px-4 py-1 text-gray-700"
				{...tooltip2.trigger}
			>
				Add item to library
			</p>
		</div>
	{/if}
	{#if tooltip2.open}
		<div
			{...tooltip2.content}
			transition:fade={{ duration: 100 }}
			class="z-10 rounded-lg bg-white shadow"
		>
			<div {...tooltip2.arrow}></div>
			<p class="px-4 py-1 text-gray-700">You didn't expect that, did you?</p>
		</div>
	{/if}
</Preview>

<style lang="postcss">
  .trigger {
    @apply inline-flex h-9 w-9 items-center justify-center rounded-full bg-white;
    @apply text-gray-900 transition-colors hover:bg-white/90;
    @apply focus-visible:ring focus-visible:ring-gray-400 focus-visible:ring-offset-2;
    @apply p-0 text-sm font-medium;
  }
</style>