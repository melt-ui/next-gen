<script lang="ts">
	import { Select } from "../Select.svelte.js";

	type Item = { label: string; value: unknown };
	const items: Item[] = [
		{ label: "one", value: 1 },
		{ label: "a", value: "a" },
		{ label: "obj", value: { a: 1, b: 2 } },
	];

	const select = new Select<Item["value"], true>({
		multiple: true,
		sameWidth: false,
	});
</script>

<label for={select.ids.trigger}>Label</label>
<button {...select.trigger}>
	<span class="truncate">{select.valueAsString || "Select an item"}</span>
</button>

<div {...select.content}>
	{#each items as item}
		<div {...select.getOption(item.value, item.label)}>
			<span>{item.label}</span>
			{#if select.isSelected(item.value)}
				selected
			{/if}
		</div>
	{/each}
</div>
