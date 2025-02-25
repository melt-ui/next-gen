<script lang="ts">
	import { fade, fly, scale } from "svelte/transition";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { Toaster, getters } from "melt/builders";
	import { Progress } from "melt/components";
	import Close from "~icons/material-symbols/close-rounded";
	import { onMount } from "svelte";

	const controls = usePreviewControls({
		hover: {
			type: "select",
			label: "Hover",
			options: ["pause", "pause-all"],
			defaultValue: "pause-all",
		},
		closeDelay: {
			type: "number",
			min: 0,
			max: 10000,
			defaultValue: 0,
			label: "Close Delay",
		},
	});

	type ToastData = {
		title: string;
		description: string;
		variant: "success" | "warning" | "error";
	};

	const toastData: ToastData[] = [
		{
			title: "Success",
			description: "Congratulations! It worked!",
			variant: "success",
		},
		{
			title: "Warning",
			description: "Please check again.",
			variant: "warning",
		},
		{
			title: "Error",
			description: "Something did not work!",
			variant: "error",
		},
	];

	const toaster = new Toaster<ToastData>({
		...getters(controls),
	});

	function addRandomToast() {
		toaster.addToast({
			data: toastData[Math.floor(Math.random() * toastData.length)],
			// closeDelay: 0,
		});
	}

	onMount(() => {
		[...new Array(2)].forEach(addRandomToast);
	});
</script>

<Preview class="text-center">
	<button
		class="mx-auto block rounded-xl bg-gray-100 px-4 py-2 font-semibold text-gray-800
				transition-all hover:cursor-pointer hover:bg-gray-200
				active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50
				dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-500/50 dark:active:bg-gray-600/50"
		on:click={addRandomToast}
	>
		Show Toast
	</button>

	<div {...toaster.root} class="fixed !bottom-0 !right-4 flex w-[300px] flex-col bg-red-500/0">
		{#each toaster.toasts as toast, i (toast.id)}
			<div
				class="w-full pb-2"
				{...toast.content}
				in:fly={{ y: 60, opacity: 0.9 }}
				out:fly={{ y: 20 }}
			>
				<div class="relative rounded-xl bg-gray-500 px-4 py-4 transition">
					<div class="flex flex-col text-left">
						<h3 {...toast.title} class="whitespace-nowrap text-sm font-medium">
							{toast.data.title}
						</h3>

						{#if toast.data.description}
							<div {...toast.description} class="text-sm text-gray-700 dark:text-gray-300">
								{toast.data.description}
							</div>
						{/if}
					</div>

					<button
						{...toast.close}
						aria-label="dismiss toast"
						class="absolute right-1 top-1 bg-transparent text-gray-300 hover:text-gray-100"
					>
						<Close class="h-3.5 w-3.5" />
					</button>

					{#if toast.closeDelay !== 0}
						<div class="absolute bottom-0 left-0 right-0">
							<Progress value={toast.percentage}>
								{#snippet children(progress)}
									<div
										{...progress.root}
										class="relative h-[2px] w-full overflow-hidden bg-transparent"
									>
										<div
											{...progress.progress}
											class="h-full w-full translate-x-[var(--progress)]"
											class:bg-green-500={toast.data.variant === "success"}
											class:bg-orange-500={toast.data.variant === "warning"}
											class:bg-red-500={toast.data.variant === "error"}
										></div>
									</div>
								{/snippet}
							</Progress>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</Preview>

<style>
	:global([popover]) {
		inset: unset;
	}

	[data-melt-toaster-root] {
		height: 100%;
		pointer-events: none;
		overflow: hidden;
	}

	[data-melt-toaster-toast-content] {
		position: absolute;
		pointer-events: auto;
		bottom: 0;
		left: 0;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);

		transform-origin: 50% 0%;
		transition: all 350ms ease;
	}

	[data-melt-toaster-toast-content]:nth-last-child(n + 4) {
		z-index: 1;
		scale: 0.925;
		opacity: 0;
		translate: 0 -2.25rem;
	}

	[data-melt-toaster-toast-content]:nth-last-child(-n + 3) {
		z-index: 2;
		scale: 0.95;
		translate: 0 -1.5rem;
	}

	[data-melt-toaster-toast-content]:nth-last-child(-n + 2) {
		z-index: 3;
		scale: 0.975;
		translate: 0 -0.75rem;
	}

	[data-melt-toaster-toast-content]:nth-last-child(-n + 1) {
		z-index: 4;
		scale: 1;
		translate: 0;
	}

	[data-melt-toaster-root]:hover [data-melt-toaster-toast-content]:nth-last-child(-n + 3) {
		scale: 1;
		translate: 0 calc(-200% - 0.5rem);
	}

	[data-melt-toaster-root]:hover [data-melt-toaster-toast-content]:nth-last-child(-n + 2) {
		scale: 1;
		translate: 0 calc(-100% - 0.25rem);
	}

	[data-melt-toaster-root]:hover [data-melt-toaster-toast-content]:nth-last-child(-n + 1) {
		translate: 0 0;
	}
</style>
