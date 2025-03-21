<script lang="ts">
	import { getters } from "$lib/utils/getters.svelte.js";
	import { type Snippet } from "svelte";
	import { Slider as Builder, type SliderProps } from "../builders/Slider.svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<SliderProps> & {
		children: Snippet<[Builder]>;
	};

	let { value = $bindable(), children, ...rest }: Props = $props();

	export const slider = new Builder({
		value: () => value,
		onValueChange: (v) => (value = v),
		...getters(rest),
	});
</script>

{@render children(slider)}
