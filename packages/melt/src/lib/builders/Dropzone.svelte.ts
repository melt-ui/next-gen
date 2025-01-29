import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr, disabledAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";

const { dataAttrs, dataSelectors, createIds } = createBuilderMetadata("dropzone", ["root"]);

export type DropzoneProps = {
  /**
   * The value for the Dropzone.
   *
   * When passing a getter, it will be used as source of truth,
   * meaning that the value only changes when the getter returns a new value.
   *
   * Otherwise, if passing a static value, it'll serve as the default value.
   *
   *
   * @default false
   */
  value?: MaybeGetter<boolean>;
  /**
   * Called when the value is supposed to change.
   */
  onValueChange?: (value: boolean) => void;
};

export class Dropzone {
  /* Props */
  #props!: DropzoneProps;

  /* State */
  #value!: Synced<boolean>;

  constructor(props: DropzoneProps = {}) {
    this.#props = props;
    this.#value = new Synced({
      value: props.value,
      onChange: props.onValueChange,
      defaultValue: false,
    });
  }

  /** The root element. */
  get root() {
    return {
      [dataAttrs.root]: "",
    } as const;
  }
}