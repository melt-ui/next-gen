<script lang="ts" generics="Value">
	import { Tree, type TreeData, type TreeSelectionMode } from "$lib/builders/Tree.svelte.js";
	import type { Snippet } from "svelte";
	import type { SvelteSet } from "svelte/reactivity";

	type Props = {
		data: TreeData<Value>;
		children: Snippet<[Tree<Value>]>;
		selectionMode?: TreeSelectionMode;
		selected?: SvelteSet<string>;
		expanded?: SvelteSet<string>;
		defaultSelected?: Iterable<string>;
		defaultExpanded?: Iterable<string>;
	};

	const {
		data,
		children,
		selectionMode,
		selected,
		expanded,
		defaultSelected,
		defaultExpanded,
	}: Props = $props();

	const tree = new Tree({
		data: () => data,
		selectionMode: () => selectionMode,
		selected,
		expanded,
		defaultSelected,
		defaultExpanded,
	});
</script>

{@render children(tree)}
