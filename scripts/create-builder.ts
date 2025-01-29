#!/usr/bin/env node
import * as fs from 'fs/promises';
import * as path from 'path';

const componentName = process.argv[2];

if (!componentName) {
  console.error('Please provide a component name');
  process.exit(1);
}

// Convert to proper case (e.g., "pin-input" -> "PinInput")
const formatComponentName = (name: string) => {
  return name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
};

const formattedName = formatComponentName(componentName);

const builderContent = `import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { dataAttr, disabledAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createDataIds } from "$lib/utils/identifiers";

const identifiers = createDataIds("${componentName}", ["root"]);

export type ${formattedName}Props = {
  /**
   * If \`true\`, prevents the user from interacting with the component.
   *
   * @default false
   */
  disabled?: MaybeGetter<boolean | undefined>;
};

export class ${formattedName} {
  /* Props */
  #props!: ${formattedName}Props;
  readonly disabled = $derived(extract(this.#props.disabled, false));

  constructor(props: ${formattedName}Props = {}) {
    this.#props = props;
  }

  /** The root element. */
  get root() {
    return {
      [identifiers.root]: "",
      "data-disabled": dataAttr(this.disabled),
      disabled: disabledAttr(this.disabled),
    } as const;
  }
}`;

const componentContent = `<script lang="ts">
  import { ${formattedName}, type ${formattedName}Props } from "../builders/${formattedName}.svelte";
  import { type Snippet } from "svelte";
  import type { ComponentProps } from "../types";

  type Props = ComponentProps<${formattedName}Props> & {
    children: Snippet<[${formattedName}]>;
  };

  let { children, ...rest }: Props = $props();

  const ${componentName} = new ${formattedName}({
    disabled: () => rest.disabled,
  });
</script>

{@render children(${componentName})}`;

const previewContent = `<script lang="ts">
  import Preview from "@components/preview.svelte";
  import { usePreviewControls } from "@components/preview-ctx.svelte";
  import { ${formattedName} } from "melt/builders";

  const controls = usePreviewControls({
    disabled: {
      label: "Disabled",
      type: "boolean",
      defaultValue: false,
    },
  });

  const ${componentName} = new ${formattedName}({
    disabled: () => controls.disabled,
  });
</script>

<Preview>
  <div class="flex justify-center">
    <div {...${componentName}.root} class="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
      ${formattedName} Preview
    </div>
  </div>
</Preview>`;

const docsContent = `---
title: ${formattedName}
description: A description of the ${formattedName} component.
---
import ApiTable from "@components/api-table.astro";
import Preview from "@previews/${componentName}.svelte";
import Features from "@components/features.astro";
import { Tabs, TabItem } from '@astrojs/starlight/components';

<Preview client:load />

## Features

<Features>
- 💪 It works
</Features>

## Usage

<Tabs>
  <TabItem label="Builder">
\`\`\`svelte
<script lang="ts">
  import { ${formattedName} } from "melt/builders";

  const ${componentName} = new ${formattedName}();
</script>

<div {...${componentName}.root}>
  ${formattedName} content
</div>
\`\`\`
  </TabItem>

  <TabItem label="Component">
\`\`\`svelte
<script lang="ts">
  import { ${formattedName} } from "melt/components";
</script>

<${formattedName}>
  {#snippet children(${componentName})}
    <div {...${componentName}.root}>
      ${formattedName} content
    </div>
  {/snippet}
</${formattedName}>
\`\`\`
  </TabItem>
</Tabs>

## API Reference

<ApiTable entry="${formattedName}" />`;

async function createFile(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
  console.log(`Created ${filePath}`);
}

async function updateBarrelFile(directory: string, exportName: string) {
  const indexPath = path.join(directory, 'index.ts');
  const content = await fs.readFile(indexPath, 'utf-8');
  const newContent = content + `\nexport * from './${exportName}.svelte';`;
  await fs.writeFile(indexPath, newContent);
  console.log(`Updated ${indexPath}`);
}

async function main() {
  const basePath = process.cwd();
  const builderPath = path.join(basePath, 'packages/melt/src/lib/builders', `${formattedName}.svelte.ts`);
  const componentPath = path.join(basePath, 'packages/melt/src/lib/components', `${formattedName}.svelte`);
  const docsPath = path.join(basePath, 'docs/src/content/docs/components', `${componentName}.mdx`);

  // Create the files
  await createFile(builderPath, builderContent);
  await createFile(componentPath, componentContent);
  await createFile(docsPath, docsContent);
  
  // Create preview file
  const previewPath = path.join(basePath, 'docs/src/previews', `${componentName}.svelte`);
  await createFile(previewPath, previewContent);

  // Update barrel files
  await updateBarrelFile('packages/melt/src/lib/builders', formattedName);
  await updateBarrelFile('packages/melt/src/lib/components', formattedName);

  console.log('Done! 🎉');
}

main().catch(console.error);
