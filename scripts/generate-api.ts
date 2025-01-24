import { writeFileSync } from "fs";
import { globSync } from "glob";
import { join, sep } from "path";
import { getBuilderPackage } from "./get-packages";
import {
	parseAccessor,
	parseMethod,
	parseProperty,
	parseType,
	project,
	toArray,
	type ResultSchema,
} from "./project";
import { TypeReferenceNode } from "ts-morph";

async function main() {
	console.log("Generating API reference...");
	const result: ResultSchema = {};

	const builderPackage = await getBuilderPackage();
	const { dir } = builderPackage;

	const glob = `${dir}/src/**/*.ts`;
	project.addSourceFilesAtPaths(glob);

	const builders = globSync(`${dir}/src/**/builders/*.svelte.ts`)
		.filter((filename) => !filename.endsWith('.spec.svelte.ts'));
	
	console.log(`Found ${builders.length} builders...`);

	for (const builderDir of builders) {
		const name = builderDir.split(sep).pop()!.split(".")[0];
		result[name] = {
			constructorProps: [],
			methods: [],
			properties: [],
		};

		const sourceFile = project.getSourceFile(builderDir);
		if (!sourceFile) continue;

		const builderClass = sourceFile.getClass(name);
		if (!builderClass) continue;

		const props = sourceFile.getTypeAlias(`${name}Props`);
		if (props) {
			const typeParams =
				props
					.getTypeParameters()[0]
					?.getChildren()
					.filter((c): c is TypeReferenceNode => c instanceof TypeReferenceNode)
					.map((c) => sourceFile.getTypeAlias(c.getType().getText())?.getText()) ?? [];

			result[name].propsAlt = [...typeParams, props.getText().replaceAll("\t", "  ")].join("\n\n");
		}

		const constructor = builderClass?.getConstructors()?.[0];
		if (constructor) {
			const props = constructor.getParameters()?.[0];
			result[name].constructorProps = toArray(await parseType(props?.getType()));
		}

		result[name].methods = await Promise.all(
			builderClass
				.getMethods()
				.filter((m) => !m.getName().startsWith("#"))
				.map(parseMethod),
		);

		result[name].properties = await Promise.all(
			builderClass
				.getProperties()
				.filter((p) => !p.getName().startsWith("#"))
				.map(parseProperty),
		);

		const accessors = builderClass.getGetAccessors();
		const parsed = await Promise.all(
			accessors.filter((a) => !a.getName().startsWith("#")).map(parseAccessor),
		);
		parsed.forEach((p) => {
			result[name].properties.push(p);
		});
	}

	const outPath = join(process.cwd(), "docs/src/api.json");

	writeFileSync(outPath, JSON.stringify(result, null, 2));
	console.log("Finished generating API reference!");
}

main();
