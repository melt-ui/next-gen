<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { PinInput } from "@melt-ui/builders";

	const controls = usePreviewControls({
		maxLength: {
			label: "Max length",
			defaultValue: 4,
			type: "number",
			min: 1,
			max: 8,
		}
	});
	const pinInput = new PinInput({ maxLength: () => controls.maxLength });
</script>

<Preview>
	<div {...pinInput.root} class="flex items-center justify-center gap-2 font-mono">
		{#each pinInput.inputs as input}
			<input
				class="size-12 rounded-xl border-2 border-gray-400/50 text-center outline-none
				transition-all hover:border-gray-400 focus:border-gray-300"
				{...input}
			/>
		{/each}
	</div>
	<pre class="mx-auto text-center">{pinInput.value}</pre>
</Preview>
