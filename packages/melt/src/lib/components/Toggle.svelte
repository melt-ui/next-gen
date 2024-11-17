<script lang="ts">
	import { Toggle, type ToggleProps } from "$lib/builders/Toggle.svelte.js";
	import type { ComponentProps } from "$lib/types.js";
	import { type Snippet } from "svelte";
	import { builderProps } from "./utils.js";

	interface Props extends ComponentProps<ToggleProps> {
		children: Snippet<[Toggle]>;
	}

	let { value = $bindable(false), onValueChange, children, ...props }: Props = $props();

	const toggle = new Toggle({
		value: () => value,
		onValueChange(v) {
			value = v;
			onValueChange?.(v);
		},
		...builderProps(props),
	});
</script>

{@render children(toggle)}
