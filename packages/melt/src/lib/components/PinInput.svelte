<script lang="ts">
	import { PinInput, type PinInputProps } from "../builders/PinInput.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<PinInputProps> & {
		children: Snippet<[PinInput]>;
	};

	let { value = $bindable(''), children, ...rest }: Props = $props();

	const tabs = new PinInput({
		value: () => value,
		onValueChange: (v) => (value = v),
		disabled: () => rest.disabled,
		type: () => rest.type,
		mask: () => rest.mask,
		maxLength: () => rest.maxLength,
		placeholder: () => rest.placeholder,
	});
</script>

{@render children(tabs)}
