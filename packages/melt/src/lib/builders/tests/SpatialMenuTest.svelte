<script lang="ts">
	import { SpatialMenu } from "../SpatialMenu.svelte.js";

	type Item = { label: string; value: unknown };
	const items: Item[] = [
		{ label: "top-left", value: "tl" },
		{ label: "top-right", value: "tr" },
		{ label: "bottom-left", value: "bl" },
		{ label: "bottom-right", value: "br" },
		{ label: "center", value: "c" },
	];

	const spatialMenu = new SpatialMenu<Item["value"]>({
		highlighted: "c",
		onSelect: (value) => console.log("Selected:", value),
	});
</script>

<div {...spatialMenu.root} data-testid="spatial-menu-root">
	<input {...spatialMenu.input} data-testid="spatial-menu-input" />
	
	<div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
		<div {...spatialMenu.getItem("tl").attrs} data-testid="item-tl">
			{items.find(i => i.value === "tl")?.label}
		</div>
		<div {...spatialMenu.getItem("tr").attrs} data-testid="item-tr">
			{items.find(i => i.value === "tr")?.label}
		</div>
		<div {...spatialMenu.getItem("c").attrs} data-testid="item-c" style="grid-column: 1 / -1; justify-self: center;">
			{items.find(i => i.value === "c")?.label}
		</div>
		<div {...spatialMenu.getItem("bl").attrs} data-testid="item-bl">
			{items.find(i => i.value === "bl")?.label}
		</div>
		<div {...spatialMenu.getItem("br").attrs} data-testid="item-br">
			{items.find(i => i.value === "br")?.label}
		</div>
	</div>
</div>