/* eslint-disable @typescript-eslint/ban-types */
import { writeFileSync } from "fs";
import { globSync } from "glob";
import { join } from "path";
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

async function main() {
	console.log("Generating API reference...");
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result: ResultSchema = {};

	const builderPackage = await getBuilderPackage();
	const { dir } = builderPackage;

	const glob = `${dir}/src/**/*.ts`;
	project.addSourceFilesAtPaths(glob);

	const builders = globSync(`${dir}/src/**/builders/*.svelte.ts`);

	for (const builderDir of builders) {
		const name = builderDir.split("/").pop()!.split(".")[0];
		result[name] = {
			constructorProps: [],
			methods: [],
			properties: [],
		};

		const sourceFile = project.getSourceFile(builderDir);
		if (!sourceFile) return;

		const builderClass = sourceFile.getClass(name);
		if (!builderClass) return;

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
		const parsed = await Promise.all(accessors.map(parseAccessor));
		parsed.forEach((p) => {
			result[name].properties.push(p);
		});
	}

	const outPath = join(process.cwd(), "docs/src/api.json");

	writeFileSync(outPath, JSON.stringify(result, null, 2));
	console.log("Finished generating API reference!");
}

main();
