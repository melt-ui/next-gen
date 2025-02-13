<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { Select } from "melt/builders";

	const controls = usePreviewControls({});

	const select = new Select({
		forceVisible: true,
		sameWidth: true,
	});

	const options = ["Option 1", "Option 2", "Option 3"];
</script>

<Preview>
	<div class="flex justify-center">
		<button
			{...select.trigger}
			class="w-[300px] rounded-lg bg-gray-100 px-4 py-2 text-left dark:bg-gray-800"
		>
			{select.value ?? "Select a value"}
		</button>

		<div {...select.content} class="flex flex-col gap-4 bg-neutral-500">
			{#each options as option}
				<button {...select.getOption(option)}>
					{option}
				</button>
			{/each}
		</div>
	</div>
</Preview>

<style>
	[data-melt-select-content] {
		position: absolute;
		pointer-events: none;
		opacity: 0;

		transform: scale(0.95);

		transition: 0.2s;
		transition-property: opacity, transform;
		transform-origin: var(--melt-popover-content-transform-origin, center);
	}

	[data-melt-select-content][data-open] {
		pointer-events: auto;
		opacity: 1;

		transform: scale(1);
	}
</style>
