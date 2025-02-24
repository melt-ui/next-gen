<script lang="ts">
	import { PinInput as Builder, type PinInputProps } from "../builders/PinInput.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "$lib/builders/utils.svelte";

	type Props = ComponentProps<PinInputProps> & {
		children: Snippet<[Builder]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	export const pinInput = new Builder({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters(rest),
	});
</script>

{@render children(pinInput)}
