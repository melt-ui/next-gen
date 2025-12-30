<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { Dialog } from "melt/builders";

	// import { usePreviewControls } from "@components/preview-ctx.svelte";
	// const controls = usePreviewControls();

	const dialog = new Dialog({
		forceVisible: true,
	});
</script>

<Preview>
	<button
		class="mx-auto block rounded-xl bg-gray-100 px-4 py-2 font-semibold text-gray-800
				transition-all hover:cursor-pointer hover:bg-gray-200
				active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50
				dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-500/50 dark:active:bg-gray-600/50"
		{...dialog.trigger}
	>
		psst...
	</button>

	<dialog class="fixed h-full w-full bg-transparent" {...dialog.content}>
		<div
			class="abs-center w-[260px] overflow-visible rounded-2xl bg-white p-4 shadow-xl dark:bg-gray-800"
		>
			<p class="text-center font-semibold">Can I tell you a secret?</p>
		</div>
	</dialog>
</Preview>

<style>
	[data-melt-dialog-content] > div {
		position: absolute;
		pointer-events: none;
		opacity: 0;

		transform: scale(0.9);

		transition: 0.3s;
		transition-property: opacity, transform;
	}

	[data-melt-dialog-content][data-open] > div {
		pointer-events: auto;
		opacity: 1;

		transform: scale(1);
	}
</style>

