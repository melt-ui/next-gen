<script lang="ts" generics="Multiple extends boolean">
	import { getters } from "$lib/utils/getters.svelte.js";
	import { type Snippet } from "svelte";
	import { FileUpload, type FileUploadProps } from "../builders/FileUpload.svelte";
	import type { ComponentProps } from "../types";

	type Props = ComponentProps<FileUploadProps<Multiple>> & {
		children: Snippet<[FileUpload<Multiple>]>;
	};

	let { selected = $bindable(), children, validate, multiple, ...rest }: Props = $props();

	const fileUpload = new FileUpload<Multiple>({
		...getters(rest),
		selected: () => selected as any,
		onSelectedChange(v) {
			selected = v as any;
		},
		multiple: () => multiple as Multiple,
	});
</script>

{@render children(fileUpload)}
