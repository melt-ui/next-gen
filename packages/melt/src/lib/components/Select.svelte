<script lang="ts">
  import { Select as Builder, type SelectProps } from "../builders/Select.svelte";
  import { type Snippet } from "svelte";
  import type { ComponentProps } from "../types";

  type Props = ComponentProps<SelectProps> & {
    children: Snippet<[Builder]>;
  };

  let { children, ...rest }: Props = $props();

  const select = new Select({});
</script>

{@render children(select)}