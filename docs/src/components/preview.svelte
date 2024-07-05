<script context="module" lang="ts">
	type BooleanControl = {
		label: string;
		defaultValue: boolean;
	};

	type NormalizeType<T> = T extends string
		? string
		: T extends number
			? number
			: T extends boolean
				? boolean
				: T extends Record<string, any>
					? T
					: never;

	type Context<Schema extends Record<string, BooleanControl>> = {
		controls: {
			[K in keyof Schema]: NormalizeType<Schema[K]["defaultValue"]>;
		};
		labels: {
			[K in keyof Schema]: Schema[K]["label"];
		};
	};

	const ctx = {
		set<Schema extends Record<string, BooleanControl>>(ctx: Context<Schema>) {
			return setContext(CTX_KEY, ctx);
		},
		get<Schema extends Record<string, BooleanControl>>() {
			return getContext<Context<Schema>>(CTX_KEY) ?? {};
		},
	};

	const CTX_KEY = Symbol();

	export function usePreviewControls<Schema extends Record<string, BooleanControl>>(
		schema: Schema,
	): Context<Schema>["controls"] {
		const controls = $state(
			objectMap(schema, (key, { defaultValue }) => {
				return [key, defaultValue];
			}),
		) as Context<Schema>["controls"];
		const labels = objectMap(schema, (key, { label }) => {
			return [key, label];
		}) as Context<Schema>["labels"];

		ctx.set<Schema>({ controls, labels });

		return controls;
	}
</script>

<script lang="ts">
	import { objectMap } from "@antfu/utils";
	import { getContext, setContext, type Snippet } from "svelte";

	const { controls, labels } = ctx.get();

	interface Props {
		children: Snippet;
	}
	const { children }: Props = $props();
</script>

<div class="border-2 border-gray-700 rounded-2xl overflow-clip grid grid-cols-12 min-h-[300px]">
	<div class="col-span-7 grid place-items-center p-4">
		<div>
			{@render children()}
		</div>
	</div>

	<div class="col-span-5 bg-gray-800 p-4 overflow-y-auto flex flex-col gap-2 border-l-2 border-gray-700">
		{#each Object.keys(controls ?? {}) as key}
			<label>
				{labels[key]}
				<input type="checkbox" bind:checked={controls[key]} />
			</label>
		{/each}
	</div>
</div>

<style>
	* {
		margin: 0 !important;
	}
</style>
