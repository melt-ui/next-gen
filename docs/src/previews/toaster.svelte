<script lang="ts">
	import { flip } from "svelte/animate";
	import { fly } from "svelte/transition";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { Toaster, getters } from "melt/builders";
	import Close from "~icons/material-symbols/close-rounded";

	const controls = usePreviewControls({
		hover: {
			type: "select",
			label: "Hover",
			options: ["pause", "pause-all"],
			defaultValue: "pause",
		},
	});

	type ToastData = {
		title: string;
		description: string;
		color: string;
	};

	const toastData: ToastData[] = [
		{
			title: "Success",
			description: "Congratulations! It worked!",
			color: "bg-green-500",
		},
		{
			title: "Warning",
			description: "Please check again.",
			color: "bg-orange-500",
		},
		{
			title: "Error",
			description: "Something did not work!",
			color: "bg-red-500",
		},
	];

	const toaster = new Toaster<ToastData>({
		closeDelay: 3000,
		...getters(controls),
	});

	function addRandomToast() {
		console.log("add random toast");
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
</Preview>

<div {...toaster.root}>
	<div class="fixed right-0 top-0 m-4 flex flex-col items-end gap-1 md:bottom-0 md:top-auto">
		{#each toaster.toasts as toast (toast.id)}
			{@const toastBuilder = toaster.getToastFromToaster(toast)}
			<div
				{...toastBuilder.content}
				animate:flip={{ duration: 500 }}
				in:fly={{ duration: 150, x: "100%" }}
				out:fly={{ duration: 150, x: "100%" }}
				class="rounded-lg bg-gray-800 text-white shadow-md"
			>
				<div class="relative w-[24rem] max-w-[calc(100vw-2rem)] gap-4 p-5">
					<div>
						<h3 {...toastBuilder.title} class="flex items-center gap-2 !text-base font-semibold">
							{toastBuilder.data.title}
							<span class="size-1.5 rounded-full {toastBuilder.data.color}"></span>
						</h3>
						<div {...toastBuilder.description} class="!m-0 text-base">
							{toastBuilder.data.description}
						</div>
					</div>
					<button
						{...toastBuilder.close}
						class="text-accent-300 absolute right-4 top-4 !m-0 grid size-10 cursor-pointer place-items-center rounded-full bg-gray-800 hover:bg-gray-500/50"
					>
						<Close />
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>
