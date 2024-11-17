<script lang="ts" generics="TValue">
	import { SingleSelectTree, type SingleSelectTreeProps } from "$lib/builders/Tree.svelte.js";
	import type { ComponentProps } from "$lib/types.js";
	import type { Snippet } from "svelte";
	import { builderProps } from "./utils.js";

	interface Props extends ComponentProps<SingleSelectTreeProps<TValue>> {
		children: Snippet<[SingleSelectTree<TValue>]>;
	}

	const { onExpandedChange, onSelectedChange, children, ...props }: Props = $props();

	const tree = new SingleSelectTree({
		onExpandedChange,
		onSelectedChange,
		...builderProps(props),
	});
</script>

{@render children(tree)}
