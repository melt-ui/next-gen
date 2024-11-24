<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { AltTree, SingleSelectTree, type TreeItem, type TreeItemData } from "melt/builders";
	import JavaScript from "~icons/devicon/javascript";
	import Svelte from "~icons/devicon/svelte";
	import FolderOpen from "~icons/material-symbols/folder-open";
	import Folder from "~icons/material-symbols/folder-outline";

	type TreeItemValue = {
		title: string;
		icon: "folder" | "svelte" | "js";
	};

	const data: TreeItemData<TreeItemValue>[] = [
		{
			id: "index.svelte",
			value: {
				title: "index.svelte",
				icon: "svelte",
			},
		},
		{
			id: "lib",
			value: {
				title: "lib",
				icon: "folder",
			},
			children: [
				{
					id: "lib/tree",
					value: {
						title: "tree",
						icon: "folder",
					},
					children: [
						{
							id: "lib/tree/Tree.svelte",
							value: {
								title: "Tree.svelte",
								icon: "svelte",
							},
						},
						{
							id: "lib/tree/TreeItem.svelte",
							value: {
								title: "TreeItem.svelte",
								icon: "svelte",
							},
						},
					],
				},
				{
					id: "lib/icons",
					value: {
						title: "icons",
						icon: "folder",
					},
					children: [
						{
							id: "lib/icons/JavaScript.svelte",
							value: {
								title: "JavaScript.svelte",
								icon: "svelte",
							},
						},
						{
							id: "lib/icons/Svelte.svelte",
							value: {
								title: "Svelte.svelte",
								icon: "svelte",
							},
						},
					],
				},
				{
					id: "lib/index.js",
					value: {
						title: "index.js",
						icon: "js",
					},
				},
			],
		},
		{
			id: "routes",
			value: {
				title: "routes",
				icon: "folder",
			},
			children: [
				{
					id: "routes/contents",
					value: {
						title: "contents",
						icon: "folder",
					},
					children: [
						{
							id: "routes/contents/+layout.svelte",
							value: {
								title: "+layout.svelte",
								icon: "svelte",
							},
						},
						{
							id: "routes/contents/+page.svelte",
							value: {
								title: "+page.svelte",
								icon: "svelte",
							},
						},
					],
				},
			],
		},
	];

	const tree = new AltTree({
		items: data,
		multiple: false,
	});
</script>

{#snippet treeItemIcon(item: TreeItem<TreeItemValue>)}
	{@const icon = item.value.icon}
	{#if icon === "folder"}
		{#if item.expanded}
			<FolderOpen role="presentation" onclick={() => item.collapse()} />
		{:else}
			<Folder role="presentation" onclick={() => item.expand()} />
		{/if}
	{:else if icon === "svelte"}
		<Svelte role="presentation" />
	{:else if icon === "js"}
		<JavaScript role="presentation" />
	{/if}
{/snippet}

{#snippet treeItems(items: ReadonlyArray<TreeItem<TreeItemValue>>)}
	{#each items as item (item.id)}
		<li {...item.attributes} class="mt-2 rounded-sm first:mt-0 focus-visible:outline-offset-2">
			<div
				data-selected={item.selected ? "" : undefined}
				class="data-[selected]:bg-accent-200 data-[selected]:text-accent-950 group flex items-center gap-2 rounded-[inherit] px-2 py-1"
			>
				{@render treeItemIcon(item)}
				<span class="select-none group-data-[selected]:font-semibold">
					{item.value.title}
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
		{@render treeItems(tree.items)}
	</ul>
</Preview>
