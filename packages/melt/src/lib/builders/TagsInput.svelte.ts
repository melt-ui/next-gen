import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr, disabledAttr, styleAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { isHtmlElement } from "$lib/utils/is";
import { kbd } from "$lib/utils/keyboard";
import { nanoid } from "nanoid";
import { tick } from "svelte";
import type { ChangeEventHandler, ClipboardEventHandler, EventHandler, FormEventHandler, HTMLButtonAttributes, HTMLInputAttributes, KeyboardEventHandler } from "svelte/elements";

const { dataAttrs, dataSelectors, createIds } = createBuilderMetadata('tags-input', ['root', 'input', 'tag', 'delete-trigger', 'edit']);

export type Tag = {
	id: string;
	value: string;
};

type Blur = 'nothing' | 'add' | 'clear';

export type TagsInputProps = {
	/**
	 * The values for the tags.
	 *
	 * When passing a getter, it will be used as source of truth,
	 * meaning that the value only changes when the getter returns a new value.
	 *
	 * Otherwise, if passing a static value, it'll serve as the default values.
	 */
	tags?: MaybeGetter<Tag[] | undefined>;

	/**
	 * The placeholder text for the input element.
	 */
	placeholder?: MaybeGetter<string | undefined>;

	/**
	 * Whether or not the tags input is disabled.
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether or not the input is editable.
	 * @default true
	 */
	editable?: MaybeGetter<boolean | undefined>;

	/**
	 * The selected tag.
	 */
	selected?: MaybeGetter<Tag | undefined>;

	/**
	 * Whether or not the tags input should only allow unique tags.
	 * @default false
	 */
	unique?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether or not whitespace from both ends of input string should be removed when a tag is added.
	 * @default true
	 */
	trim?: MaybeGetter<boolean | undefined>;

	/**
	 * Define the action that should be taken when the input element loses focus (blurs).
	 * 'nothing' - Left over strings in the input are left as they are.
	 * 'add' - Left over strings get added as a tag.
	 * 'clear' - Left over strings get cleared, so the input is empty again.
	 * @default 'nothing'
	 */
	blur?: MaybeGetter<Blur | undefined>;

	/**
	 * Whether or not the input should add tags on paste.
	 * @default false
	 */
	addOnPaste?: MaybeGetter<boolean | undefined>;

	/**
	 * The maximum number of tags allowed.
	 */
	maxTags?: MaybeGetter<number | undefined>;

	/**
	 * The allowed tags.
	 */
	allowed?: MaybeGetter<string[] | undefined>;

	/**
	 * The disallowed tags.
	 */
	denied?: MaybeGetter<string[] | undefined>;

	/**
	 * A function that is called when the tags change.
	 */
	onTagsChange?: (value: Tag[]) => void;

	/**
	 * Optional validator/parser function that runs on tag addition.
	 *
	 * If an error is thrown, or the promise is rejected, the tag will not be added.
	 *
	 * Otherwise, return a Tag or a string for the tag to be added.
	 *
	 * @param tag The tag to be added
	 */
	add?: (tag: string) => (Tag | string | never) | Promise<Tag | string | never>;

	/**
	 * Optional validator/parser function that runs on tag removal.
	 *
	 * If an error is thrown, the promise is rejected, and that will not be removed.
	 * If `false` is returned, the tag will also not be removed.
	 *
	 * Otherwise, return `true` for the tag to be removed.
	 *
	 * @param tag The tag to be removed
	 */
	remove?: (tag: Tag) => (boolean | never) | Promise<boolean | never>;
};

