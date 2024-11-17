<script lang="ts">
	import { PinInput, type PinInputProps } from "$lib/builders/PinInput.svelte.js";
	import type { ComponentProps } from "$lib/types.js";
	import { type Snippet } from "svelte";
	import { builderProps } from "./utils.js";

	interface Props extends ComponentProps<PinInputProps> {
		children: Snippet<[PinInput]>;
	}

	let { value = $bindable(), onValueChange, children, ...props }: Props = $props();

	const input = new PinInput({
		value: () => value,
		onValueChange(v) {
			value = v;
			onValueChange?.(v);
		},
		...builderProps(props),
	});
</script>

{@render children(input)}
