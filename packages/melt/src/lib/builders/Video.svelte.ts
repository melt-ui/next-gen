import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr, styleAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { useEventListener } from "runed";
import type { HTMLAttributes, HTMLInputAttributes, HTMLVideoAttributes } from "svelte/elements";

const { createIds, dataAttrs } = createBuilderMetadata("video-player", [
	"root",
	"video",
	"controls",
	"playButton",
	"muteButton",
	"volumeSlider",
	"progressBar",
	"timeDisplay",
	"fullscreenButton",
]);

export type VideoProps = {
	/**
	 * The source URL of the video.
	 */
	src?: MaybeGetter<string | undefined>;

	/**
	 * The poster image URL to display before the video loads.
	 */
	poster?: MaybeGetter<string | undefined>;

	/**
	 * The current time of the video in seconds.
	 *
	 * @default 0
	 */
	currentTime?: MaybeGetter<number | undefined>;

	/**
	 * The volume level of the video (0-1).
	 *
	 * @default 1
	 */
	volume?: MaybeGetter<number | undefined>;

	/**
	 * The playback rate of the video.
	 *
	 * @default 1
	 */
	playbackRate?: MaybeGetter<number | undefined>;

	/**
	 * Whether the video should be muted.
	 *
	 * @default false
	 */
	muted?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the video should loop.
	 *
	 * @default false
	 */
	loop?: MaybeGetter<boolean | undefined>;

	/**
	 * Whether the video should autoplay.
	 *
	 * @default false
	 */
	autoplay?: MaybeGetter<boolean | undefined>;

	/**
	 * How the video should be preloaded.
	 *
	 * @default "metadata"
	 */
	preload?: MaybeGetter<"none" | "metadata" | "auto" | undefined>;

	/**
	 * Whether to enable keyboard controls.
	 *
	 * @default true
	 */
	keyboardControls?: MaybeGetter<boolean | undefined>;

	/**
	 * Volume step for keyboard controls (up/down arrows).
	 *
	 * @default 0.05
	 */
	volumeStep?: MaybeGetter<number | undefined>;

	/**
	 * Seek step in seconds for keyboard controls (left/right arrows, j/l keys).
	 *
	 * @default 10
	 */
	seekStep?: MaybeGetter<number | undefined>;

	/**
	 * Callback fired when the playing state changes.
	 */
	onPlayingChange?: (playing: boolean) => void;

	/**
	 * Callback fired when the current time changes.
	 */
	onCurrentTimeChange?: (currentTime: number) => void;

	/**
	 * Callback fired when the volume changes.
	 */
	onVolumeChange?: (volume: number) => void;

	/**
	 * Callback fired when the muted state changes.
	 */
	onMutedChange?: (muted: boolean) => void;

	/**
	 * Callback fired when the playback rate changes.
	 */
	onPlaybackRateChange?: (playbackRate: number) => void;

	/**
	 * Callback fired when the video ends.
	 */
	onEnded?: () => void;

	/**
	 * Callback fired when the video is ready to play.
	 */
	onCanPlay?: () => void;

	/**
	 * Callback fired when video metadata is loaded.
	 */
	onLoadedMetadata?: () => void;

	/**
	 * Callback fired when an error occurs.
	 */
	onError?: (error: Event) => void;
};

/**
 * A headless video player component with complete state management,
 * keyboard controls, and Web Audio API integration for smooth volume control.
 */
export class Video {
	#props: VideoProps;
	readonly src: string;
	readonly poster: string;
	readonly loop: boolean;
	readonly autoplay: boolean;
	readonly preload: "none" | "metadata" | "auto";
	readonly playbackRate: number;
	readonly keyboardControls: boolean;
	readonly volumeStep: number;
	readonly seekStep: number;

