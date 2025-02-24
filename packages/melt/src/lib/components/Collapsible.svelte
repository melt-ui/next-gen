<script lang="ts">
	import { Collapsible as Builder, type CollapsibleProps } from "../builders/Collapsible.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "../builders";

	type Props = ComponentProps<CollapsibleProps> & {
		children: Snippet<[Builder]>;
	};

	let { open = $bindable(false), children, ...rest }: Props = $props();

	export const collapsible = new Builder({
		open: () => open,
		onOpenChange: (v) => (open = v),
		...getters(rest),
	});
</script>

{@render children(collapsible)}
