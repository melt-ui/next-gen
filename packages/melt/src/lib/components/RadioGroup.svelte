<script lang="ts">
	import { RadioGroup as Builder, type RadioGroupProps } from "../builders/RadioGroup.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "$lib/builders";

	type Props = ComponentProps<RadioGroupProps> & {
		children: Snippet<[Builder]>;
	};

	let { value = $bindable(undefined), children, ...rest }: Props = $props();

	const group = new Builder({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters(rest),
	});
</script>

{@render children(group)}
