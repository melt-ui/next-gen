<script lang="ts">
	import { Tabs, type TabsProps } from "$lib/builders/Tabs.svelte.js";
	import type { ComponentProps } from "$lib/types.js";
	import { type Snippet } from "svelte";
	import { builderProps } from "./utils.js";

	type Props = ComponentProps<TabsProps> & {
		children: Snippet<[Tabs]>;
	};

	let { value = $bindable(), onValueChange, children, ...props }: Props = $props();

	// TODO: fix the type error here
	const tabs = new Tabs({
		value: () => value,
		onValueChange(v) {
			value = v;
			onValueChange?.(v);
		},
		...builderProps(props),
	});
</script>

{@render children(tabs)}
