<script lang="ts">
  import { Dropzone, type DropzoneProps } from "../builders/Dropzone.svelte";
  import { type Snippet } from "svelte";
  import type { ComponentProps } from "../types";

  type Props = ComponentProps<DropzoneProps> & {
    children: Snippet<[Dropzone]>;
  };

  let { children, ...rest }: Props = $props();

  const dropzone = new Dropzone({});
</script>

{@render children(dropzone)}