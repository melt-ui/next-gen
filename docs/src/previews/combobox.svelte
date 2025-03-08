<script lang="ts">
  import Preview from "@components/preview.svelte";
  import { usePreviewControls } from "@components/preview-ctx.svelte";
  import { Combobox } from "melt/builders";

  const controls = usePreviewControls({});

  const combobox = new Combobox({});
</script>

<Preview>
  <div class="flex justify-center">
    <div {...combobox.root} class="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
      Combobox Preview
    </div>
  </div>
</Preview>