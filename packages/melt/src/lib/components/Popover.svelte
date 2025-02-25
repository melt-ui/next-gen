<script lang="ts">
	import { Popover as Builder, type PopoverProps } from "../builders/Popover.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "../builders";

	type Props = ComponentProps<PopoverProps> & {
		children: Snippet<[Builder]>;
	};

	let { open = $bindable(false), children, ...rest }: Props = $props();

	export const popover = new Builder({
		open: () => open,
		onOpenChange: (v) => (open = v),
		...getters(rest),
	});
</script>

{@render children(popover)}
