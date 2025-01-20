import { expectTypeOf, it } from "vitest";
import { Tree, type TreeItem } from "./Tree.svelte";
import type { SvelteSet } from "svelte/reactivity";

const items: TreeItem[] = [];

it("Should have valid types", () => {
	const undefTree = new Tree({ items });
	expectTypeOf(undefTree.selected).toMatchTypeOf<string | undefined>();
	expectTypeOf(undefTree.expanded).toMatchTypeOf<SvelteSet<string>>();

	const defSingle = new Tree({ items, selected: "test" });
	expectTypeOf(defSingle.selected).toMatchTypeOf<string | undefined>();
	expectTypeOf(defSingle.expanded).toMatchTypeOf<SvelteSet<string>>();

	const dynamicSingle = new Tree({ items: [], selected: () => undefined });
	expectTypeOf(dynamicSingle.selected).toMatchTypeOf<string | undefined>();
	expectTypeOf(dynamicSingle.expanded).toMatchTypeOf<SvelteSet<string>>();

	const defMult = new Tree({ items, selected: ["test"], multiple: true });
	expectTypeOf(defMult.selected).toMatchTypeOf<SvelteSet<string>>();
	expectTypeOf(defMult.expanded).toMatchTypeOf<SvelteSet<string>>();

	const undefMult = new Tree({ items, multiple: true });
	expectTypeOf(undefMult.selected).toMatchTypeOf<SvelteSet<string>>();
	expectTypeOf(undefMult.expanded).toMatchTypeOf<SvelteSet<string>>();

	const dynamicMult = new Tree({ items: [], selected: () => ["hi"], multiple: true });
	expectTypeOf(dynamicMult.selected).toMatchTypeOf<SvelteSet<string>>();
	expectTypeOf(dynamicMult.expanded).toMatchTypeOf<SvelteSet<string>>();
});
