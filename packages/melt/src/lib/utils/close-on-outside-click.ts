import type { MaybeGetter } from "$lib/types";

export type CloseOnOutsideClickCheck = (el: Element | Window | Document) => boolean;
export type CloseOnOutsideClickProp = MaybeGetter<boolean | CloseOnOutsideClickCheck | undefined>;
