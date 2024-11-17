<script lang="ts">
	import { Slider, type SliderProps } from "$lib/builders/Slider.svelte.js";
	import type { ComponentProps } from "$lib/types.js";
	import { type Snippet } from "svelte";
	import { builderProps } from "./utils.js";

	interface Props extends ComponentProps<SliderProps> {
		children: Snippet<[Slider]>;
	}

	let { value = $bindable(), onValueChange, children, ...props }: Props = $props();

	const slider = new Slider({
		value: () => value,
		onValueChange(v) {
			value = v;
			onValueChange?.(v);
		},
		...builderProps(props),
	});
</script>

{@render children(slider)}
