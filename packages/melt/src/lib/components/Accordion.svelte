<script lang="ts" generics="Multiple extends boolean = false">
	import { Accordion as Builder, type AccordionProps } from "../builders/Accordion.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "../builders/utils.svelte";

	type Props = ComponentProps<AccordionProps<Multiple>> & {
		children: Snippet<[Builder<Multiple>]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	export const accordion = new Builder<Multiple>({
		value: () => value,
		onValueChange(v) {
			value = v;
		},
		...getters({ ...rest }),
	});
</script>

{@render children(accordion)}
