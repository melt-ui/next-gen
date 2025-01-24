<script lang="ts">
	import { RadioGroup, type RadioGroupProps } from "../builders/RadioGroup.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "$lib/builders";

	type Props = ComponentProps<RadioGroupProps> & {
		children: Snippet<[RadioGroup]>;
	};

	let { value = $bindable(undefined), children, ...rest }: Props = $props();

	const group = new RadioGroup({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters(rest),
	});
</script>

{@render children(group)}
