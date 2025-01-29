<script lang="ts">
	import { Dropzone } from "../builders/Dropzone.svelte";
	import { getters } from "$lib/builders";

	let { 
		children,
		selected,
		onSelectedChange,
		multiple = false,
		accept,
		maxSize 
	} = $props<{
		children: (dropzone: Dropzone<typeof multiple extends true ? true : false>) => void;
		selected?: typeof multiple extends true ? Set<File> : File | undefined;
		onSelectedChange?: (files: typeof multiple extends true ? Set<File> : File | undefined) => void;
		multiple?: boolean;
		accept?: string;
		maxSize?: number;
	}>();
	
	type Multiple = typeof multiple extends true ? true : false;
	let dropzone = $state(new Dropzone<Multiple>({
		selected,
		onSelectedChange,
		...getters({ 
			multiple: multiple as Multiple,
			accept, 
			maxSize 
		}),
	}));

	$effect(() => {
		dropzone = new Dropzone<Multiple>({
			selected,
			onSelectedChange,
			...getters({ 
				multiple: multiple as Multiple,
				accept, 
				maxSize 
			}),
		});
	});
</script>

<input {...dropzone.input} />
{@render children(dropzone)}
