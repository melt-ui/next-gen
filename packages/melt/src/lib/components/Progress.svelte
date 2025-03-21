<script lang="ts">
	import { getters } from "$lib/utils/getters.svelte.js";
	import { type Snippet } from "svelte";
	import { Progress as Builder, type ProgressProps } from "../builders/Progress.svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<ProgressProps> & {
		children: Snippet<[Builder]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	export const progress = new Builder({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters(rest),
	});
</script>

{@render children(progress)}
