<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import { Tooltip, getters } from "melt/builders";
	import { Tooltip as TooltipComponent } from "melt/components";
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
		...getters(controls),
		open: () => controls.open,
		onOpenChange: (v) => (controls.open = v),
		computePositionOptions: () => computePositionOptions,
	});
</script>

<Preview>
	<button 
		type="button" class="mx-auto block rounded-full text-gray-900 h-9 w-9
			hover:text-accent-700 hover:dark:text-accent-400 transition-colors 
			hover:bg-gray-200 p-0 text-sm font-medium focus-visible:ring
			focus-visible:ring-gray-400 focus-visible:ring-offset-2 bg-white" 
		aria-label="Add" 
		{...tooltip.trigger}
	>
		<PhPlus class="size-4 m-auto block" aria-label="Plus"></PhPlus>
	</button>

	<div {...tooltip.content} class="rounded-lg bg-white shadow-xl p-0">
		<div {...tooltip.arrow}></div>
		<TooltipComponent {...controls} open={false} {computePositionOptions}>
			{#snippet children(tooltip2)}
				<p class="px-4 py-1 text-gray-700" {...tooltip2.trigger}>
					Add item to library
				</p>
				<div {...tooltip2.content} class="rounded-lg bg-white shadow-xl backdrop-blur p-0">
					<div {...tooltip2.arrow}></div>
					<p class="px-4 py-1 text-gray-700">
						You didn't expect that, did you?
					</p>
				</div>
			{/snippet}
		</TooltipComponent>
	</div>
</Preview>

<style>
	[data-melt-tooltip-content] {
		border: 0;

		position: absolute;
		pointer-events: none;
		opacity: 0;

		transform: scale(0.9);

		transition: 0.3s;
		transition-property: opacity, transform;
		transform-origin: var(--melt-popover-content-transform-origin, center);
	}

	[data-melt-tooltip-content][data-open] {
		pointer-events: auto;
		opacity: 1;

		transform: scale(1);
	}
</style>