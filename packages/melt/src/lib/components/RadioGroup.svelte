<script lang="ts">
	import { getters } from "$lib/utils/getters.svelte.js";
	import { type Snippet } from "svelte";
	import { RadioGroup as Builder, type RadioGroupProps } from "../builders/RadioGroup.svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<RadioGroupProps> & {
		children: Snippet<[Builder]>;
	};

	let { value = $bindable(undefined), children, ...rest }: Props = $props();

	export const group = new Builder({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters(rest),
	});
</script>

{@render children(group)}
