import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { disabledAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";

const { dataAttrs, dataSelectors, createIds } = createBuilderMetadata('tags-input', ['root', 'input', 'tag', 'delete-trigger', 'edit']);

export type Tag = {
	id: string;
	value: string;
};

type TagProps = {
	id: string;
	value: string;
	disabled?: boolean;
	editable?: boolean;
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
};

export class TagsInput {
	// Props
	#props!: TagsInputProps;
	readonly disabled = $derived(extract(this.#props.disabled, false));
	readonly placeholder = $derived(extract(this.#props.placeholder, ''));

	// State
	#tags!: Synced<Tag[]>;
	#inputValue = $state('');
	#editValue = $state('');
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
	 * Spread attributes for the root element.
	 */
	get root() {
		return {
			[dataAttrs.root]: "",
			'data-disabled': disabledAttr(this.disabled),
			disabled: disabledAttr(this.disabled),
			onmousedown: (e: MouseEvent) => {
				// TODO
			}
		} as const;
	}

	/**
	 * Spread attributes for the input element.
	 */
	get input() {
		return {
			[dataAttrs.input]: "",
			"data-disabled": disabledAttr(this.disabled),
			disabled: disabledAttr(this.disabled),
			placeholder: this.placeholder,
			onblur: () => {
				// TODO
				this.#selected = null;
			},
			onpaste: (e: ClipboardEvent) => {
				// TODO
			},
			onkeydown: (e: KeyboardEvent) => {
				// TODO
			}
		} as const;
	}
}