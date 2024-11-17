<script lang="ts" generics="TValue">
	import { MultiSelectTree, type MultiSelectTreeProps } from "$lib/builders/Tree.svelte.js";
	import type { ComponentProps } from "$lib/types.js";
	import type { Snippet } from "svelte";
	import { builderProps } from "./utils.js";

	interface Props extends ComponentProps<MultiSelectTreeProps<TValue>> {
		children: Snippet<[MultiSelectTree<TValue>]>;
	}

	const { onExpandedChange, onSelectedChange, children, ...props }: Props = $props();

	const tree = new MultiSelectTree({
		onExpandedChange,
		onSelectedChange,
		...builderProps(props),
	});
</script>

{@render children(tree)}
