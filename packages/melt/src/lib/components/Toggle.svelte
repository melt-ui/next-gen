<script lang="ts">
	import { Toggle, type ToggleProps } from "../builders/Toggle.svelte";
	import {  type Snippet } from "svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<ToggleProps> & {
		children: Snippet<[Toggle]>;
	};

	let { value = $bindable(false), children, ...rest }: Props = $props();

	const tabs = new Toggle({
		value: () => value,
		onValueChange: (v) => (value = v),
		disabled: () => rest.disabled,
	});
</script>

{@render children(tabs)}
