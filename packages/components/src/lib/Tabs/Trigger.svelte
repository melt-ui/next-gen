<script lang="ts">
import type { Snippet } from "svelte";
import { TabsCtx } from "./Root.svelte";
import type { Tabs } from "@melt-ui/builders";

type Trigger = ReturnType<Tabs["getTrigger"]>;
const { asChild, children, id, ...rest }: { id: string; asChild?: Snippet<[Trigger]>; children?: Snippet } = $props();

const tabs = TabsCtx.get();
</script>

{#if asChild}
	{@render asChild(tabs.getTrigger(id))}
{:else}
	<button {...tabs.getTrigger(id)} {...rest}>
		{@render children?.()}
	</button>
{/if}
