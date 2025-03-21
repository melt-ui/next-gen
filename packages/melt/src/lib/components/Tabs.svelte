<script lang="ts">
	import { getters } from "$lib/utils/getters.svelte.js";
	import { type Snippet } from "svelte";
	import { Tabs as Builder, type TabsProps } from "../builders/Tabs.svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<TabsProps> & {
		children: Snippet<[Builder]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	export const tabs = new Builder({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters(rest),
	});
</script>

{@render children(tabs)}
