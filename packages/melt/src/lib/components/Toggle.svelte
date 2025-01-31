<script lang="ts">
	import { Toggle as Builder, type ToggleProps } from "../builders/Toggle.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<ToggleProps> & {
		children: Snippet<[Builder]>;
	};

	let { value = $bindable(false), children, ...rest }: Props = $props();

	export const toggle = new Builder({
		value: () => value,
		onValueChange: (v) => (value = v),
		disabled: () => rest.disabled,
	});
</script>

{@render children(toggle)}
