<script lang="ts">
	import { Dropzone, type DropzoneProps } from "../builders/Dropzone.svelte";
	import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";
	import { getters } from "$lib/builders";

	type Props = ComponentProps<DropzoneProps> & {
		children: Snippet<[Dropzone]>;
	};

	let { children, onFilesSelected, multiple = true, accept, maxSize }: Props = $props();

	const dropzone = new Dropzone({
		onFilesSelected,
		...getters({ multiple, accept, maxSize }),
	});
</script>

<input {...dropzone.input} />
{@render children(dropzone)}
