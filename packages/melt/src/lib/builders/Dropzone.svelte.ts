import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";

const { dataAttrs } = createBuilderMetadata("dropzone", ["root", "input"]);

export type DropzoneProps = {
	/**
	 * Function called when files are dropped or selected
	 */
	onFilesSelected?: (files: File[]) => void;

	/**
	 * Whether to accept multiple files
	 * @default true
	 */
	multiple?: MaybeGetter<boolean | undefined>;

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
};

export class Dropzone {
	/* Props */
	#props!: DropzoneProps;
	readonly multiple = $derived(extract(this.#props.multiple, true));
	readonly accept = $derived(extract(this.#props.accept, undefined));
	readonly maxSize = $derived(extract(this.#props.maxSize, undefined));

	/* State */
	#isDragging = $state(false);
	#isFileDialogOpen = $state(false);

	constructor(props: DropzoneProps = {}) {
		this.#props = props;
	}

	get isDragging() {
		return this.#isDragging;
	}

	get isFileDialogOpen() {
		return this.#isFileDialogOpen;
	}

	#handleFiles = (files: FileList | null) => {
		if (!files) return;

		const fileArray = Array.from(files);
		if (this.maxSize) {
			const validFiles = fileArray.filter((file) => file.size <= this.maxSize!);
			if (validFiles.length !== fileArray.length) {
				console.warn("Some files exceeded the maximum size limit");
			}
			this.#props.onFilesSelected?.(validFiles);
		} else {
			this.#props.onFilesSelected?.(fileArray);
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
		return {
			[dataAttrs.input]: "",
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
