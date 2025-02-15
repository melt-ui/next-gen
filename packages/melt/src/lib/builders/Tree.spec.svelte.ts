import { expectTypeOf, it } from "vitest";
import { Tree, type TreeItem } from "./Tree.svelte";
import { SvelteSet } from "svelte/reactivity";
import { testWithEffect } from "$lib/utils/test.svelte";

const items: TreeItem[] = [];

testWithEffect("Should have valid types for single and multiple", () => {
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

testWithEffect("Should auto infer item type when passing static array", () => {
	const arrTree = new Tree({
		items: [
			{
				id: "1",
				color: "red",
				children: [
					{ id: "2", color: "blue" },
					{ id: "3", color: "green", children: [{ id: "4" }] },
					{ id: "3", children: [{ id: "4" }] },
				],
			},
		],
	});

	const firstItem = arrTree.items[0];
	const subItem = firstItem?.children[0];
	expectTypeOf(subItem).toMatchTypeOf<{ id: string; color?: string } | undefined>;
});

testWithEffect("Should auto infer item type when passing getter to array", () => {
	const items = $state([
		{
			id: "1",
			color: "red",
			children: [
				{ id: "2", color: "blue" },
				{ id: "3", color: "green", children: [{ id: "4" }] },
				{ id: "3", children: [{ id: "4" }] },
			],
		},
	]);
	const arrTree = new Tree({
		items: () => items,
	});

	const firstItem = arrTree.items[0];
	const subItem = firstItem?.children[0];
	expectTypeOf(subItem).toMatchTypeOf<{ id: string; color?: string } | undefined>;
});

testWithEffect("Should auto infer item type when passing SvelteSet", () => {
	const items = new SvelteSet([
		{
			id: "1",
			color: "red",
			children: [
				{ id: "2", color: "blue" },
				{ id: "3", color: "green", children: [{ id: "4" }] },
				{ id: "3", children: [{ id: "4" }] },
			],
		},
	]);
	const arrTree = new Tree({
		items: () => items,
	});

	const firstItem = arrTree.items[0];
	const subItem = firstItem?.children[0];
	expectTypeOf(subItem).toMatchTypeOf<{ id: string; color?: string } | undefined>;
});
