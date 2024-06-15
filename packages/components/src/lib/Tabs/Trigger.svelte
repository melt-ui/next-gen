<script lang="ts">
	import type { Snippet } from "svelte";
	import { TabsCtx } from "./Root.svelte";
	import type { Tabs } from "@melt-ui/builders";
	import type { HTMLAttributes } from "svelte/elements";

	type Trigger = ReturnType<Tabs["getTrigger"]>;

	type BaseProps = {
		value: string;
	};
	type WithChildren = BaseProps &
		HTMLAttributes<HTMLButtonElement> & {
			children?: Snippet;
		};
	type WithAsChild = BaseProps & {
		asChild: Snippet<[Trigger]>;
	};
	type Props = WithChildren | WithAsChild;

	const { value, ...rest }: Props = $props();
	const tabs = TabsCtx.get();
</script>

{#if "asChild" in rest}
	{@render rest.asChild(tabs.getTrigger(value))}
{:else}
	<button {...tabs.getTrigger(value)} {...rest}>
		{@render rest.children?.()}
	</button>
{/if}
