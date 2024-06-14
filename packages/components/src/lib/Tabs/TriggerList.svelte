<script lang="ts">
	import type { Snippet } from "svelte";
	import { TabsCtx } from "./Root.svelte";
	import type { Tabs } from "@melt-ui/builders";

	const { asChild, children , ...rest}: { asChild?: Snippet<[Tabs["triggerList"]]>; children?: Snippet } = $props();

	const tabs = TabsCtx.get();
</script>

{#if asChild}
	{@render asChild(tabs.triggerList)}
{:else}
	<div {...tabs.triggerList} {...rest}>
	{@render children?.()}
</div>
{/if}
