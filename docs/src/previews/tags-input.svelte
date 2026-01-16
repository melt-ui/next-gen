<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { getters } from "melt";
	import { TagsInput } from "melt/builders";
	import Close from "~icons/material-symbols/close-rounded";

	const controls = usePreviewControls({
		disabled: {
			defaultValue: false,
			type: "boolean",
			label: "Disabled",
		},
		blur: {
			defaultValue: "nothing",
			type: "select",
			options: ["nothing", "add", "clear"],
			label: "Blur",
		},
		addOnPaste: {
			defaultValue: false,
			type: "boolean",
			label: "Add on Paste",
		},
	});

	const tagsInput = new TagsInput(getters(controls));
</script>

<Preview class="place-content-center">
	<div class="flex flex-col items-start justify-center gap-2">
		<div
			{...tagsInput.root}
			class="text-accent-700 focus-within:ring-accent-400 flex min-w-[280px] max-w-[400px] flex-col flex-wrap gap-2.5 rounded-md border border-gray-500
		  bg-gray-100 px-3 py-2 focus-within:ring dark:bg-gray-900 dark:text-gray-200"
		>
			<input
				{...tagsInput.input}
				type="text"
				placeholder="Enter tags..."
				class="w-full min-w-[4.5rem] shrink grow rounded-xl bg-transparent text-left focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50"
			/>

			{#if tagsInput.tags.length > 0}
				<div class="flex flex-wrap gap-1 overflow-auto">
					{#each tagsInput.tags as tag (tag.id)}
						{@const tagItem = tagsInput.getTagItem({ tag })}

						<div
							{...tagItem.tag}
							class="bg-accent-200 text-accent-900 data-[disabled]:bg-accent-300 data-[selected]:bg-accent-400 flex items-center overflow-hidden rounded-md [word-break:break-word] data-[disabled]:hover:cursor-default data-[disabled]:focus:!outline-none data-[disabled]:focus:!ring-0"
						>
							<span class="flex items-center border-r border-white/10 px-1.5">{tag.value}</span>
							<button
								{...tagItem.deleteTrigger}
								aria-label={`remove ${tag.value} tag`}
								class="flex h-full cursor-pointer items-center px-1 enabled:hover:opacity-90"
							>
								<Close />
							</button>
						</div>

						<span
							{...tagItem.edit}
							class="flex items-center overflow-hidden rounded-md px-1.5 [word-break:break-word] data-[invalid]:text-red-500 data-[invalid-edit]:focus:!ring-red-500"
						></span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</Preview>
