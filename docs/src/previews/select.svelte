<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { getters, Select } from "melt/builders";
	import AlphabetJapanese from "~icons/hugeicons/alphabet-japanese";
	import Check from "~icons/lucide/check";
	import ChevronDown from "~icons/lucide/chevron-down";

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

	const options = [
		"Solo Leveling",
		"Bleach",
		"Dan da Dan",
		"Re: Zero",
		"Jujutsu Kaisen",
		"Attack on Titan",
		"Death Note",
	] as const;
	type Option = (typeof options)[number];

	const select = new Select<Option, boolean>({
		forceVisible: true,
		...getters(controls),
	});
</script>

<Preview>
	<div class="mx-auto flex w-[300px] flex-col gap-1">
		<label for={select.ids.trigger}>Anime</label>
		<button
			{...select.trigger}
			class="flex items-center justify-between overflow-hidden rounded-xl border border-gray-500 bg-gray-100 py-2 pl-3 pr-4 text-left text-gray-800
				transition hover:cursor-pointer hover:bg-gray-200
				active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50
				dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-500/50 dark:active:bg-gray-600/50"
		>
			<div class="inline-flex items-center gap-2 overflow-hidden">
				<AlphabetJapanese class="shrink-0" />
				<span class="truncate">{select.valueAsString || "Select an anime"}</span>
			</div>
			<ChevronDown class="shrink-0" />
		</button>

		<div
			{...select.content}
			class="flex flex-col rounded-xl border border-gray-500 bg-gray-100 p-2 shadow dark:bg-gray-800"
		>
			{#each options as option}
				<div
					{...select.getOption(option)}
					class={[
						"relative flex items-center justify-between rounded-xl py-2 pl-8 pr-2",
						select.highlighted === option && "bg-gray-700",
						select.value === option && "font-semibold",
					]}
				>
					<span>{option}</span>
					{#if select.isSelected(option)}
						<Check class="text-accent-300 font-bold" />
					{/if}
				</div>
			{/each}
		</div>
	</div>
</Preview>

<style>
	[data-melt-select-content] {
		position: absolute;
		pointer-events: none;
		opacity: 0;

		transform: scale(0.975);

		transition: 0.2s;
		transition-property: opacity, transform;
		transform-origin: var(--melt-popover-content-transform-origin, center);
	}

	[data-melt-select-content][data-open] {
		pointer-events: auto;
		opacity: 1;

		transform: scale(1);
	}
</style>
