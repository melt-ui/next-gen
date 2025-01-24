<script lang="ts">
	import { Collapsible, type CollapsibleProps } from "../builders/Collapsible.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "$lib/builders";

	type Props = ComponentProps<CollapsibleProps> & {
		children: Snippet<[Collapsible]>;
	};

	let { open = $bindable(false), children, ...rest }: Props = $props();

	const collapsible = new Collapsible({
		open: () => open,
		onOpenChange: (v) => (open = v),
		...getters(rest),
	});
</script>

{@render children(collapsible)}
