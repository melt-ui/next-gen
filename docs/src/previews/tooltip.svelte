<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import { Tooltip, getters } from "melt/builders";
	import PhChefHatFill from "~icons/ph/chef-hat-fill";

	let controls = usePreviewControls({
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
			defaultValue: "top",
		},
		openDelay: {
			label: "Open delay",
			type: "number",
			defaultValue: 100,
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
		forceVisible: true,
		computePositionOptions: () => computePositionOptions,
	});
</script>

<Preview>
	<button
		type="button"
		class="mx-auto grid size-12 place-items-center rounded-xl text-white transition
		dark:bg-gray-800 dark:hover:bg-gray-700 dark:active:bg-gray-600"
		aria-label="Add"
		{...tooltip.trigger}
	>
		<PhChefHatFill aria-label="Plus"></PhChefHatFill>
	</button>

	<div {...tooltip.content} class="rounded-xl bg-white p-0 shadow-xl dark:bg-gray-800">
		<div {...tooltip.arrow} class="rounded-tl"></div>
		<p class="px-4 py-1 text-gray-700 dark:text-white">Let us cook!</p>
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

