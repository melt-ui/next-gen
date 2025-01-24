import { extract } from "$lib/utils/extract";
import { createDataIds } from "$lib/utils/identifiers";
import { styleAttr } from "$lib/utils/attribute";
import { inBrowser } from "$lib/utils/browser";
import type { MaybeGetter } from "$lib/types";
import { watch } from "runed";

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

	constructor(props: AvatarProps = {}) {
		$effect(() => {
			this.#props.onLoadingStatusChange?.(this.#loadingStatus);
		});

		watch(
			() => this.src,
			() => {
				this.#loadingStatus = "loading";
			},
		);

		this.#props = props;
	}

	get loadingStatus() {
		return this.#loadingStatus;
	}

	get image() {
		return {
			[identifiers.image]: "",
			src: this.src,
			style: styleAttr({ display: this.#loadingStatus === "loaded" ? "block" : "none" }),
			onload: () => {
				if (!inBrowser()) return;
				const timerId = window.setTimeout(() => {
					this.#loadingStatus = "loaded";
				}, this.delayMs);
				return () => window.clearTimeout(timerId);
			},
			onerror: () => {
				this.#loadingStatus = "error";
			},
		} as const;
	}

	get fallback() {
		return {
			[identifiers.fallback]: "",
			style: this.#loadingStatus === "loaded" ? styleAttr({ display: "none" }) : undefined,
			hidden: this.#loadingStatus === "loaded" ? true : undefined,
		} as const;
	}
}