export class TagsInput {
	// Props
	#props!: TagsInputProps;
	readonly disabled = $derived(extract(this.#props.disabled, false));
	readonly placeholder = $derived(extract(this.#props.placeholder, ''));
	readonly blur = $derived(extract(this.#props.blur, 'nothing'));
	readonly trim = $derived(extract(this.#props.trim, true));
	readonly unique = $derived(extract(this.#props.unique, false));
	readonly allowed = $derived(extract(this.#props.allowed, undefined));
	readonly denied = $derived(extract(this.#props.denied, undefined));
	readonly maxTags = $derived(extract(this.#props.maxTags, undefined));
	readonly editable = $derived(extract(this.#props.editable, true));
	
	#add = $derived(this.#props.add);
	#remove = $derived(this.#props.remove);

	// State
	#tags!: Synced<Tag[]>;
	#ids = createIds();
	#inputValue = $state('');
	#isInvalidInput = $state(false);
	// #editValue = $state('');
	#editing = $state<Tag | null>(null);
	#selected = $state<Tag | null>(null);

	constructor(props: TagsInputProps) {
		this.#props = props;

		this.#tags = new Synced({
			value: props.tags,
			onChange: props.onTagsChange,
			defaultValue: []
		});
	}

	/**
	 * Adds a tag. Returns `true` if the tag was added.
	 * 
	 * @param v The string value of the tag that should be added.
	 */
	async addTag(v: string) {
		let workingTag: Tag = { id: '', value: v };

		if (this.#add) {
			try {
				const res = await this.#add(v);

				if (typeof res === 'string') workingTag.value = res;
				else workingTag = res;

				if (!workingTag.id) workingTag.id = nanoid();
			} catch {
				return false;
			}
		} else {
			workingTag.id = nanoid();
		}

		// Trim the value
		if (this.trim) workingTag.value = workingTag.value.trim();

		// If it's not valid don't add it
		if (!this.isInputValid(workingTag.value)) return false;

		this.#tags.current.push(workingTag);

		return true;
	}

	/**
	 * Removes the given tag. Returns `true` if successful.
	 * 
	 * @param t The tag to remove.
	 */
	async removeTag(t: Tag) {
		if (this.#remove) {
			try {
				if (!(await this.#remove(t))) return false;
			} catch {
				return false;
			}
		}

		this.#tags.current = this.#tags.current.filter((tag) => tag.id !== t.id);

		return true;
	}

	/**
	 * Update a tag.
	 * 
	 * @param id - The ID of the tag to update.
	 * @param newValue - The new value for the tag.
	 */
	updateTag(id: string, newValue: string) {
		if (!this.isInputValid(newValue)) return;

		const idx = this.#tags.current.findIndex((t) => t.id === id);
		if (idx >= 0) {
			this.#tags.current[idx]!.value = newValue;
			this.#escapeEditTag(this.#tags.current[idx] as Tag);
		}
	}

	/**
	 * The selected tag.
	 */
	get selected() {
		return this.#selected;
	}

	/**
	 * The tag being edited.
	 */
	get editing() {
		return this.#editing;
	}

	/**
	 * Whether the entered input is valid or not.
	 */
	get isInvalidInput() {
		return this.#isInvalidInput;
	}

	get tags() {
		return this.#tags.current;
	}
	
	/**
	 * A function to create a TagItem class with the necessary
	 * tag item element spread attributes.
	 */
	getTagItem({ tag, disabled, editable }: GetTagItemProps) {
		return new TagItem({
			parent: this,
			tag,
			disabled,
			editable,
			editId: this.#tagEditId(tag.id),
			escapeEditTag: () => {
				this.#escapeEditTag(tag);
			}
		});
	}

	#getTagsInfo(id: string) {
		const rootEl = document.getElementById(this.#ids.root);

		let tagElements: Element[] = [];
		let selectedIndex = -1;
		let prevIndex = -1;
		let nextIndex = -1;

		if (rootEl) {
			tagElements = Array.from(rootEl.querySelectorAll(dataSelectors.tag));

			selectedIndex = tagElements.findIndex((element) => element.getAttribute('data-tag-id') === id);

			prevIndex = selectedIndex - 1;
			nextIndex = selectedIndex + 1;
		}

		return {
			tagElements,
			selectedIndex,
			prevIndex,
			nextIndex
		};
	}

	#setSelectedFromEl(el: Element | null | undefined) {
		if (!el) {
			this.#selected = null;
			return;
		}

		this.#selected = {
			id: el.getAttribute('data-tag-id') ?? '',
			value: el.getAttribute('data-tag-value') ?? ''
		};
	}

	#focusInput(pos: 'default' | 'start' | 'end' = 'default') {
		const inputEl = document.getElementById(this.#ids.input) as HTMLInputElement;
		
		if (!isHtmlElement(inputEl)) return;
	
		inputEl.focus();

		if (pos === 'start') {
			inputEl.setSelectionRange(0, 0);
		} else if (pos === 'end') {
			inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
		}
	}

	#tagEditId(id: string) {
		return `tag-edit-${id}`;
	}

	#escapeEditTag(t: Tag) {
		this.#editing = null;
		this.#focusInput();
		this.#selected = t;
	}

	/**
	 * The spread attributes for the root element.
	 */
	get root() {
		return {
			[dataAttrs.root]: "",
			id: this.#ids.root,
			"data-invalid": dataAttr(this.#isInvalidInput),
			'data-disabled': disabledAttr(this.disabled),
			disabled: disabledAttr(this.disabled),
			onmousedown: (e: MouseEvent) => {
				// TODO
			}
		} as const;
	}

	/**
	 * The spread attributes for the input element.
	 */
	get input() {
		const onchange: ChangeEventHandler<HTMLInputElement> = (e) => {
			// console.log(e);
			// this.#inputValue = e.currentTarget.value;
			// console.log('value:', this.#inputValue);
			// e.currentTarget.value = '';
		};

		const onkeydown: KeyboardEventHandler<HTMLInputElement> = async (e) => {
			const key = e.key;

			if (this.#selected) {
				// Check if a character is entered into the input
				if (key.length === 1) {
					this.#selected = null;
				} else if (key === kbd.ARROW_LEFT) {
					// Move to the previous tag
					e.preventDefault();

					const { tagElements, prevIndex } = this.#getTagsInfo(this.#selected.id);

					if (prevIndex >= 0) {
						this.#setSelectedFromEl(tagElements[prevIndex]);
					}
				} else if (key === kbd.ARROW_RIGHT) {
					// Move to the next tag
					e.preventDefault();

					const { tagElements, nextIndex } = this.#getTagsInfo(this.#selected.id);

					if (nextIndex === -1 || nextIndex >= tagElements.length) {
						this.#selected = null
						this.#focusInput('start');
					} else {
						this.#setSelectedFromEl(tagElements[nextIndex]);
					}
				} else if (key === kbd.HOME) {
					// Jump to the first tag or do nothing
					e.preventDefault();

					const { tagElements } = this.#getTagsInfo(this.#selected.id);
					
					if (tagElements.length > 0) this.#setSelectedFromEl(tagElements[0]);
				} else if (key === kbd.END) {
					// Jump to the input
					e.preventDefault();
					this.#selected = null;
					this.#focusInput();
				} else if (key === kbd.DELETE) {
					// Delete this tag and move to the next element of tag or input
					e.preventDefault();

					const prevSelected = this.#selected;
					const { tagElements, nextIndex } = this.#getTagsInfo(this.#selected.id);

					if (nextIndex === -1 || nextIndex >= tagElements.length) {
						this.#selected = null;
						this.#focusInput();
					} else {
						this.#setSelectedFromEl(tagElements[nextIndex]);
					}

					// Delete the previously selected tag
					if (!(await this.removeTag(prevSelected))) {
						this.#selected = prevSelected;
					}
				} else if (key === kbd.BACKSPACE) {
					// Delete this tag and move to the previous tag.
					// If this is the first tag, delete and move to the next
					// element of tag or input.
					e.preventDefault();

					const prevSelected = this.#selected;

					const { tagElements, prevIndex, nextIndex } = this.#getTagsInfo(this.#selected.id);

					if (prevIndex >= 0) {
						this.#setSelectedFromEl(tagElements[prevIndex]);
					} else {
						if (nextIndex === -1 || nextIndex >= tagElements.length) {
							this.#selected = null;
							this.#focusInput();
						} else {
							this.#setSelectedFromEl(tagElements[nextIndex]);
						}
					}

					// Delete the previously selected tag
					if (!(await this.removeTag(prevSelected))) {
						this.#selected = prevSelected;
					}
				} else if (key === kbd.ENTER) {
					// Start editing this selected tag
					e.preventDefault();

					console.log('in here');

					const editEl = document.getElementById(this.#tagEditId(this.#selected.id)) as HTMLInputElement;
					if (!editEl) return;

					this.#editing = this.#selected;
					editEl.value = this.#selected.value;

					await tick();
					editEl.focus();

					// TODO...
				}
			} else {
				if (key === kbd.ENTER) {
					e.preventDefault();
					
					if (!this.#inputValue) return;

					if (this.isInputValid(this.#inputValue) && (await this.addTag(this.#inputValue))) {
						const inputEl = document.getElementById(this.#ids.input) as HTMLInputElement;

						if (!isHtmlElement(inputEl)) return;

						this.#inputValue = '';
						inputEl.value = '';
					} else {
						this.#isInvalidInput = true;
					}
				} else if (
					e.currentTarget.selectionStart === 0 &&
					e.currentTarget.selectionEnd === 0 &&
					(key === kbd.ARROW_LEFT || key === kbd.BACKSPACE)
				) {
					e.preventDefault();
					const { tagElements } = this.#getTagsInfo('');
					const lastTag = tagElements.at(-1);

					if (!lastTag) return;

					this.#setSelectedFromEl(lastTag);
				}
			}
		};

		const oninput: FormEventHandler<HTMLInputElement> = (e) => {
			this.#inputValue = e.currentTarget.value;
			this.#isInvalidInput = false;
		};

		const onpaste: ClipboardEventHandler<HTMLInputElement> = (e) => {
			// TODO
		};

		const onblur: EventHandler<FocusEvent, HTMLInputElement> = async (e) => {
			this.#selected = null;

			if (!this.#inputValue) return;

			if (this.blur === 'clear') {
				e.currentTarget.value = '';
			} else if (this.blur === 'add') {
				if (this.isInputValid(this.#inputValue) && (await this.addTag(this.#inputValue))) {
					const inputEl = document.getElementById(this.#ids.input) as HTMLInputElement;

					if (!isHtmlElement(inputEl)) return;

					this.#inputValue = '';
					inputEl.value = '';
				} else {
					this.#isInvalidInput = true;
				}
			}
		};

		return {
			[dataAttrs.input]: "",
			"data-invalid": dataAttr(this.#isInvalidInput),
			id: this.#ids.input,
			"data-disabled": disabledAttr(this.disabled),
			disabled: disabledAttr(this.disabled),
			placeholder: this.placeholder,
			onblur,
			onpaste,
			onkeydown,
			onchange,
			oninput
		} as const satisfies HTMLInputAttributes;
	}

	// Run validation checks and if a validation fails return false immediately
	isInputValid(v: string) {
		if (this.trim) v = v.trim();

		// Tag uniqueness
		if (this.unique) {
			const index = this.tags.findIndex((t) => t.value === v);
			if (index >= 0) return false;
		}

		// Allowed list is populated and this value is not in it
		if (this.allowed && this.allowed.length > 0 && !this.allowed.includes(v)) return false;

		// Deny list is populated and this value is in it
		if (this.denied && this.denied.length > 0 && this.denied.includes(v)) return false;

		// If already enough tags were added return false
		if (this.maxTags && this.maxTags > 0 && this.tags.length >= this.maxTags) return false;

		return true;
	}
}

type GetTagItemProps = {
	tag: Tag;
	disabled?: boolean;
	editable?: boolean;
};

type TagItemProps = {
	parent: TagsInput;
	editId: string;
	escapeEditTag: () => void;
} & GetTagItemProps;

class TagItem {
	#props!: TagItemProps;
	#parent = $derived(this.#props.parent);
	readonly id = $derived(this.#props.tag.id);
	readonly value = $derived(this.#props.tag.value);
	readonly disabled = $derived(this.#parent.disabled || this.#props.disabled);
	/** Whether the tag item is editable. */
	readonly editable = $derived(this.#parent.editable && this.#props.editable !== false);
	/** Whether the tag item is selected. */
	readonly selected = $derived(!this.disabled && this.id === this.#parent.selected?.id);
	/** Whether the tag item is being edited. */
	readonly editing = $derived(this.editable && this.#parent.editing?.id === this.id);

	#editValue = $state('');
	#isInvalidInput = $state(false);

	constructor(props: TagItemProps) {
		this.#props = props;

		$effect(() => {
			$inspect(this.editing);
		})
	}

	/**
	 * The spread attributes for a tag item.
	 */
	get tag() {
		return {
			[dataAttrs.tag]: '',
			'data-selected': dataAttr(this.selected),
			'data-tag-id': this.id,
			'data-tag-value': this.value,
			disabled: dataAttr(this.disabled),
			tabindex: -1,
			hidden: this.editing ? '' : undefined,
			style: this.editing ? styleAttr({
				display: 'none'
			}) : undefined
		} as const;
	}

	/**
	 * The spread attributes for a tag item's delete button.
	 */
	get deleteTrigger() {
		return {
			[dataAttrs["delete-trigger"]]: '',
			'data-tag-id': this.id,
			'data-tag-value': this.value,
			'data-selected': dataAttr(this.selected),
			disabled: dataAttr(this.disabled),
			tabindex: -1,
			onclick: () => this.#parent.removeTag(this.#props.tag)
		} as const as HTMLButtonAttributes;
	}

	/**
	 * The spread attributes for a tag item's edit element.
	 */
	get edit() {
		const oninput: FormEventHandler<HTMLInputElement> = (e) => {
			this.#editValue = e.currentTarget.value;
			this.#isInvalidInput = false;
		};

		return {
			[dataAttrs.edit]: '',
			id: this.#props.editId,
			'aria-hidden': !this.editing,
			'data-tag-id': this.id,
			'data-tag-value': this.value,
			"data-invalid": dataAttr(this.#isInvalidInput),
			hidden: this.editing ? undefined : '',
			tabindex: -1,
			oninput,
			onkeydown: (e) => {
				const key = e.key;

				if (key === kbd.ENTER) {
					e.preventDefault();

					// Do nothing if the value is empty.
					if (!this.#editValue) return;

					if (!this.#parent.isInputValid(this.#editValue)) {
						this.#isInvalidInput = true;
						return;
					}

					this.#parent.updateTag(this.id, this.#editValue);
				} else if (key === kbd.ESCAPE) {
					e.preventDefault();
					// e.stopImmediatePropagation();

					this.#editValue = this.value;
					this.#props.escapeEditTag();
				}
			},
			style: this.editing ? styleAttr({

			}) : styleAttr({
				display: 'none'
			})
		} as const as HTMLInputAttributes;
	}
}