<script lang="ts">
	import { ToggleGroup as Builder, type ToggleGroupProps } from "../builders/ToggleGroup.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<ToggleGroupProps> & {
		children: Snippet<[Builder]>;
	};

	let { 
		value = $bindable(undefined), 
		type = "single",
		orientation = "horizontal",
		loop = true,
		required = false,
		defaultItem = undefined,
		name = undefined,
		children, 
		...rest 
	}: Props = $props();

	export const group = new Builder({
		value: () => value,
		onValueChange: (v) => (value = v),
		type: () => type,
		orientation: () => orientation,
		loop: () => loop,
		required: () => required,
		defaultItem: () => defaultItem,
		name: () => name,
		disabled: () => rest.disabled,
	});
</script>

{@render children(group)}