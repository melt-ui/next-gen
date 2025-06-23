<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import { SpatialMenu } from "melt/builders";

	const controls = usePreviewControls({});

	const spatialMenu = new SpatialMenu({});
</script>

<Preview>
	<div class="flex justify-center">
		<div {...spatialMenu.root} class="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
			SpatialMenu Preview
		</div>
	</div>
</Preview>

