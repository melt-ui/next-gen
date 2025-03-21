<script lang="ts" generics="Multiple extends boolean = false">
	import { getters } from "$lib/utils/getters.svelte.js";
	import { type Snippet } from "svelte";
	import { Accordion as Builder, type AccordionProps } from "../builders/Accordion.svelte";
	import type { ComponentProps } from "../types";

	type Props = Omit<ComponentProps<AccordionProps<Multiple>>, "multiple"> & {
		children: Snippet<[Builder<Multiple>]>;
		multiple?: Multiple;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	export const accordion = new Builder<Multiple>({
		value: () => value as unknown as any,
		onValueChange(v) {
			value = v as any;
		},
		...getters({ ...rest }),
	});
</script>

{@render children(accordion)}
