<script lang="ts">
	import { Popover, type PopoverProps } from "$lib/builders/Popover.svelte";
	import type { ComponentProps } from "$lib/types.js";
	import { type Snippet } from "svelte";
	import { builderProps } from "./utils.js";

	interface Props extends ComponentProps<PopoverProps> {
		children: Snippet<[Popover]>;
	}

	let { open = $bindable(false), onOpenChange, children, ...props }: Props = $props();

	const popover = new Popover({
		open: () => open,
		onOpenChange(value) {
			open = value;
			onOpenChange?.(value);
		},
		...builderProps(props),
	});
</script>

{@render children(popover)}
