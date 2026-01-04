<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { Avatar, Dialog } from "melt/builders";
	import Close from "~icons/material-symbols/close-rounded";
	import Trash from "~icons/tabler/trash";

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

	const formDialog = new Dialog({
		scrollLock: () => controls.scrollLock,
		closeOnEscape: () => controls.closeOnEscape,
		closeOnOutsideClick: () => controls.closeOnOutsideClick,
	});

	const deleteDialog = new Dialog({
		scrollLock: () => controls.scrollLock,
		closeOnEscape: () => controls.closeOnEscape,
		closeOnOutsideClick: () => controls.closeOnOutsideClick,
	});

	type User = {
		name: string;
		img?: string;
	};
	const users = $state<User[]>([
		{ name: "Thomas", img: "/previews/dialog/thomas.jpg" },
		{ name: "Invisigal", img: "/previews/dialog/invisigal.webp" },
		{ name: "Esquie", img: "/previews/dialog/esquie.png" },
		{ name: "Hornet", img: "/previews/dialog/hornet.jpg" },
		{ name: "Denji", img: "/previews/dialog/denji.jpg" },
	]);
	let curr = $state<number>(0);
	let userToDelete = $state<{ index: number; user: User } | null>(null);
</script>

{#snippet userProfile(user: User, a?: Avatar)}
	{@const avatar = a ?? new Avatar({ src: user.img })}
	<div class="relative flex size-32 items-center justify-center overflow-hidden rounded-full">
		<div
			class="grid h-full w-full place-items-center rounded-full border bg-neutral-300 text-5xl font-medium text-neutral-700
			dark:bg-neutral-800"
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
		class="abs-center visibility:[hidden] pointer-events-none z-10 grid grid-cols-3 overflow-visible
		rounded-2xl border bg-white p-4 shadow-xl backdrop-blur-lg
		data-[open]:pointer-events-auto data-[open]:visible
		dark:border-gray-700 dark:bg-gray-900/80"
		{...dialog.content}
	>
		{#each users as u, i (u.name)}
			<div class="group relative">
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
				<button
					class="delete-btn absolute right-3 top-2 grid size-7 place-items-center rounded-full
					border border-red-200/50 bg-red-100/80 text-red-400
					opacity-0 shadow-sm backdrop-blur-sm
					transition-all duration-200
					hover:bg-red-200/90 hover:text-red-500 hover:shadow-md
					group-hover:opacity-100
					dark:border-red-400/20 dark:bg-red-500/20 dark:text-red-300
					dark:hover:bg-red-500/30 dark:hover:text-red-200"
					onclick={(e) => {
						e.stopPropagation();
						userToDelete = { index: i, user: u };
						deleteDialog.open = true;
					}}
				>
					<Trash class="size-3.5" />
				</button>
			</div>
		{/each}
		<button
			class="rounded-xl bg-transparent px-4 py-2 transition-all
			hover:cursor-pointer hover:bg-gray-300/50
			active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50
			dark:hover:bg-gray-500/50 dark:active:bg-gray-600/50"
			{...formDialog.trigger}
		>
			<div class="relative flex size-32 items-center justify-center overflow-hidden rounded-full">
				<div
					class="grid h-full w-full place-items-center rounded-full border bg-neutral-300 text-5xl font-medium text-neutral-700
			dark:bg-neutral-800 dark:text-neutral-600"
				>
					<p>+</p>
				</div>
			</div>
			<p class="mt-2 font-semibold text-gray-800 dark:text-gray-200">Add new</p>
		</button>

		<div {...formDialog.overlay}></div>
		<dialog
			class="abs-center visibility:[hidden] pointer-events-none z-10 w-96 overflow-visible
		rounded-2xl border bg-white p-6 shadow-xl backdrop-blur-lg
		data-[open]:pointer-events-auto data-[open]:visible
		dark:border-gray-700 dark:bg-gray-900/80"
			{...formDialog.content}
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Add new user</h2>
				<button
					class="grid place-items-center rounded-lg bg-transparent p-1 text-gray-400
					transition-colors hover:bg-gray-100 hover:text-gray-600
					dark:hover:bg-gray-700 dark:hover:text-gray-200"
					onclick={() => (formDialog.open = false)}
				>
					<Close class="size-5" />
				</button>
			</div>
			<form
				class="flex flex-col gap-4"
				onsubmit={(e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const name = formData.get("name") as string;
					if (!name.trim()) return

					users.push({ name: name.trim() });
					formDialog.open = false;
					e.currentTarget.reset();
				}}
			>
				<label class="flex flex-col gap-1.5">
					<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Name</span>
					<input
						type="text"
						name="name"
						required
						placeholder="Enter name..."
						class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900
						placeholder:text-gray-400
						focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500/20
						dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100
						dark:placeholder:text-gray-500 dark:focus:border-gray-400 dark:focus:ring-gray-400/20"
					/>
				</label>
				<div class="mt-2 flex justify-end gap-3">
					<button
						type="button"
						class="rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-700
						transition-all hover:cursor-pointer hover:bg-gray-200
						active:bg-gray-300
						dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:active:bg-gray-500"
						onclick={() => (formDialog.open = false)}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="rounded-xl bg-gray-600 px-4 py-2 font-medium text-white
						transition-all hover:cursor-pointer hover:bg-gray-500
						active:bg-gray-400
						dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600"
					>
						Add User
					</button>
				</div>
			</form>
		</dialog>

		<div {...deleteDialog.overlay}></div>
		<dialog
			class="abs-center visibility:[hidden] w-128 pointer-events-none z-10 overflow-visible
			rounded-2xl border bg-white p-6 shadow-xl backdrop-blur-lg
			data-[open]:pointer-events-auto data-[open]:visible
			dark:border-gray-700 dark:bg-gray-900/80"
			{...deleteDialog.content}
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Delete user</h2>
				<button
					class="grid place-items-center rounded-lg bg-transparent p-1 text-gray-400
					transition-colors hover:bg-gray-100 hover:text-gray-600
					dark:hover:bg-gray-700 dark:hover:text-gray-200"
					onclick={() => (deleteDialog.open = false)}
				>
					<Close class="size-5" />
				</button>
			</div>
			<hr class="mb-4 border-gray-200 dark:border-gray-700" />
			<p class="text-gray-600 dark:text-gray-300">
				Are you sure you want to delete <span class="font-semibold">{userToDelete?.user.name}</span
				>?
			</p>
			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					class="rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-700
					transition-all hover:cursor-pointer hover:bg-gray-200
					active:bg-gray-300
					dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:active:bg-gray-500"
					onclick={() => (deleteDialog.open = false)}
				>
					Cancel
				</button>
				<button
					type="button"
					class="rounded-xl bg-red-500 px-4 py-2 font-medium text-white
					transition-all hover:cursor-pointer hover:bg-red-600
					active:bg-red-700
					dark:bg-red-800 dark:hover:bg-red-700 dark:active:bg-red-800"
					onclick={() => {
						if (userToDelete) {
							users.splice(userToDelete.index, 1);
							if (curr >= users.length) curr = Math.max(0, users.length - 1);
							userToDelete = null;
						}
						deleteDialog.open = false;
					}}
				>
					Delete
				</button>
			</div>
		</dialog>
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
		background: transparent;
		background: color-mix(in oklch, var(--color-black) 50%, transparent);
		backdrop-filter: blur(20px);
		opacity: 0;
		transition: 200ms ease;
	}

	[data-melt-dialog-overlay][data-open] {
		opacity: 1;
	}

	.fade-in {
		animation: fade-in 0.2s ease-in-out;
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
