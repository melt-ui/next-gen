import { extract } from "$lib/utils/extract";
import { createDataIds } from "$lib/utils/identifiers";
import { styleAttr } from "$lib/utils/attribute";
import { inBrowser } from "$lib/utils/browser";
import type { MaybeGetter } from "$lib/types";
import { watch } from "runed";
import { createAttachmentKey } from "svelte/attachments";
import type { HTMLImgAttributes } from "svelte/elements";

const identifiers = createDataIds("avatar", ["image", "fallback"]);

export type ImageLoadingStatus = "loading" | "loaded" | "error";

export type AvatarProps = {
	/**
	 * The source of the image to display.
	 */
	src?: MaybeGetter<string | undefined>;

	/**
	 * The amount of time in milliseconds to wait before displaying the image.
	 *
	 * @default 0
	 */
	delayMs?: MaybeGetter<number | undefined>;

	/**
	 * A callback invoked when the loading status store of the avatar changes.
	 */
	onLoadingStatusChange?: (value: ImageLoadingStatus) => void | undefined;
};

export class Avatar {
	/* Props */
	#props!: AvatarProps;
	readonly src = $derived(extract(this.#props.src, ""));
	readonly delayMs = $derived(extract(this.#props.delayMs, 0));

	/* State */
	#loadingStatus: ImageLoadingStatus = $state("loading");
	#ak = createAttachmentKey();

	#setLoadingStatus(s: ImageLoadingStatus) {
		this.#loadingStatus = s;
		this.#props.onLoadingStatusChange?.(s);
	}

	constructor(props: AvatarProps = {}) {
		this.#props = props;
	}

	get loadingStatus() {
		return this.#loadingStatus;
	}

	#attach = () => {
		watch(
			() => this.src,
			() => {
				this.#setLoadingStatus("loading");
			},
		);
	};

	get image() {
		return {
			[identifiers.image]: "",
			src: this.src,
			style: styleAttr({ display: this.#loadingStatus === "loaded" ? "block" : "none" }),
			onload: () => {
				if (!inBrowser()) return;
				const timerId = window.setTimeout(() => {
					this.#setLoadingStatus("loaded");
				}, this.delayMs);
				return () => window.clearTimeout(timerId);
			},
			onerror: () => {
				this.#setLoadingStatus("error");
			},
			[this.#ak]: this.#attach,
		} as const satisfies HTMLImgAttributes;
	}

	get fallback() {
		return {
			[identifiers.fallback]: "",
			style: this.#loadingStatus === "loaded" ? styleAttr({ display: "none" }) : undefined,
			hidden: this.#loadingStatus === "loaded" ? true : undefined,
		} as const;
	}
}
