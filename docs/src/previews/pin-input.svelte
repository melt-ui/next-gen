<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
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
						class="size-12 rounded-xl border-2 border-gray-400/50 text-center outline-none
				transition-all hover:border-gray-400 focus:border-gray-300 disabled:cursor-not-allowed"
						{...input}
					/>
				{/each}
			</div>
		{/snippet}
	</PinInput>
</Preview>
