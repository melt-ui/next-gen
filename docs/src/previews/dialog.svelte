<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { Dialog } from "melt/builders";

	const controls = usePreviewControls({
		scrollLock: {
			type: "boolean",
			defaultValue: true,
			label: "Scroll Lock",
		},
		closeOnEscape: {
			type: "boolean",
			defaultValue: true,
			label: "Close on Escape",
		},
		closeOnOutsideClick: {
			type: "boolean",
			defaultValue: true,
			label: "Close on Outside Click",
		},
	});

	const dialog = new Dialog({
		forceVisible: true,
		scrollLock: () => controls.scrollLock,
		closeOnEscape: () => controls.closeOnEscape,
		closeOnOutsideClick: () => controls.closeOnOutsideClick,
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

	<dialog
		class="abs-center w-[260px] overflow-visible rounded-2xl bg-white p-4 shadow-xl dark:bg-gray-800"
		{...dialog.content}
	>
		<p class="text-center font-semibold">Can I tell you a secret?</p>
	</dialog>
</Preview>
