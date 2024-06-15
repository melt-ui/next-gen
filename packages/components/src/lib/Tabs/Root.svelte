<script lang="ts" context="module">
	const CTX_SYMBOL = Symbol("Tabs");

	type Context = Tabs;
	export const TabsCtx = {
		get: () => {
			return getContext<Context>(CTX_SYMBOL);
		},
		set: (ctx: Context) => {
			setContext<Context>(CTX_SYMBOL, ctx);
		},
	};
</script>

<script lang="ts">
	import { Tabs, type TabsProps } from "@melt-ui/builders";
	import { getContext, setContext, type Snippet } from "svelte";
	import type { WithoutGetters } from "../types";

	type Props = WithoutGetters<Omit<TabsProps, "value" | "onValueChange">> & {
		value?: string | undefined;
		children: Snippet<[Tabs]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	const tabs = new Tabs({
		value: () => value as string,
		onValueChange: (v) => (value = v),
		selectWhenFocused: () => rest.selectWhenFocused,
		loop: () => rest.loop,
	});

	TabsCtx.set(tabs);
</script>

{@render children(tabs)}
