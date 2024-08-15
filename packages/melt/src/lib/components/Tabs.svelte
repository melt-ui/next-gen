<script lang="ts">
	import { Tabs, type TabsProps } from "../builders/Tabs.svelte";
	import {  type Snippet } from "svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<TabsProps> & {
		children: Snippet<[Tabs]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	const tabs = new Tabs({
		value: () => value as string,
		onValueChange: (v) => (value = v),
		selectWhenFocused: () => rest.selectWhenFocused,
		loop: () => rest.loop,
	});
</script>

{@render children(tabs)}
