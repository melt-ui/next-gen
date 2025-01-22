<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { Collapsible } from "melt/components";
	import { slide } from "svelte/transition";
	import ChevronUpDown from "~icons/heroicons/chevron-up-down-solid";
	import Close from "~icons/material-symbols/close-rounded";

	const controls = usePreviewControls({
		disabled: {
			label: "Disabled",
			type: "boolean",
			defaultValue: false,
		},
	});
</script>

<Preview>
	<Collapsible {...controls} open>
		{#snippet children(collapsible)}
			<div {...collapsible.root} class="mx-auto w-[18rem] max-w-full sm:w-[25rem]">
				<button
					{...collapsible.trigger}
					class="relative z-10 mx-auto flex w-full items-center justify-between rounded-xl bg-gray-200
				px-4 py-2 text-gray-800 transition-all hover:cursor-pointer hover:bg-gray-300
				active:bg-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50
				dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-500/50 dark:active:bg-gray-600/50"
					class:shadow-md={collapsible.open}
					aria-label="Toggle"
				>
					<span> @thomasglopes starred 3 repositories </span>
					{#if collapsible.open}
						<Close />
					{:else}
						<ChevronUpDown />
					{/if}
				</button>

				{#if collapsible.open}
					<div
						{...collapsible.content}
						class="mx-auto flex w-[calc(100%-32px)] flex-col gap-2 rounded-b-xl bg-white p-4 dark:bg-gray-900 dark:text-white/80"
						transition:slide
					>
						<span>melt-ui/melt-ui</span>
						<hr class="border-b border-gray-700" />
						<span>sveltejs/svelte</span>
						<hr class="border-b border-gray-700" />
						<span>sveltejs/kit</span>
					</div>
				{/if}
			</div>
		{/snippet}
	</Collapsible>
</Preview>
