<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import { Dropzone } from "melt/builders";

	const controls = usePreviewControls({});

	const dropzone = new Dropzone({});
</script>

<Preview>
	<div class="flex justify-center">
		<div {...dropzone.root} class="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
			Dropzone Preview
		</div>
	</div>
</Preview>

