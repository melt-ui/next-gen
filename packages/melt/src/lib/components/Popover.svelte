<script lang="ts">
	import { Popover, type PopoverProps } from "../builders/Popover.svelte";
	import {  type Snippet } from "svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<PopoverProps> & {
		children: Snippet<[Popover]>;
	};

	let { open = $bindable(false), children, ...rest }: Props = $props();

	const popover = new Popover({
		open: () => open,
		onOpenChange: (v) => (open = v),
		forceVisible: () => rest.forceVisible,
	});
</script>

{@render children(popover)}
