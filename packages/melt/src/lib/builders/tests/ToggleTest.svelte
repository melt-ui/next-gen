<script lang="ts">
	import { type ToggleProps } from "$lib/builders/Toggle.svelte";
	import Toggle from "$lib/components/Toggle.svelte";
	import type { ComponentProps } from "$lib/types";

	type Props = ComponentProps<ToggleProps> & {
		value?: boolean;
		disabled?: boolean;
		label?: string;
		description?: string;
		onValueChange?: (value: boolean) => void;
	};

	let {
		value = $bindable(false),
		disabled = $bindable(false),
		label = "Mute",
		onValueChange,
		...rest
	}: Props = $props();

	export { value, disabled };
</script>

<form>
	<fieldset>
		<Toggle bind:value={() => value, (v) => {value = v; onValueChange?.(v);}} {disabled} {...rest}>
			{#snippet children(toggle)}
				<button
					id="toggle-button"
					{...toggle.trigger}
					data-testid="toggle-button"
					class={[toggle.value ? "pressed" : "", toggle.disabled ? "disabled" : ""]}
					type="button"
				>
					{label}
				</button>
				<input {...toggle.hiddenInput} />
			{/snippet}
		</Toggle>
	</fieldset>
</form>

