<script lang="ts">
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { Tree, getters, type TreeItem } from "melt/builders";
	import JavaScript from "~icons/devicon/javascript";
	import Svelte from "~icons/devicon/svelte";
	import FolderOpen from "~icons/ph/folder-open-fill";
	import Folder from "~icons/ph/folder-fill";
	import Motion from "@components/motion.svelte";

	const controls = usePreviewControls({
		multiple: {
			type: "boolean",
			defaultValue: true,
			label: "Multiple",
		},
		expandOnClick: {
			type: "boolean",
			defaultValue: true,
			label: "Expand on click",
		},
	});

	type Item = TreeItem<{
		title: string;
		icon: "folder" | "svelte" | "js";
	}>;

	const data: Item[] = [
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

	const tree = new Tree({
		items: data,
		expanded: ["lib", "routes"],
		...getters(controls),
	});
</script>

{#snippet treeItemIcon(item: typeof tree['children'][number])}
	{@const icon = item.item.icon}

	{#if icon === "folder"}
		<svelte:component this={item.expanded ? FolderOpen : Folder} role="presentation" />
	{:else if icon === "svelte"}
		<Svelte role="presentation" />
	{:else if icon === "js"}
		<JavaScript role="presentation" />
	{/if}
{/snippet}

{#snippet treeItems(items: typeof tree['children'], depth: number = 0)}
	{#each items as item (item.id)}
		<li
			{...item.attrs}
			class="cursor-pointer rounded-sm outline-none first:mt-0 [&:focus-visible>:first-child>div]:ring-4"
		>
			<div class="group py-1" style="padding-left: {depth * 1}rem">
				<div
					class="{item.selected ? '!bg-accent-500 !text-white dark:!bg-accent-200 dark:!text-accent-950' : ''}
					ring-accent-500 dark:ring-accent-700 flex h-full w-full items-center gap-2 rounded-xl
					px-3 py-1 ring-offset-white dark:ring-offset-black transition 
					group-hover:bg-gray-200 dark:group-hover:bg-gray-800"
				>
					{@render treeItemIcon(item)}
					<span class="select-none">
						{item.item.title}
					</span>
				</div>
			</div>
			{#if item.children?.length}
				<Motion
					tag="ul"
					animate={{
						height: item.expanded ? "auto" : 0,
						opacity: item.expanded ? 1 : 0,
						scale: item.expanded ? 1 : 0.85,
					}}
					transition={{
						height: { delay: item.expanded ? 0 : 0.1 },
						opacity: { ease: "easeOut", delay: item.expanded ? 0.1 : 0, duration: 0.2 },
						type: "spring",
						stiffness: 200,
						damping: 20,
						mass: 0.15,
						bounce: 1,
					}}
					{...tree.group}
					class="relative list-none p-0 {!item.expanded ? 'pointer-events-none' : ''} origin-left"
				>
					<div
						class="absolute bottom-2 top-2 w-px bg-gray-200 dark:bg-gray-700"
						style="left: {0.5 + depth * 1}rem"
					></div>
					{@render treeItems(item.children, depth + 1)}
				</Motion>
			{/if}
		</li>
	{/each}
{/snippet}

<Preview class="!py-6">
	<ul class="mx-auto w-[300px] list-none rounded-md p-4" {...tree.root}>
		{@render treeItems(tree.children, 0)}
	</ul>
</Preview>
