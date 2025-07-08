<script lang="ts" generics="Multiple extends boolean = false">
	import { type AccordionItemMeta, type AccordionProps } from "$lib/builders/Accordion.svelte";
	import Accordion from "$lib/components/Accordion.svelte";
	import type { ComponentProps } from "$lib/types";

	const localItems: AccordionItemMeta<{
		id: string;
		title: string;
		description: string;
		disabled?: boolean;
	}>[] = [
		{
			id: "test1",
			title: "Title 1",
			description: "Description 1",
		},
		{
			id: "test2",
			title: "Title 2",
			description: "Description 2",
		},
		{
			id: "test3",
			title: "Item 3",
			description: "Description 3",
		},
	];

	type Props = Omit<ComponentProps<AccordionProps<Multiple>>, "multiple"> & {
		multiple?: Multiple;
		items?: AccordionItemMeta<{
			id: string;
			title: string;
			description: string;
			disabled?: boolean;
		}>[];
	};

	let { items = $bindable(localItems), ...rest }: Props = $props();

	export { items };
</script>

<Accordion {...rest}>
	{#snippet children(accordion)}
		<div {...accordion.root}>
			{#each items as i, idx}
				{@const item = accordion.getItem(i)}
				{@const isFirst = idx === 0}
				{@const isLast = idx === items.length - 1}

				<div class="overflow-hidden first:rounded-t-xl last:rounded-b-xl">
					<h2 class="relative flex" {...item.heading}>
						<div
							class={[
								"border-accent-500 focus-ring absolute inset-0 z-10 border-4 transition-all",
								isFirst && "rounded-t-xl",
								isLast && !item.isExpanded && "rounded-b-xl",
							]}
							aria-hidden="true"
						></div>
						<button
							{...item.trigger}
							class={[
								"flex flex-1 cursor-pointer items-center justify-between bg-gray-200 px-5 py-5 text-base font-medium leading-none text-gray-800 outline-none transition-colors",
								!item.isDisabled &&
									"hover:bg-gray-300 dark:hover:bg-gray-500/50 dark:active:bg-gray-600/50",
								"disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50",
								"dark:bg-gray-800 dark:text-gray-200 ",
								!isLast && "border-b border-neutral-200 dark:border-neutral-700",
							]}
						>
							{item.item.title}
						</button>
					</h2>

					{#if item.isExpanded}
						<div
							{...item.content}
							class="content overflow-hidden bg-white p-4 text-sm dark:bg-gray-900 dark:text-white/80"
						>
							<div class="p-2">
								{item.item.description}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/snippet}
</Accordion>
