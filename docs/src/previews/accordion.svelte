<script lang="ts">
	import { slide } from "svelte/transition";
	import Preview, { usePreviewControls } from "@components/preview.svelte";
	import { Accordion, getters, type AccordionItem } from "melt/builders";

	const controls = usePreviewControls({
		multiple: {
			type: "boolean",
			defaultValue: false,
			label: "Multiple",
		},
		disabled: {
			type: "boolean",
			defaultValue: false,
			label: "Disabled",
		},
	});

	type Item = AccordionItem<{
		title: string;
		description: string;
	}>;

	const items: Item[] = [
		{
			id: "item-1",
			title: "What is it?",
			description:
				"A collection of accessible & unstyled component builders for Svelte applications.",
		},
		{
			id: "item-2",
			title: "Can I customize it?",
			description: "Totally, it is 100% stylable and overridable.",
		},
		{
			id: "item-3",
			title: "Svelte is awesome, huh?",
			description: "Yes, and so are you!",
		},
	];

	const accordion = new Accordion({
		items: () => items,
		...getters(controls),
	});
</script>

<Preview>
	<div {...accordion.root} class="mx-auto w-[18rem] max-w-full rounded-xl shadow-lg sm:w-[25rem]">
		{#each accordion.items as item}
			<div class="overflow-hidden first:rounded-t-xl last:rounded-b-xl">
				<h2 class="flex" {...item.heading}>
					<button
						{...item.trigger}
						class="focus-visible:text-accent-500 flex flex-1 cursor-pointer items-center justify-between bg-gray-200 px-5 py-5 text-base font-medium leading-none text-gray-800 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
					>
						{item.item.title}
					</button>
				</h2>

				{#if item.isExpanded()}
					<div
						{...item.content}
						class="content overflow-hidden bg-white text-sm text-gray-800"
						transition:slide
					>
						<div class="px-5 py-4">
							{item.item.description}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</Preview>