	#currentTime: Synced<number>;
	#volume: Synced<number>;
	#muted = $state(false);
	#playing: Synced<boolean>;
	#duration = $state(0);
	#buffered = $state(0);
	#loading = $state(false);
	#error = $state<string | null>(null);
	#fullscreen = $state(false);
	#seeking = $state(false);
	#keyboardFeedback = $state<string | null>(null);
	#keyboardFeedbackTimeout: ReturnType<typeof setTimeout> | undefined;
	#clickTimeout: ReturnType<typeof setTimeout> | undefined;
	#audioContext: AudioContext | null = null;
	#gainNode: GainNode | null = null;
	#source: MediaElementAudioSourceNode | null = null;

	ids = createIds();

	constructor(props: VideoProps = {}) {
		this.#props = props;

		this.src = extract(props.src, "");
		this.poster = extract(props.poster, "");
		this.loop = extract(props.loop, false);
		this.autoplay = extract(props.autoplay, false);
		this.preload = extract(props.preload, "metadata");
		this.playbackRate = extract(props.playbackRate, 1);
		this.keyboardControls = extract(props.keyboardControls, true);
		this.volumeStep = extract(props.volumeStep, 0.05);
		this.seekStep = extract(props.seekStep, 10);

		this.#currentTime = new Synced({
			value: props.currentTime,
			onChange: props.onCurrentTimeChange,
			defaultValue: 0,
		});

		this.#volume = new Synced({
			value: props.volume,
			onChange: props.onVolumeChange,
			defaultValue: 1,
		});

		this.#muted = typeof props.muted === "function" ? props.muted() ?? false : props.muted ?? false;

		this.#playing = new Synced({
			value: undefined,
			onChange: props.onPlayingChange,
			defaultValue: false,
		});

		this.#initWebAudio();
	}
	/**
	 * The current playback time in seconds.
	 */
	get currentTime() {
		return this.#currentTime.current;
	}

	/**
	 * The current volume level (0-1).
	 */
	get volume() {
		return this.#volume.current;
	}

	/**
	 * Whether the video is currently muted.
	 */
	get muted() {
		return this.#muted;
	}

	/**
	 * Whether the video is currently playing.
	 */
	get playing() {
		return this.#playing.current;
	}

	/**
	 * The total duration of the video in seconds.
	 */
	get duration() {
		return this.#duration;
	}

	/**
	 * The amount of video buffered as a percentage (0-1).
	 */
	get buffered() {
		return this.#buffered;
	}

	/**
	 * Whether the video is currently loading.
	 */
	get loading() {
		return this.#loading;
	}

	/**
	 * The current error message, if any.
	 */
	get error() {
		return this.#error;
	}

	/**
	 * Whether the video is currently in fullscreen mode.
	 */
	get fullscreen() {
		return this.#fullscreen;
	}

	/**
	 * Whether the video is currently seeking.
	 */
	get seeking() {
		return this.#seeking;
	}

	/**
	 * The current keyboard feedback message being displayed.
	 */
	get keyboardFeedback() {
		return this.#keyboardFeedback;
	}

	get progress() {
		return this.#duration > 0 ? (this.currentTime / this.#duration) * 100 : 0;
	}

	get bufferedProgress() {
		return this.#duration > 0 ? (this.#buffered / this.#duration) * 100 : 0;
	}

	// Setters
	set currentTime(time: number) {
		this.#currentTime.current = Math.max(0, Math.min(time, this.#duration));
		this.#syncVideoElement();
	}

	set volume(volume: number) {
		// Round to avoid floating point precision issues
		const roundedVolume = Math.round(Math.max(0, Math.min(volume, 1)) * 100) / 100;
		this.#volume.current = roundedVolume;
		this.#setVolume(roundedVolume);
	}

	set muted(muted: boolean) {
		this.#muted = muted;
		this.#setMute(muted);
		this.#props.onMutedChange?.(muted);
	}

	/**
	 * Starts playing the video.
	 */
	play() {
		this.#playing.current = true;
		// Resume audio context if suspended
		if (this.#audioContext && this.#audioContext.state === "suspended") {
			this.#audioContext.resume();
		}
		this.#getVideoElement()?.play();
	}

	/**
	 * Pauses the video.
	 */
	pause() {
		this.#playing.current = false;
		this.#getVideoElement()?.pause();
	}

	/**
	 * Toggles between play and pause.
	 */
	togglePlay() {
		if (this.#playing.current) {
			this.pause();
		} else {
			this.play();
		}
	}

	/**
	 * Seeks to a specific time in seconds.
	 */
	seek(time: number) {
		this.currentTime = time;
	}

	/**
	 * Seeks forward or backward by the specified number of seconds.
	 */
	seekBy(seconds: number) {
		this.seek(this.currentTime + seconds);
	}

	/**
	 * Sets the volume level (0-1).
	 */
	setVolume(volume: number) {
		this.volume = volume;
	}

	/**
	 * Toggles the mute state.
	 * @param showFeedback - Whether to show keyboard feedback
	 */
	toggleMute(showFeedback = false) {
		this.muted = !this.muted;
		if (showFeedback) {
			this.#showKeyboardFeedback(this.#muted ? "Muted" : "Unmuted");
		}
	}

	/**
	 * Sets the playback rate (1.0 = normal speed).
	 */
	setPlaybackRate(rate: number) {
		const video = this.#getVideoElement();
		if (video) {
			video.playbackRate = rate;
			this.#props.onPlaybackRateChange?.(rate);
		}
	}

	/**
	 * Enters fullscreen mode.
	 */
	enterFullscreen() {
		const element = document.getElementById(this.ids.root);
		if (element?.requestFullscreen) {
			element.requestFullscreen();
		}
	}

	/**
	 * Exits fullscreen mode.
	 */
	exitFullscreen() {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		}
	}

	/**
	 * Toggles fullscreen mode.
	 */
	toggleFullscreen() {
		if (this.#fullscreen) {
			this.exitFullscreen();
		} else {
			this.enterFullscreen();
		}
	}

	/**
	 * Refreshes the video duration from the video element.
	 */
	refreshDuration() {
		const video = this.#getVideoElement();
		if (video && video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
			this.#duration = video.duration;
		}
	}

	#initWebAudio() {
		if (this.#audioContext) return;
		try {
			this.#audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			this.#gainNode = this.#audioContext.createGain();
			const initialGain = this.#muted ? 0 : this.volume;
			this.#gainNode.gain.value = initialGain;
			this.#gainNode.connect(this.#audioContext.destination);

			const video = this.#getVideoElement();
			if (video) {
				this.#connectVideoSource(video);
			}
		} catch {
			console.warn("Web Audio API not supported, falling back to video.volume");
			this.#audioContext = null;
		}
	}

	#connectVideoSource(video: HTMLVideoElement) {
		if (!this.#audioContext || !this.#gainNode || this.#source) return;

		try {
			this.#source = this.#audioContext.createMediaElementSource(video);
			this.#source.connect(this.#gainNode);
			video.volume = 1;
			video.muted = false;
		} catch {
			console.warn("Failed to connect video source to Web Audio API");
		}
	}

	#setVolume(volume: number) {
		if (this.#gainNode) {
			const targetVolume = this.#muted ? 0 : volume;
			const currentTime = this.#audioContext!.currentTime;
			this.#gainNode.gain.cancelScheduledValues(currentTime);
			this.#gainNode.gain.setValueAtTime(this.#gainNode.gain.value, currentTime);
			this.#gainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + 0.01);
		}
	}

	#setMute(muted: boolean) {
		const video = this.#getVideoElement();
		if (!video) return;

		if (this.#gainNode) {
			const targetVolume = muted ? 0 : this.volume;
			const currentTime = this.#audioContext!.currentTime;
			this.#gainNode.gain.cancelScheduledValues(currentTime);
			this.#gainNode.gain.setValueAtTime(targetVolume, currentTime);
		} else {
			video.muted = muted;
		}
	}

	#showKeyboardFeedback(message: string) {
		this.#keyboardFeedback = message;
		clearTimeout(this.#keyboardFeedbackTimeout);
		this.#keyboardFeedbackTimeout = setTimeout(() => {
			this.#keyboardFeedback = null;
		}, 1000);
	}

	/**
	 * Formats time in seconds to MM:SS format.
	 */
	formatTime(seconds: number): string {
		// Handle invalid values
		if (!seconds || isNaN(seconds) || seconds === Infinity || seconds < 0) {
			return "0:00";
		}

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
		}
		return `${minutes}:${secs.toString().padStart(2, "0")}`;
	}

	#getVideoElement(): HTMLVideoElement | null {
		const element = document.getElementById(this.ids.video);
		return element instanceof HTMLVideoElement ? element : null;
	}

	#syncVideoElement() {
		const video = this.#getVideoElement();
		if (!video) return;

		// Always sync duration from the native video element
		if (
			video.duration &&
			!isNaN(video.duration) &&
			video.duration !== Infinity &&
			video.duration !== this.#duration
		) {
			this.#duration = video.duration;
		}

		if (Math.abs(video.currentTime - this.currentTime) > 0.1) {
			video.currentTime = this.currentTime;
		}
		// Don't sync volume/mute if using Web Audio API
		if (!this.#gainNode) {
			if (Math.abs(video.volume - this.volume) > 0.01) {
				video.volume = this.volume;
			}
			if (video.muted !== this.muted) {
				video.muted = this.muted;
			}
		}
	}

	#updateBuffered() {
		const video = this.#getVideoElement();
		if (!video || !video.buffered.length) return;

		const buffered = video.buffered;
		let bufferedEnd = 0;
		for (let i = 0; i < buffered.length; i++) {
			if (buffered.start(i) <= video.currentTime && video.currentTime <= buffered.end(i)) {
				bufferedEnd = buffered.end(i);
				break;
			}
		}
		this.#buffered = bufferedEnd;
	}

	/**
	 * The spread attributes for the root video player container.
	 */
	get root() {
		useEventListener(
			() => document,
			"fullscreenchange",
			() => {
				this.#fullscreen = document.fullscreenElement !== null;
			},
		);

		return {
			[dataAttrs.root]: "",
			id: this.ids.root,
			tabindex: this.keyboardControls ? 0 : -1,
			"data-playing": dataAttr(this.#playing.current),
			"data-muted": dataAttr(this.#muted),
			"data-fullscreen": dataAttr(this.#fullscreen),
			"data-loading": dataAttr(this.#loading),
			"data-seeking": dataAttr(this.#seeking),
			"data-error": dataAttr(this.#error !== null),
			role: "application",
			"aria-label": "Video player",
			onclick: (_e: MouseEvent) => {
				// Focus the root element to enable keyboard controls
				if (this.keyboardControls) {
					const rootElement = document.getElementById(this.ids.root);
					rootElement?.focus();
				}
			},

			onkeydown: this.keyboardControls
				? (e) => {
						// Only handle keyboard events when the video player is focused
						if (document.activeElement !== document.getElementById(this.ids.root)) {
							return;
						}

						switch (e.key) {
							case " ":
								e.preventDefault();
								e.stopPropagation();
								this.togglePlay();
								this.#showKeyboardFeedback(this.#playing.current ? "Playing" : "Paused");
								break;
							case "k":
								e.preventDefault();
								this.togglePlay();
								this.#showKeyboardFeedback(this.#playing.current ? "Playing" : "Paused");
								break;
							case "ArrowLeft":
								e.preventDefault();
								this.seekBy(-this.seekStep);
								this.#showKeyboardFeedback(`-${this.seekStep}s`);
								break;
							case "ArrowRight":
								e.preventDefault();
								this.seekBy(this.seekStep);
								this.#showKeyboardFeedback(`+${this.seekStep}s`);
								break;
							case "ArrowUp": {
								e.preventDefault();
								const newVolumeUp =
									Math.round(Math.min(1, this.volume + this.volumeStep) * 100) / 100;
								this.setVolume(newVolumeUp);
								this.#showKeyboardFeedback(`Volume: ${Math.round(newVolumeUp * 100)}%`);
								break;
							}
							case "ArrowDown": {
								e.preventDefault();
								const newVolumeDown =
									Math.round(Math.max(0, this.volume - this.volumeStep) * 100) / 100;
								this.setVolume(newVolumeDown);
								this.#showKeyboardFeedback(`Volume: ${Math.round(newVolumeDown * 100)}%`);
								break;
							}
							case "m":
								e.preventDefault();
								this.toggleMute(true);
								break;
							case "f":
								e.preventDefault();
								this.toggleFullscreen();
								this.#showKeyboardFeedback(this.#fullscreen ? "Fullscreen" : "Exited Fullscreen");
								break;
							case "Home":
								e.preventDefault();
								this.seek(0);
								this.#showKeyboardFeedback("Beginning");
								break;
							case "End":
								e.preventDefault();
								this.seek(this.#duration);
								this.#showKeyboardFeedback("End");
								break;
							case "j":
								e.preventDefault();
								this.seekBy(-this.seekStep);
								this.#showKeyboardFeedback(`-${this.seekStep}s`);
								break;
							case "l":
								e.preventDefault();
								this.seekBy(this.seekStep);
								this.#showKeyboardFeedback(`+${this.seekStep}s`);
								break;
							case "0":
							case "1":
							case "2":
							case "3":
							case "4":
							case "5":
							case "6":
							case "7":
							case "8":
							case "9": {
								e.preventDefault();
								{
									const percent = parseInt(e.key) / 10;
									this.seek(this.#duration * percent);
									this.#showKeyboardFeedback(`${percent * 100}%`);
								}
								break;
							}
						}
					}
				: undefined,
		} as const satisfies HTMLAttributes<HTMLDivElement>;
	}

	/**
	 * The spread attributes for the video element.
	 */
	get video() {
		return {
			[dataAttrs.video]: "",
			id: this.ids.video,
			src: this.src,
			poster: this.poster,
			loop: this.loop,
			autoplay: this.autoplay,
			muted: this.muted,
			preload: this.preload,
			controls: false,
			disablepictureinpicture: true,
			onkeydown: (e) => {
				e.preventDefault();
				e.stopPropagation();
			},
			onclick: (e) => {
				// Focus the root element to enable keyboard controls
				if (this.keyboardControls) {
					const rootElement = document.getElementById(this.ids.root);
					rootElement?.focus();
				}

				e.preventDefault();

				// Clear any existing click timeout
				if (this.#clickTimeout) {
					clearTimeout(this.#clickTimeout);
				}

				// Delay the click action to allow for potential double-click
				this.#clickTimeout = setTimeout(() => {
					this.togglePlay();
				}, 250);
			},
			ondblclick: (e) => {
				e.preventDefault();

				// Cancel the pending single-click action
				if (this.#clickTimeout) {
					clearTimeout(this.#clickTimeout);
					this.#clickTimeout = undefined;
				}

				this.toggleFullscreen();
			},
			onloadedmetadata: (e) => {
				const video = e.currentTarget;
				if (video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
					this.#duration = video.duration;
				}
				this.#connectVideoSource(video);
				this.#props.onLoadedMetadata?.();
			},
			ontimeupdate: (e) => {
				if (this.#seeking) return;
				const video = e.currentTarget;
				this.#currentTime.current = video.currentTime;
				if (
					video.duration &&
					!isNaN(video.duration) &&
					video.duration !== Infinity &&
					video.duration !== this.#duration
				) {
					this.#duration = video.duration;
				}
				this.#updateBuffered();
			},
			onplay: () => {
				this.#playing.current = true;
			},
			onpause: () => {
				this.#playing.current = false;
			},
			onended: () => {
				this.#playing.current = false;
				this.#props.onEnded?.();
			},
			ondurationchange: (e) => {
				const video = e.currentTarget;
				if (video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
					this.#duration = video.duration;
				}
			},
			oncanplay: () => {
				this.#loading = false;
				this.#props.onCanPlay?.();
			},
			oncanplaythrough: (e) => {
				const video = e.currentTarget;
				if (video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
					this.#duration = video.duration;
				}
			},
			onwaiting: () => {
				this.#loading = true;
			},
			onerror: (e) => {
				const video = e.currentTarget;
				if (video instanceof HTMLVideoElement) {
					this.#error = video.error?.message || "An error occurred";
					this.#props.onError?.(e);
				}
			},

			onratechange: (e) => {
				const video = e.currentTarget;
				this.#props.onPlaybackRateChange?.(video.playbackRate);
			},
			onseeking: () => {
				this.#seeking = true;
			},
			onseeked: () => {
				this.#seeking = false;
			},
		} as const satisfies HTMLVideoAttributes;
	}

	/**
	 * The spread attributes for the controls container.
	 */
	get controls() {
		return {
			[dataAttrs.controls]: "",
			role: "group",
			"aria-label": "Video controls",
		} as const;
	}

	/**
	 * The spread attributes for the play/pause button.
	 */
	get playButton() {
		return {
			[dataAttrs.playButton]: "",
			type: "button",
			"aria-label": this.#playing.current ? "Pause" : "Play",
			"data-state": this.#playing.current ? "playing" : "paused",
			onclick: () => this.togglePlay(),
		} as const;
	}

	/**
	 * The spread attributes for the mute/unmute button.
	 */
	get muteButton() {
		return {
			[dataAttrs.muteButton]: "",
			type: "button",
			"aria-label": this.#muted ? "Unmute" : "Mute",
			"data-state": this.#muted ? "muted" : "unmuted",
			onclick: () => this.toggleMute(),
		} as const;
	}

	/**
	 * The spread attributes for the volume slider.
	 */
	get volumeSlider() {
		return {
			[dataAttrs.volumeSlider]: "",
			type: "range",
			min: "0",
			max: "1",
			step: "0.01",
			value: this.#volume.current,
			"aria-label": "Volume",
			"aria-valuemin": 0,
			"aria-valuemax": 1,
			"aria-valuenow": this.#volume.current,
			oninput: (e) => {
				const target = e.currentTarget;
				this.setVolume(parseFloat(target.value));
			},
		} as const satisfies HTMLInputAttributes;
	}

	/**
	 * The spread attributes for the progress bar/scrubber.
	 */
	get progressBar() {
		return {
			[dataAttrs.progressBar]: "",
			type: "range",
			min: "0",
			max: this.#duration.toString(),
			step: "0.1",
			value: this.currentTime,
			"aria-label": "Seek",
			"aria-valuemin": 0,
			"aria-valuemax": this.#duration,
			"aria-valuenow": this.currentTime,
			"aria-valuetext": `${this.formatTime(this.currentTime)} of ${this.formatTime(this.#duration)}`,
			style: styleAttr({
				"--progress": `${this.progress}%`,
				"--buffered": `${this.bufferedProgress}%`,
			}),
			oninput: (e) => {
				const target = e.currentTarget;
				this.seek(parseFloat(target.value));
			},
			onmousedown: () => {
				this.#seeking = true;
			},
			onmouseup: () => {
				this.#seeking = false;
			},
			onkeydown: (e) => {
				switch (e.key) {
					case "ArrowLeft":
						e.preventDefault();
						this.seekBy(-5);
						break;
					case "ArrowRight":
						e.preventDefault();
						this.seekBy(5);
						break;
					case "Home":
						e.preventDefault();
						this.seek(0);
						break;
					case "End":
						e.preventDefault();
						this.seek(this.#duration);
						break;
				}
			},
		} as const satisfies HTMLInputAttributes;
	}

	/**
	 * The spread attributes for the time display.
	 */
	get timeDisplay() {
		return {
			[dataAttrs.timeDisplay]: "",
			"aria-live": "polite",
			"aria-label": `Current time: ${this.formatTime(this.currentTime)}`,
		} as const;
	}

	/**
	 * The spread attributes for the fullscreen button.
	 */
	get fullscreenButton() {
		return {
			[dataAttrs.fullscreenButton]: "",
			type: "button",
			"aria-label": this.#fullscreen ? "Exit fullscreen" : "Enter fullscreen",
			"data-state": this.#fullscreen ? "fullscreen" : "windowed",
			onclick: () => this.toggleFullscreen(),
		} as const;
	}
}
