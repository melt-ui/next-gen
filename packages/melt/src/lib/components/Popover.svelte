<script lang="ts">
	import { getters } from "../utils/getters.svelte";
	import { type Snippet } from "svelte";
	import { Popover as Builder, type PopoverProps } from "../builders/Popover.svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<PopoverProps> & {
		children: Snippet<[Builder]>;
	};

	let { open = $bindable(false), children, ...rest }: Props = $props();

	export const popover = new Builder({
		open: () => open,
		onOpenChange: (v) => (open = v),
		...getters(rest),
		focus: {
			...getters(rest).focus,
		},
	});
</script>

{@render children(popover)}
