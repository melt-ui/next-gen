<script lang="ts">
	import { Tabs, type TabsProps } from "../builders/Tabs.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "$lib/builders/utils.svelte";

	type Props = ComponentProps<TabsProps> & {
		children: Snippet<[Tabs]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	const tabs = new Tabs({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters(rest),
	});
</script>

{@render children(tabs)}
