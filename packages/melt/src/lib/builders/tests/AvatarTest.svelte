<script lang="ts">
    import { type AvatarProps, type ImageLoadingStatus } from "$lib/builders/Avatar.svelte";
    import Avatar from "$lib/components/Avatar.svelte";
    import type { ComponentProps } from "$lib/types";

    const id = $props.id();
    const defaultSrc = undefined;
    const defaultDelayMs = 0;
    const defaultAlt = "avatar-" + id;

    type Props = ComponentProps<AvatarProps> & {
        src?: string;
        delayMs?: number;
        alt?: string;
        onLoadingStatusChange?: (value: ImageLoadingStatus) => void | undefined;
    };

    // Destructure props, providing defaults for src and alt
    let { src = defaultSrc, delayMs = defaultDelayMs, alt = defaultAlt, onLoadingStatusChange, ...rest }: Props = $props();
</script>

<Avatar {src} {delayMs} {onLoadingStatusChange} {...rest}>
    {#snippet children(avatar)}
        <img
            {...avatar.image}
            src={src}
            alt={alt}
            class={[
                avatar.loadingStatus === "loaded" ? "fade-in" : "invisible",
            ]}
        />  
        <div {...avatar.fallback}
        >fallback</div>
        <div
			class={[
				avatar.loadingStatus !== "error" && "pointer-events-none opacity-0",
			]}
            style={avatar.loadingStatus !== "error" ? "visibility: hidden;" : "color: red;"}
		>
			Loading error
        </div>
    {/snippet}
</Avatar>