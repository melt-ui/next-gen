<script lang="ts">
	import { Combobox } from "../Combobox.svelte.js";

	type Item = { label: string; value: unknown };
	const items: Item[] = [
		{ label: "one", value: 1 },
		{ label: "a", value: "a" },
		{ label: "obj", value: { a: 1, b: 2 } },
	];

	const combobox = new Combobox<Item["value"], true>({
		multiple: true,
	});
</script>

<label for={combobox.ids.input}>Label</label>
<input {...combobox.input} />
<button {...combobox.trigger}>Toggle</button>

<div {...combobox.content}>
	{#each items as item}
		<div {...combobox.getOption(item.value, item.label)}>
			<span>{item.label}</span>
			{#if combobox.isSelected(item.value)}
				selected
			{/if}
		</div>
	{/each}
</div>
