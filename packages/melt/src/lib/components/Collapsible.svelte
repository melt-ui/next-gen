<script lang="ts">
	import { getters } from "$lib/utils/getters.svelte.js";
	import { type Snippet } from "svelte";
	import { Collapsible as Builder, type CollapsibleProps } from "../builders/Collapsible.svelte";
	import type { ComponentProps } from "../types";

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
