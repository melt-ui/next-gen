<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import { Dropzone, getters } from "melt/builders";
	import { fade } from "svelte/transition";
	import UploadIcon from "~icons/tabler/cloud-upload";

	type Controls = {
		multiple: boolean;
		accept: string;
		maxSize: number;
	};

	const controls = usePreviewControls({
		multiple: {
			type: "boolean",
			label: "Multiple files",
			defaultValue: true,
		},
		accept: {
			type: "string",
			label: "Accept",
			defaultValue: "image/*",
		},
		maxSize: {
			type: "number",
			label: "Max size (bytes)",
			defaultValue: 5 * 1024 * 1024, // 5MB
		},
	}) as Controls;

	let files: File[] = $state([]);

	const dropzone = new Dropzone({
		...getters(controls),
		onFilesSelected: (selectedFiles) => {
			files = selectedFiles;
		},
	});

	const fileList = $derived(
		files.map((file) => ({
			name: file.name,
			size: formatFileSize(file.size),
			type: file.type,
		})),
	);

	function formatFileSize(bytes: number) {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}
</script>

<Preview>
	<div class="flex flex-col items-center gap-4">
		<input {...dropzone.input} />
		<div
			{...dropzone.root}
			class="relative flex min-h-[200px] w-[300px] cursor-pointer
			flex-col items-center justify-center gap-4
			rounded-lg border-2 border-dashed border-gray-300 bg-gray-50
			p-6 text-center transition-colors
			hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
			class:!border-accent-500={dropzone.isDragging}
		>
			{#if dropzone.isDragging}
				<div
					class="bg-accent-500/10 pointer-events-none flex items-center justify-center rounded-lg"
				>
					<p class="text-accent-500 text-lg font-medium">Drop files here</p>
				</div>
			{:else}
				<div class="pointer-events-none flex flex-col items-center gap-2">
					<UploadIcon class="text-4xl" />

					<p class="text-sm text-gray-500 dark:text-gray-400">
						<span class="font-semibold text-gray-900 dark:text-white">Click to upload</span>
						or drag and drop
					</p>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						{controls.accept} (up to {formatFileSize(controls.maxSize)})
					</p>
				</div>
			{/if}
		</div>

		{#if fileList.length > 0}
			<div
				class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
			>
				<h3 class="mb-2 text-lg font-semibold">Selected Files</h3>
				<ul class="divide-y divide-gray-200 dark:divide-gray-700">
					{#each fileList as file}
						<li class="py-3">
							<div class="flex items-center justify-between">
								<div>
									<p class="font-medium text-gray-900 dark:text-white">{file.name}</p>
									<p class="text-sm text-gray-500 dark:text-gray-400">{file.type}</p>
								</div>
								<span class="text-sm text-gray-500 dark:text-gray-400">{file.size}</span>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</Preview>
