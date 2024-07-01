/* eslint-disable @typescript-eslint/ban-types */
import { writeFileSync } from "fs";
import { globSync } from "glob";
import { join } from "path";
import { ModuleResolutionKind, Project, Symbol, Type } from "ts-morph";
import { getBuilderPackage } from "./get-packages";

function trimType(value: string) {
	return value
		.split("=>")
		.map((t) => t.replace(/import\(".*"\)\./, ""))
		.join("=>");
}

function getDescription(property: Symbol) {
	// @ts-expect-error - ts-morph types are inconsistent
	const [description] = property.compilerSymbol.getDocumentationComment(typeChecker);
	return description?.text;
}

function parseType(t: Type) {
	if (t.isObject()) {
		return t.getProperties().map((p) => {
			const valueDeclaration = p.getValueDeclaration();
			if (!valueDeclaration) return {};

			return {
				name: p.getName(),
				type: trimType(valueDeclaration.getType().getText()),
				description: getDescription(p),
					defaultValue: getDefaultValue(p),
			};
		});
	}

	return trimType(t.getText());
}

function getDefaultValue(property: Symbol) {
	const tags = property.getJsDocTags();
	const [defaultValue] = tags.find((tag) => tag.getName() === "default")?.getText() ?? [];
	return defaultValue?.text;
}
const project = new Project({
	compilerOptions: {
		moduleResolution: ModuleResolutionKind.NodeNext,
	},
});
const typeChecker = project.getTypeChecker();

async function main() {
	console.log("Generating API reference...");
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result: Record<string, any> = {};

	const builderPackage = await getBuilderPackage();
	const { dir } = builderPackage;

	const glob = `${dir}/src/**/*.ts`;
	project.addSourceFilesAtPaths(glob);

	const builders = globSync(`${dir}/src/**/builders/*.svelte.ts`);

	builders.forEach((builderDir) => {
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
			result[name].constructorProps = parseType(props?.getType());
		}

		const methods = builderClass.getMethods();
		methods.forEach((m) => {
			result[name].methods.push({
				name: m.getName(),
				args: m.getParameters().map((p) => {
					const type = p.getType();
					return {
						name: p.getName(),
						type: parseType(type),
					};
				}),
				returns: parseType(m.getReturnType()),
			});
		});

		const properties = builderClass.getProperties();
		properties
			.filter((p) => !p.getName().startsWith("#"))
			.forEach((p) => {
				console.log(p.getName());
				result[name].properties.push({
					name: p.getName(),
					type: parseType(p.getType()),
				});
			});

		const accessors = builderClass.getGetAccessors();
		accessors.forEach((a) => {
			result[name].properties.push({
				name: a.getName(),
				type: parseType(a.getType()),
			});
		});
	});

	const outPath = join(process.cwd(), "docs/src/api.json");

	writeFileSync(outPath, JSON.stringify(result, null, 2));
	console.log("Finished generating API reference!");
}

main();
