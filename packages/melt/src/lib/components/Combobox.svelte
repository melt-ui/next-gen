<script lang="ts">
  import { Combobox as Builder, type ComboboxProps } from "../builders/Combobox.svelte";
  import { type Snippet } from "svelte";
  import type { ComponentProps } from "../types";

  type Props = ComponentProps<ComboboxProps> & {
    children: Snippet<[Builder]>;
  };

  let { children, ...rest }: Props = $props();

  const combobox = new Combobox({});
</script>

{@render children(combobox)}