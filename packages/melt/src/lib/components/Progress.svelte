<script lang="ts">
	import { Progress as Builder, type ProgressProps } from "../builders/Progress.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "$lib/builders/utils.svelte";

	type Props = ComponentProps<ProgressProps> & {
		children: Snippet<[Builder]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	const progress = new Builder({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters(rest),
	});
</script>

{@render children(progress)}
