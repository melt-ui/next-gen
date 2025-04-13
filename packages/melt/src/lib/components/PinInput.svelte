<script lang="ts">
	import { getters } from "$lib/utils/getters.svelte.js";
	import { type Snippet } from "svelte";
	import { PinInput as Builder, type PinInputProps } from "../builders/PinInput.svelte";
	import type { ComponentProps } from "../types";

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
