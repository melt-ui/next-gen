import type { MaybeGetter, MaybeMultiple } from "$lib/types";
import { dataAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { areFilesEqual } from "$lib/utils/file";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { SelectionState } from "$lib/utils/selection-state.svelte";
import { watch } from "runed";

const { dataAttrs, createIds } = createBuilderMetadata("fileupload", ["dropzone", "input"]);

export type FileUploadError = {
	type: "size" | "type" | "validation" | "custom";
	file: File;
	message: string;
};

export type FileUploadProps<Multiple extends boolean = false> = {
	/**
	 * The currently selected files.
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
	 * The accepted file types. Can be a MIME type, a MIME group, or a file extension.
	 * Separate multiple types with a comma.
	 * @example 'image/jpeg'
	 * @example 'image/*'
	 * @example '.png, .jpg, .jpeg'
	 */
	accept?: MaybeGetter<string | undefined>;

	/**
	 * Maximum file size in bytes
	 * @default undefined
	 */
	maxSize?: MaybeGetter<number | undefined>;

	/**
	 * Whether the file upload is disabled
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Custom validate fn. Will be called together with the original validation,
	 * which takes into account the `accept` and `maxSize` props.
	 */
	validate?: (file: File) => boolean;

	/**
	 * Callback fired when a file fails validation
	 */
	onError?: (error: FileUploadError) => void;

	/**
	 * Callback fired when a file is accepted
	 */
	onAccept?: (file: File) => void;

	/**
	 * If true, checks the files contents to avoid duplicate.
	 * It's performance is not tested in large files, so by default its set to false.
	 *
	 * @default false
	 */
	avoidDuplicates?: MaybeGetter<boolean | undefined>;
};

export class FileUpload<Multiple extends boolean = false> {
	#props!: FileUploadProps<Multiple>;
	readonly multiple = $derived(extract(this.#props.multiple, false as Multiple)) as Multiple;
	readonly accept = $derived(extract(this.#props.accept, undefined));
	readonly maxSize = $derived(extract(this.#props.maxSize, undefined));
	readonly disabled = $derived(extract(this.#props.disabled, false));
	readonly avoidDuplicates = $derived(extract(this.#props.avoidDuplicates, false));

	/* State */
	#isDragging = $state(false);
	ids = $state(createIds());

	#selected: SelectionState<File, Multiple>;

	constructor(props: FileUploadProps<Multiple> = {}) {
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

	async has(file: File) {
		const files = this.#selected.toArray();
		const promises = files.map((f) => areFilesEqual(f, file));
		const results = await Promise.all(promises);
		return results.some(Boolean);
	}

	#handleFiles = async (files: FileList | null) => {
		if (!files) return;

		const fileArray = Array.from(files);
		const validFiles: File[] = [];

		for (const file of fileArray) {
			if (this.avoidDuplicates && (await this.has(file))) continue;

			// Check file type if accept is specified
			if (this.accept) {
				const acceptTypes = this.accept.split(",").map((t) => t.trim());
				const isValidType = acceptTypes.some((type) => {
					if (type.startsWith(".")) {
						// Extension check
						return file.name.toLowerCase().endsWith(type.toLowerCase());
					} else if (type.endsWith("/*")) {
						// Mime type group check
						const group = type.split("/")[0];
						return file.type.startsWith(`${group}/`);
					} else {
						// Exact mime type check
						return file.type === type;
					}
				});

				if (!isValidType) {
					this.#props.onError?.({
						type: "type",
						file,
						message: `File type ${file.type} is not accepted`,
					});
					continue;
				}
			}

			// Check file size if maxSize is specified
			if (this.maxSize && file.size > this.maxSize) {
				this.#props.onError?.({
					type: "size",
					file,
					message: `File size ${file.size} exceeds maximum size of ${this.maxSize}`,
				});
				continue;
			}

			// Run custom validation if provided
			if (this.#props.validate && !this.#props.validate(file)) {
				this.#props.onError?.({
					type: "validation",
					file,
					message: `File failed custom validation`,
				});
				continue;
			}

			// File passed all validations
			validFiles.push(file);
			this.#props.onAccept?.(file);
		}

		if (!validFiles.length) return;

		if (this.multiple) {
			this.#selected.addAll(validFiles);
		} else {
			const firstFile = validFiles[0];
			if (firstFile) this.#selected.add(firstFile);
		}
	};

	/** The dropzone element, where you can drag files into, or click to open the file picker. */
	get dropzone() {
		return {
			[dataAttrs.dropzone]: "",
			"data-dragging": dataAttr(this.#isDragging),
			"data-disabled": dataAttr(this.disabled),
			ondragenter: (e: DragEvent) => {
				if (this.disabled) return;
				e.preventDefault();
				if (!this.#isDragging) {
					this.#isDragging = true;
				}
			},
			ondragleave: (e: DragEvent) => {
				if (this.disabled) return;
				e.preventDefault();
				// Check if we're actually leaving the dropzone
				const relatedTarget = e.relatedTarget as Node | null;
				const dropzone = e.currentTarget as Node;

				// Only set dragging to false if we're actually leaving the dropzone
				// and not just moving between its children
				if (!relatedTarget || !dropzone.contains(relatedTarget)) {
					this.#isDragging = false;
				}
			},
			ondragover: (e: DragEvent) => {
				if (this.disabled) return;
				e.preventDefault();
			},
			ondrop: (e: DragEvent) => {
				if (this.disabled) return;
				e.preventDefault();
				this.#isDragging = false;
				if (e.dataTransfer?.files) {
					this.#handleFiles(e.dataTransfer.files);
				}
			},
			onclick: () => {
				if (this.disabled) return;
				const input = document.getElementById(this.ids.input) as HTMLInputElement;
				if (input) {
					input.click();
				}
			},
		} as const;
	}

	/** The hidden file input element. */
	get input() {
		watch(
			() => $state.snapshot(this.#selected.toArray()),
			() => {
				const input = document.getElementById(this.ids.input) as HTMLInputElement;
				if (!input) return;

				const set = this.#selected.toSet();
				const dt = new DataTransfer();
				for (const file of set) {
					dt.items.add(file);
				}

				input.files = dt.files;
			},
		);

		return {
			[dataAttrs.input]: "",
			id: this.ids.input,
			type: "file",
			accept: this.accept,
			multiple: this.multiple,
			style: "display: none;",
			disabled: this.disabled,
			onchange: (e: Event) => {
				if (this.disabled) return;
				const input = e.target as HTMLInputElement;
				const files = input.files;
				input.files = null;
				this.#handleFiles(files);
			},
		} as const;
	}

	/** An optional trigger element, which can be used to open the file picker. */
	get trigger() {
		return {
			"data-disabled": dataAttr(this.disabled),
			onclick: () => {
				if (this.disabled) return;
				const input = document.getElementById(this.ids.input) as HTMLInputElement;
				if (input) {
					input.click();
				}
			},
		} as const;
	}
}
