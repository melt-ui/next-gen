<script lang="ts">
	import { PinInput, type PinInputProps } from "../builders/PinInput.svelte.js";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types.js";
	import { getters } from "$lib/builders/utils.svelte.js";

	type Props = ComponentProps<PinInputProps> & {
		children: Snippet<[PinInput]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	const tabs = new PinInput({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters(rest),
	});
</script>

{@render children(tabs)}
