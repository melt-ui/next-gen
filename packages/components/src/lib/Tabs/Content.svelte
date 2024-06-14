<script lang="ts">
import type { Snippet } from "svelte";
import { TabsCtx } from "./Root.svelte";
import type { Tabs } from "@melt-ui/builders";

type Content = ReturnType<Tabs["getContent"]>;
const { asChild, children, id , ...rest}: { id: string; asChild?: Snippet<[Content]>; children?: Snippet } = $props();

const tabs = TabsCtx.get();
</script>

{#if asChild}
	{@render asChild(tabs.getContent(id))}
{:else}
	<div {...tabs.getContent(id)} {...rest}>
		{@render children?.()}
	</div>
{/if}
