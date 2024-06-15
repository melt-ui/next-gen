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
	import { Tabs } from "@melt-ui/builders";
	import { getContext, setContext, type Snippet } from "svelte";

	let { value = $bindable(), children }: { value?: string | undefined; children: Snippet<[Tabs]> } =
		$props();

	const tabs = new Tabs({
		value: () => value as string,
		onValueChange: (v) => (value = v),
	});

	TabsCtx.set(tabs);
</script>

{@render children(tabs)}
