<script lang="ts">
	import { fly } from "svelte/transition";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { Toaster, getters } from "melt/builders";
	import { Progress } from "melt/components";
	import Close from "~icons/material-symbols/close-rounded";

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
			defaultValue: 3000,
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
		});
	}
</script>

<Preview class="text-center">
	<button
		class="mx-auto block rounded-xl bg-gray-100 px-4 py-2 font-semibold text-gray-800
				transition-all hover:cursor-pointer hover:bg-gray-200
				active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50
				dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-500/50 dark:active:bg-gray-600/50"
		onclick={addRandomToast}
	>
		Show Toast
	</button>

	<div
		{...toaster.root}
		class="fixed !bottom-4 !right-4 flex w-[300px] flex-col"
		style:--toasts={toaster.toasts.length}
	>
		{#each toaster.toasts as toast, i (toast.id)}
			<div
				class="relative flex h-[--toast-height] w-full flex-col justify-center rounded-xl bg-gray-800 px-4 text-left transition"
				{...toast.content}
				style:--n={toaster.toasts.length - i}
				in:fly={{ y: 60, opacity: 0.9 }}
				out:fly={{ y: 20 }}
			>
				<h3 {...toast.title} class="whitespace-nowrap text-sm font-medium">
					{toast.data.title}
				</h3>

				{#if toast.data.description}
					<div {...toast.description} class="text-xs text-gray-700 dark:text-gray-300">
						{toast.data.description}
						{toast.pauseDuration}
					</div>
				{/if}

				<button
					{...toast.close}
					aria-label="dismiss toast"
					class="absolute right-1 top-1 bg-transparent text-gray-300 hover:text-gray-100"
				>
					<Close class="h-3.5 w-3.5" />
				</button>

				{#if toast.closeDelay !== 0}
					<div class="absolute bottom-4 right-4 h-[4px] w-[30px] overflow-hidden rounded-full">
						<Progress value={toast.percentage}>
							{#snippet children(progress)}
								<div {...progress.root} class="relative h-full w-full overflow-hidden bg-gray-950">
									<div
										{...progress.progress}
										class="h-full w-full -translate-x-[var(--progress)]"
										class:bg-green-400={toast.data.variant === "success"}
										class:bg-orange-400={toast.data.variant === "warning"}
										class:bg-red-500={toast.data.variant === "error"}
									></div>
								</div>
							{/snippet}
						</Progress>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</Preview>

<style>
	:global([popover]) {
		inset: unset;
	}

	[data-melt-toaster-root] {
		--gap: 0.75rem;
		--hover-offset: 1rem;
		--toast-height: 4rem;
		--hidden-offset: 0.75rem;

		--hidden-toasts: calc(var(--toasts) - 1);

		overflow: visible;
		display: grid;
		grid-template-rows: var(--toast-height) repeat(var(--hidden-toasts), var(--hidden-offset));
		grid-template-columns: 1fr;
		gap: 0;
		background: unset;
		padding: 0;
	}

	[data-melt-toaster-root]:hover {
		grid-template-rows: var(--hidden-offset) var(--toast-height) repeat(
				var(--hidden-toasts),
				calc(var(--toast-height) + var(--gap))
			);
	}

	[data-melt-toaster-toast-content] {
		position: absolute;
		pointer-events: auto;
		bottom: 0;
		left: 0;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.25);

		transform-origin: 50% 0%;
		transition: all 350ms ease;
	}

	[data-melt-toaster-toast-content]:nth-last-child(n + 4) {
		z-index: 1;
		scale: 0.925;
		opacity: 0;
		translate: 0 calc(-3 * var(--hidden-offset));
	}

	[data-melt-toaster-toast-content]:nth-last-child(-n + 3) {
		z-index: 2;
		scale: 0.95;
		translate: 0 calc(-2 * var(--hidden-offset));
	}

	[data-melt-toaster-toast-content]:nth-last-child(-n + 2) {
		z-index: 3;
		scale: 0.975;
		translate: 0 calc(-1 * var(--hidden-offset));
	}

	[data-melt-toaster-toast-content]:nth-last-child(-n + 1) {
		z-index: 4;
		scale: 1;
		translate: 0;
	}

	[data-melt-toaster-root]:hover [data-melt-toaster-toast-content] {
		scale: 1;
		opacity: 1;
		--toast-gap: calc(calc(var(--gap) * var(--n)) + var(--hover-offset));
		--percentage: calc(-100% * calc(var(--n) - 1));
		translate: 0 calc(var(--percentage) - var(--toast-gap));
	}
</style>
