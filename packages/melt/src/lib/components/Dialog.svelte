<script lang="ts">
  import { Dialog as Builder, type DialogProps } from "../builders/Dialog.svelte";
  import { type Snippet } from "svelte";
  import type { ComponentProps } from "../types";

  type Props = ComponentProps<DialogProps> & {
    children: Snippet<[Builder]>;
  };

  let { children, ...rest }: Props = $props();

  const dialog = new Dialog({});
</script>

{@render children(dialog)}