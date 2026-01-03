<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { Avatar, Dialog } from "melt/builders";

	const controls = usePreviewControls({
		scrollLock: {
			type: "boolean",
			defaultValue: true,
			label: "Scroll Lock",
		},
		closeOnEscape: {
			type: "boolean",
			defaultValue: true,
			label: "Close on Escape",
		},
		closeOnOutsideClick: {
			type: "boolean",
			defaultValue: true,
			label: "Close on Outside Click",
		},
	});

	const dialog = new Dialog({
		scrollLock: () => controls.scrollLock,
		closeOnEscape: () => controls.closeOnEscape,
		closeOnOutsideClick: () => controls.closeOnOutsideClick,
	});

	const inner = new Dialog({
		scrollLock: () => controls.scrollLock,
		closeOnEscape: () => controls.closeOnEscape,
		closeOnOutsideClick: () => controls.closeOnOutsideClick,
	});

	type User = {
		name: string;
		img?: string;
	};
	const users = $state<User[]>([
		{ name: "Thomas", img: "/previews/thomas.jpg" },
		{ name: "Invisigal", img: "/previews/invisigal.webp" },
		{ name: "Esquie", img: "/previews/esquie.png" },
		{ name: "Hornet", img: "/previews/hornet.jpg" },
		{ name: "Denji", img: "/previews/denji.jpg" },
	]);
	let curr = $state<number>(0);
</script>

{#snippet userProfile(user: User)}
	{@const avatar = new Avatar({ src: user.img })}
	<div class="relative flex size-32 items-center justify-center overflow-hidden rounded-full">
		<div
			class="grid h-full w-full place-items-center rounded-full border bg-neutral-300 text-5xl font-medium text-neutral-700
			dark:bg-neutral-100/10"
		>
			<p>{user.name[0]}</p>
		</div>
		<img
			{...avatar.image}
			alt={`${user.name}'s profile picture`}
			class={[
				"absolute inset-0 !block h-full w-full rounded-[inherit] object-cover",
				avatar.loadingStatus === "loaded" ? "fade-in" : "invisible",
			]}
		/>
	</div>
	<p class="mt-2 font-semibold text-gray-800 dark:text-gray-200">
		{user.name}
	</p>
{/snippet}

<Preview>
	<button
		class="mx-auto block rounded-xl bg-transparent px-4 py-2
		transition-all
		hover:cursor-pointer hover:bg-gray-300/50
		active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50
		dark:hover:bg-gray-500/50 dark:active:bg-gray-600/50"
		{...dialog.trigger}
	>
		{@render userProfile(users[curr])}
		<p class="text-sm font-light dark:text-gray-400">change user?</p>
	</button>

	<div {...dialog.overlay}></div>
	<dialog
		class="abs-center visibility:[hidden] pointer-events-none z-10 grid grid-cols-3 overflow-visible rounded-2xl border bg-white p-4
		shadow-xl
		data-[open]:pointer-events-auto data-[open]:visible
		dark:border-gray-600 dark:bg-gray-900"
		{...dialog.content}
	>
		{#each users as u, i}
			<button
				class="rounded-xl bg-transparent px-4 py-2 transition-all
			hover:cursor-pointer hover:bg-gray-300/50
			active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50
			dark:hover:bg-gray-500/50 dark:active:bg-gray-600/50"
				onclick={() => {
					curr = i;
					dialog.open = false;
				}}
			>
				{@render userProfile(u)}
			</button>
		{/each}
	</dialog>
</Preview>

<style>
	dialog {
		opacity: 0;
		scale: 0.8;
		transition:
			scale cubic-bezier(0.175, 0.885, 0.32, 1.275) 250ms,
			opacity 200ms ease;
	}

	dialog::backdrop {
		display: none;
	}

	dialog[data-open] {
		opacity: 1;
		scale: 1;
	}

	[data-melt-dialog-overlay] {
		position: fixed;
		width: 100%;
		height: 100%;
		background: black;
		opacity: 0;
		transition: 250ms ease;
	}

	[data-melt-dialog-overlay][data-open] {
		opacity: 0.2;
	}

	.fade-in {
		animation: fade-in 0.5s ease-in-out;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			filter: blur(10px);
			scale: 1.2;
		}
		to {
			opacity: 1;
			filter: blur(0);
			scale: 1;
		}
	}
</style>
