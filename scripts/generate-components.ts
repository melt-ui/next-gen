// scripts/autogenerate.js
import { globSync } from "glob";
import { parseType, project } from "./project";

const LIB_DIR = "packages/melt/src/lib";

function getExtenionlessFilename(filename: string) {
	const lastSegment = filename.slice(filename.lastIndexOf("/") + 1);

	// Remove file extension
	return lastSegment.replace(/\..+$/, "");
}

console.log("Generating builder components");

project.addSourceFilesAtPaths(`${LIB_DIR}/**/*.ts`);

const builderFiles = globSync(`${LIB_DIR}/builders/**/*.svelte.ts`);
for (const filename of builderFiles) {
	const file = project.getSourceFile(filename);
	if (file == null) {
		console.error(`Could not find file ${filename}`);
		continue;
	}

	const className = getExtenionlessFilename(filename);
	const builderClass = file.getClass(className);
	if (builderClass == null) {
		console.error(`Could not find class ${className} in ${filename}`);
		continue;
	}

	const constructors = builderClass.getConstructors();
	if (constructors.length !== 1) {
		console.error(
			`Expected class ${className} to have exactly one constructor, but found ${constructors.length}`,
		);
		continue;
	}

	const parameters = constructors[0].getParameters();
	if (parameters.length !== 1) {
		console.error(
			`Expected constructor of ${className} to have exactly one parameter, but found ${parameters.length}`,
		);
		continue;
	}

	const propsType = parameters[0].getType();
	if (!propsType.isObject()) {
		console.error(`Expected parameter of ${className} to be an object type`);
		continue;
	}

	const props = propsType.getProperties();
	const propNames = props.map((prop) => prop.getName());
	// Some props may have an accompanying onPropChange prop.
	// We want to get a list of them, and put them in an obj.
	// e.g. {propName: 'value', type: 'string',}
	const onChangeProps: Array<{ propName: string; type: string }> = [];
	props.forEach(async (prop) => {
		const propName = prop.getName();
		const onChangePropName = `on${propName.charAt(0).toUpperCase() + propName.slice(1)}Change`;

		if (!propNames.includes(onChangePropName)) return;
		console.log(await parseType(prop.getDeclaredType()));
		onChangeProps.push({
			propName,
			type: "fuck",
		});
	});

	console.log(className, propNames, onChangeProps);

	const componentFile = `
<script lang="ts">
	import { ${className}, type ${className}Props } from "../builders/${className}.svelte.js";
	import type { WithoutGetters } from "../types";

	type Props = WithoutGetters<${className}Props> ;
</script>
	`;

	console.log(componentFile);
}
