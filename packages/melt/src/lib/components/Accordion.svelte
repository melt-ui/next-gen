<!-- 
 <script lang="ts" generics="Multiple extends boolean = false">
	import { Accordion as Builder, type AccordionProps } from "../builders/Accordion.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "$lib/builders";

	type Props = ComponentProps<AccordionProps<Multiple>> & {
		children: Snippet<[Builder<Multiple>]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

    // TODO: getting some type errors on the value...
	const accordion = new Builder<Multiple>({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters({ ...rest }),
	});
</script>

{@render children(accordion)} 

-->
