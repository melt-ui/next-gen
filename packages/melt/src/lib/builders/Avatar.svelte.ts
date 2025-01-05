import { extract } from "$lib/utils/extract";
import { Synced } from "$lib/Synced.svelte";
import { createDataIds } from "$lib/utils/identifiers";
import { styleAttr } from "$lib/utils/attribute";
import { inBrowser } from "$lib/utils/browser";
import { MaybeGetter } from "$lib/types";

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
	onLoadingStatusChange?: MaybeGetter<(value: ImageLoadingStatus) => void | undefined>;
};

export class Avatar {
	/* Props */
	#props!: AvatarProps;
	readonly src = $derived(extract(this.#props.src, ""));
	readonly delayMs = $derived(extract(this.#props.delayMs, 0));

	/* State */
	#loadingStatus!: Synced<ImageLoadingStatus>;

	constructor(props: AvatarProps = {}) {
		this.#loadingStatus = new Synced({
			value: "loading",
			onChange: props.onLoadingStatusChange,
			defaultValue: "loading",
		});
		this.#props = props;
	}

	get loadingStatus() {
		return this.#loadingStatus.current;
	}

	get image() {
		return {
			[identifiers.image]: "",
			src: this.src,
			style: styleAttr({ display: this.#loadingStatus.current === "loaded" ? "block" : "none" }),
			onload: () => {
				if (inBrowser()) {
					if (this.delayMs !== undefined) {
						const timerId = window.setTimeout(() => {
							this.#loadingStatus.current = "loaded";
						}, this.delayMs);
						return () => window.clearTimeout(timerId);
					} else {
						this.#loadingStatus.current = "loaded";
					}
				}
			},
			onerror: () => {
				this.#loadingStatus.current = "error";
			},
		} as const;
	}

	get fallback() {
		return {
			[identifiers.fallback]: "",
			style: styleAttr({ display: this.#loadingStatus.current === "loaded" ? "none" : undefined }),
			hidden: this.#loadingStatus.current === "loaded" ? true : undefined,
		} as const;
	}
}
