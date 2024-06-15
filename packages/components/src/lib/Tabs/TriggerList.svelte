<script lang="ts">
	import type { Snippet } from "svelte";
	import { TabsCtx } from "./Root.svelte";
	import type { Tabs } from "@melt-ui/builders";
	import type { HTMLAttributes } from "svelte/elements";

	type TriggerList = Tabs["triggerList"];

	type WithChildren = HTMLAttributes<HTMLDivElement> & {
		children?: Snippet;
	};
	type WithAsChild = {
		asChild: Snippet<[TriggerList]>;
	};
	type Props = WithChildren | WithAsChild;

	const {...rest }: Props = $props();

	const tabs = TabsCtx.get();
</script>

{#if "asChild" in rest}
	{@render rest.asChild(tabs.triggerList)}
{:else}
	<div {...tabs.triggerList} {...rest}>
		{@render rest.children?.()}
	</div>
{/if}
