import { extract } from "$lib/utils/extract";
import { createBuilderMetadata, } from "$lib/utils/identifiers";
import { styleAttr } from "$lib/utils/attribute";
import { inBrowser } from "$lib/utils/browser";
import type { MaybeGetter } from "$lib/types";
import { watch } from "runed";

const { dataAttrs, createIds } = createBuilderMetadata("avatar", ["image", "fallback"]);

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
	#ids = createIds();
	/* Props */
	#props!: AvatarProps;
	readonly src = $derived(extract(this.#props.src, undefined));
	readonly delayMs = $derived(extract(this.#props.delayMs, 0));

	/* State */
	#loadingStatus: ImageLoadingStatus = $state("loading");

	constructor(props: AvatarProps = {}) {
		// Should be defined at the top before the effects
		// when using $effect.pre or $watch.pre
		this.#props = props;

		// Run effects before dom updates
		// for provide handlers with some execution time 
		watch.pre(
			() => this.#loadingStatus,
			() => {
				this.#props.onLoadingStatusChange?.(this.#loadingStatus);
			}
		);
		
		watch.pre(
			() => this.src,
			() => {
					this.#loadingStatus = "loading";
			},
			{
				lazy: true
			}
		);

	}

	get id() {
		return this.#ids.image;
	}

	get loadingStatus() {
		return this.#loadingStatus;
	}

	get image() {
		return {
			[dataAttrs.image]: "",
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
			[dataAttrs.fallback]: "",
			style: this.#loadingStatus === "loaded" ? styleAttr({ display: "none" }) : undefined,
			hidden: this.#loadingStatus === "loaded" ? true : undefined,
		} as const;
	}
}
