<script lang="ts">
	import { flip } from "svelte/animate";
	import { fly } from "svelte/transition";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { Progress, Toaster, getters } from "melt/builders";
	import Close from "~icons/material-symbols/close-rounded";

	const controls = usePreviewControls({
		hover: {
			type: "select",
			label: "Hover",
			options: ["pause", "pause-all"],
			defaultValue: "pause",
		},
		closeDelay: {
			type: "number",
			min: 0,
			max: 10000,
			defaultValue: 5000,
			label: "Close Delay",
		},
	});

	type ToastData = {
		title: string;
		description: string;
		color: string;
		shadow: string;
	};

	const toastData: ToastData[] = [
		{
			title: "Success",
			description: "Congratulations! It worked!",
			color: "bg-green-500",
			shadow: "shadow-green-500/50",
		},
		{
			title: "Warning",
			description: "Please check again.",
			color: "bg-orange-500",
			shadow: "shadow-orange-500/50",
		},
		{
			title: "Error",
			description: "Something did not work!",
			color: "bg-red-500",
			shadow: "shadow-red-500/50",
		},
	];

	const toaster = new Toaster<ToastData>({
		...getters(controls),
	});

	function addRandomToast() {
		toaster.addToast({
			data: toastData[Math.floor(Math.random() * toastData.length)],
		});
	}
</script>

<Preview class="text-center">
	<button
		class="mx-auto block rounded-xl bg-gray-100 px-4 py-2 text-gray-800
				transition-all hover:cursor-pointer hover:bg-gray-200
				active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50
				dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-500/50 dark:active:bg-gray-600/50"
		on:click={addRandomToast}
	>
		Show toast
	</button>

	<div {...toaster.root}>
		<div
			class="fixed right-0 top-0 m-4 flex flex-col items-end gap-4 text-left md:bottom-0 md:top-auto"
		>
			{#each toaster.toasts as toast (toast.id)}
				{@const progress = new Progress({ value: () => toast.percentage })}

				<div
					{...toast.content}
					animate:flip={{ duration: 500 }}
					in:fly={{ duration: 150, x: "100%" }}
					out:fly={{ duration: 150, x: "100%" }}
					class="{toast.data.shadow} rounded-lg bg-white shadow-md dark:bg-gray-800"
				>
					<div class="relative w-[24rem] max-w-[calc(100vw-2rem)] gap-4 p-5">
						<div>
							<h3 {...toast.title} class="flex items-center gap-2 !text-base font-semibold">
								{toast.data.title}
								<span class="size-1.5 rounded-full {toast.data.color}"></span>
							</h3>

							<div {...toast.description} class="!m-0 text-base">
								{toast.data.description}
							</div>
						</div>

						<button
							{...toast.close}
							aria-label="dismiss alert"
							class="text-accent-500 dark:text-accent-300 absolute right-4 top-4 !m-0 grid size-10 cursor-pointer place-items-center rounded-full hover:bg-gray-300/50 dark:bg-gray-800 dark:hover:bg-gray-500/50"
						>
							<Close />
						</button>

						{#if toast.closeDelay !== 0}
							<div class="absolute bottom-1 right-auto">
								<div
									{...progress.root}
									class="relative h-1.5 w-[20rem] overflow-hidden rounded-full bg-white"
								>
									<div
										{...progress.progress}
										class="h-full w-full translate-x-[var(--progress)] rounded-r-full bg-neutral-700"
									></div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</Preview>
