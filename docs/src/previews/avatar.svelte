<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { Avatar, getters } from "melt/builders";
	import { Debounced } from "runed";

	const controls = usePreviewControls({
		delayMs: {
			label: "Delay (ms)",
			type: "number",
			defaultValue: 650,
		},
	});

	let username = $state("rich-harris");
	const src = new Debounced(() => `https://github.com/${username}.png`, 500);

	const getInitials = (username: string): string => {
		// Handle empty strings
		if (!username) return "";

		// Split by common separators and handle camelCase/PascalCase
		const parts = username
			// Insert space before capitals in camelCase/PascalCase
			.replace(/([a-z])([A-Z])/g, "$1 $2")
			// Split by common separators
			.split(/[\s\-_\/.]+/)
			// Remove empty parts
			.filter((part) => part.length > 0);

		// Get first letter of first part
		const firstInitial = parts[0]?.[0]?.toUpperCase() || "";

		// Get first letter of last part if different from first part
		const lastInitial = parts.length > 1 ? parts[parts.length - 1]?.[0]?.toUpperCase() : "";

		return firstInitial + (lastInitial === firstInitial ? "" : lastInitial);
	};
	const initials = $derived(getInitials(username));

	const avatar = new Avatar({
		src: () => src.current,
		...getters(controls),
	});
</script>

<Preview>
	<div class="flex flex-col items-center">
		<div class="flex w-full items-center justify-center gap-6">
			<div class="flex size-32 items-center justify-center rounded-full bg-neutral-100">
				<img {...avatar.image} alt="Avatar" class="h-full w-full rounded-[inherit]" />
				<span {...avatar.fallback} class="text-magnum-700 text-4xl font-medium">{initials}</span>
			</div>
		</div>
		<label for="gh" class="mt-4"> GitHub username </label>
		<span
			contenteditable
			id="gh"
			class=" w-auto border-b-2 border-neutral-600 bg-transparent px-1 pb-1 text-center text-2xl font-light
			placeholder-neutral-500 outline-none transition focus:border-neutral-200 dark:text-white"
			bind:innerText={username}
			spellcheck="false"
		></span>
		<span
			class={[
				"mt-2 text-red-300",
				avatar.loadingStatus !== "error" && "pointer-events-none opacity-0",
			]}
		>
			invalid username
		</span>
	</div>
</Preview>
