<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { PinInput } from "@melt-ui/builders";

	const controls = usePreviewControls({});
	const pinInput = new PinInput();
</script>

<Preview>
	<div {...pinInput.root} class="flex items-center justify-center gap-2 font-mono">
		{#each Array(4) as _, i}
			<input
				class="size-12 rounded-xl border-2 border-gray-400/50 text-center outline-none
				transition-all hover:border-gray-400 focus:border-gray-300"
				{...pinInput.input}
			/>
		{/each}
	</div>
	<pre class="mx-auto text-center">{pinInput.value}</pre>
</Preview>
