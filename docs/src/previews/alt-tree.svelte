<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { AltTree, type AltTreeItem } from "melt/builders";
	import JavaScript from "~icons/devicon/javascript";
	import Svelte from "~icons/devicon/svelte";
	import FolderOpen from "~icons/material-symbols/folder-open";
	import Folder from "~icons/material-symbols/folder-outline";

	type TreeItem = AltTreeItem<{
		title: string;
		icon: "folder" | "svelte" | "js";
	}>;

	const data: TreeItem[] = [
		{
			id: "index.svelte",
			title: "index.svelte",
			icon: "svelte",
		},
		{
			id: "lib",
			title: "lib",
			icon: "folder",
			children: [
				{
					id: "lib/tree",
					title: "tree",
					icon: "folder",
					children: [
						{
							id: "lib/tree/Tree.svelte",
							title: "Tree.svelte",
							icon: "svelte",
						},
						{
							id: "lib/tree/TreeItem.svelte",
							title: "TreeItem.svelte",
							icon: "svelte",
						},
					],
				},
				{
					id: "lib/icons",
					title: "icons",
					icon: "folder",
					children: [
						{
							id: "lib/icons/JavaScript.svelte",
							title: "JavaScript.svelte",
							icon: "svelte",
						},
						{
							id: "lib/icons/Svelte.svelte",
							title: "Svelte.svelte",
							icon: "svelte",
						},
					],
				},
				{
					id: "lib/index.js",
					title: "index.js",
					icon: "js",
				},
			],
		},
		{
			id: "routes",
			title: "routes",
			icon: "folder",
			children: [
				{
					id: "routes/contents",
					title: "contents",
					icon: "folder",
					children: [
						{
							id: "routes/contents/+layout.svelte",
							title: "+layout.svelte",
							icon: "svelte",
						},
						{
							id: "routes/contents/+page.svelte",
							title: "+page.svelte",
							icon: "svelte",
						},
					],
				},
			],
		},
	];

	const tree = new AltTree({
		items: data,
	});
</script>

{#snippet treeItemIcon(item: typeof tree['children'][number])}
	{@const icon = item.icon}

	{#if icon === "folder"}
		<svelte:component
			this={item.expanded ? FolderOpen : Folder}
			role="presentation"
			onclick={() => item.toggleExpand()}
		/>
	{:else if icon === "svelte"}
		<Svelte role="presentation" />
	{:else if icon === "js"}
		<JavaScript role="presentation" />
	{/if}
{/snippet}

{#snippet treeItems(items: typeof tree['children'])}
	{#each items as item (item.id)}
		<li {...item.attrs} class="mt-2 rounded-sm first:mt-0 focus-visible:outline-offset-2">
			<div
				data-selected={item.selected ? "" : undefined}
				class="data-[selected]:bg-accent-200 data-[selected]:text-accent-950 group flex items-center gap-2 rounded-[inherit] px-2 py-1"
			>
				{@render treeItemIcon(item)}
				<span class="select-none group-data-[selected]:font-semibold">
					{item.title}
				</span>
			</div>
			{#if item.expanded && item.children.length !== 0}
				<ul role="group" class="ms-4 mt-2 list-none p-0">
					{@render treeItems(item.children)}
				</ul>
			{/if}
		</li>
	{/each}
{/snippet}

<Preview>
	<ul class="border-accent-200 h-80 list-none overflow-y-scroll rounded-md border p-4">
		{@render treeItems(tree.children)}
	</ul>
</Preview>
