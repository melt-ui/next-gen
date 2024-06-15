<script lang="ts">
	import type { Snippet } from "svelte";
	import { TabsCtx } from "./Root.svelte";
	import type { Tabs } from "@melt-ui/builders";
	import type { HTMLAttributes } from "svelte/elements";

	type Content = ReturnType<Tabs["getContent"]>;

	type BaseProps = {
		value: string;
	};

	type WithChildren = BaseProps &
		HTMLAttributes<HTMLDivElement> & {
			children?: Snippet;
		};

	type WithAsChild = BaseProps & {
		asChild: Snippet<[Content]>;
	};

	type Props = WithChildren | WithAsChild;

	const { value, ...rest }: Props = $props();

	const tabs = TabsCtx.get();
</script>

{#if "asChild" in rest}
	{@render rest.asChild(tabs.getContent(value))}
{:else}
	<div {...tabs.getContent(value)} {...rest}>
		{@render rest.children?.()}
	</div>
{/if}
