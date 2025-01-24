<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import { PinInput } from "melt/components";

	const controls = usePreviewControls({
		maxLength: {
			label: "Max length",
			defaultValue: 4,
			type: "number",
			min: 1,
			max: 8,
		},
		type: {
			label: "Type",
			type: "select",
			options: ["alphanumeric", "numeric", "text"],
			defaultValue: "text",
		},
		mask: {
			label: "Mask",
			type: "boolean",
			defaultValue: false,
		},
		disabled: {
			label: "Disabled",
			type: "boolean",
			defaultValue: false,
		},
	});
</script>

<Preview>
	<PinInput {...controls}>
		{#snippet children(pinInput)}
			<div {...pinInput.root} class="flex items-center justify-center gap-2 font-mono">
				{#each pinInput.inputs as input}
					<input
						class="focus:border-accent-500 size-12 rounded-xl border-2 border-gray-300 bg-white text-center
				outline-none transition-all hover:border-gray-400 disabled:cursor-not-allowed
				dark:border-gray-400/50 dark:bg-gray-900 dark:hover:border-gray-400 dark:focus:border-gray-300"
						{...input}
					/>
				{/each}
			</div>
		{/snippet}
	</PinInput>
</Preview>
