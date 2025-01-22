<!-- 
 <script lang="ts" generics="Multiple extends boolean = false">
	import { Accordion, type AccordionProps } from "../builders/Accordion.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "$lib/builders";

	type Props = ComponentProps<AccordionProps<Multiple>> & {
		children: Snippet<[Accordion<Multiple>]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

    // TODO: getting some type errors on the value...
	const accordion = new Accordion<Multiple>({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters({ ...rest }),
	});
</script>

{@render children(accordion)} 

-->
