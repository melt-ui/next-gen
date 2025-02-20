<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { TagsInput, getters } from "melt/builders";
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
			class="text-accent-700 focus-within:ring-accent-400 flex min-w-[280px] max-w-[400px] flex-col flex-wrap gap-2.5 rounded-md bg-white px-3
		  py-2 focus-within:ring"
		>
			<input
				{...tagsInput.input}
				type="text"
				placeholder="Enter tags..."
				class="min-w-[4.5rem] shrink grow basis-0 border-0 bg-white text-black outline-none focus:!ring-0 focus-visible:!outline-0 data-[invalid]:text-red-500"
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
								class="enabled:hover:bg-accent-300 flex h-full items-center px-1"
							>
								<Close />
							</button>
						</div>

						<!-- <input
							{...tagItem.edit}
							class="flex items-center overflow-hidden rounded-md px-1.5 [word-break:break-word] focus-visible:!outline-0 data-[invalid-edit]:focus:!ring-red-500"
						/> -->

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
