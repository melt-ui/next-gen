import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { SelectionState, type MaybeMultiple } from "$lib/utils/selection-state.svelte";
import { watch } from "runed";

const { dataAttrs, createIds } = createBuilderMetadata("dropzone", ["root", "input"]);

export type DropzoneProps<Multiple extends boolean = false> = {
	/**
	 * The currently selected files
	 */
	selected?: MaybeMultiple<File, Multiple>;

	/**
	 * Callback fired when selected files change
	 */
	onSelectedChange?: (files: Multiple extends true ? Set<File> : File | undefined) => void;

	/**
	 * Whether to accept multiple files
	 * @default false
	 */
	multiple?: MaybeGetter<Multiple | undefined>;

	/**
	 * The accepted file types
	 * @example "image/*" or ".pdf,.doc"
	 */
	accept?: MaybeGetter<string | undefined>;

	/**
	 * Maximum file size in bytes
	 * @default undefined
	 */
	maxSize?: MaybeGetter<number | undefined>;

	/**
	 * Custom validate fn. Will be called together with the original validation,
	 * which takes into account the `accept` and `maxSize` props.
	 */
	validate?: (file: File) => boolean;
};

export class Dropzone<Multiple extends boolean = false> {
	#props!: DropzoneProps<Multiple>;
	readonly multiple = $derived(extract(this.#props.multiple, false as Multiple)) as Multiple;
	readonly accept = $derived(extract(this.#props.accept, undefined));
	readonly maxSize = $derived(extract(this.#props.maxSize, undefined));

	/* State */
	#isDragging = $state(false);
	#isFileDialogOpen = $state(false);
	#ids = createIds();

	#selected: SelectionState<File, Multiple>;

	constructor(props: DropzoneProps<Multiple> = {}) {
		this.#props = props;
		this.#selected = new SelectionState<File, Multiple>({
			value: props.selected,
			onChange: props.onSelectedChange,
			multiple: props.multiple,
		});
	}

	get isDragging() {
		return this.#isDragging;
	}

	get isFileDialogOpen() {
		return this.#isFileDialogOpen;
	}

	/**
	 * Gets the currently selected files
	 */
	get selected() {
		return this.#selected.current;
	}

	/**
	 * Sets the currently selected files
	 */
	set selected(value) {
		this.#selected.current = value;
	}

	/**
	 * Clears the currently selected files
	 */
	clear() {
		this.#selected.clear();
	}

	/**
	 * Removes a file from the selection
	 */
	remove(file: File) {
		this.#selected.delete(file);
	}

	#handleFiles = (files: FileList | null) => {
		if (!files) return;

		const fileArray = Array.from(files);
		const validFiles = this.maxSize
			? fileArray.filter((file) => {
					const isValid = file.size <= this.maxSize!;
					const customIsValid = this.#props.validate ? this.#props.validate(file) : true;
					return isValid && customIsValid;
				})
			: fileArray;

		if (!validFiles.length) return;

		if (this.multiple) {
			this.#selected.addAll(validFiles);
		} else {
			this.#selected.add(validFiles[0]);
		}
	};

	/** The root element. */
	get root() {
		return {
			[dataAttrs.root]: "",
			"data-dragging": dataAttr(this.#isDragging),
			ondragenter: (e: DragEvent) => {
				e.preventDefault();
				e.stopPropagation();
				this.#isDragging = true;
			},
			ondragleave: (e: DragEvent) => {
				e.preventDefault();
				e.stopPropagation();
				this.#isDragging = false;
			},
			ondragover: (e: DragEvent) => {
				e.preventDefault();
				e.stopPropagation();
			},
			ondrop: (e: DragEvent) => {
				e.preventDefault();
				e.stopPropagation();
				this.#isDragging = false;
				if (e.dataTransfer?.files) {
					this.#handleFiles(e.dataTransfer.files);
				}
			},
			onclick: () => {
				if (this.#isFileDialogOpen) return;

				const input = document.querySelector(`[${dataAttrs.input}]`) as HTMLInputElement;
				if (input) {
					this.#isFileDialogOpen = true;
					input.click();
				}
			},
		} as const;
	}

	/** The hidden file input element. */
	get input() {
		watch(
			() => this.#selected,
			(s) => {
				const input = document.getElementById(this.#ids.input) as HTMLInputElement;
				if (!input) return;

				const set = s.toSet();
				const dt = new DataTransfer();
				for (const file of set) {
					dt.items.add(file);
				}

				input.files = dt.files;
			},
		);

		return {
			[dataAttrs.input]: "",
			id: this.#ids.input,
			type: "file",
			accept: this.accept,
			multiple: this.multiple,
			style: "display: none;",
			onchange: (e: Event) => {
				const input = e.target as HTMLInputElement;
				this.#handleFiles(input.files);
			},
			onblur: () => {
				this.#isFileDialogOpen = false;
			},
		} as const;
	}
}
