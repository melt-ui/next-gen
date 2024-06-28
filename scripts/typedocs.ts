/* eslint-disable @typescript-eslint/ban-types */
import { writeFileSync } from "fs";
import { globSync } from "glob";
import { join } from "path";
import { ModuleResolutionKind, Project, Type, Symbol, Node } from "ts-morph";
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

function parseType(t: Type): any {
	if (t.isObject()) {
		return t.getProperties().map((p) => {
			const valueDeclaration = p.getValueDeclaration();
			if (!valueDeclaration) return {};

			return {
				name: p.getName(),
				type: trimType(valueDeclaration.getType().getText()),
				description: getDescription(p),
			};
		});
	}

	return trimType(t.getText());
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
	});

	const outPath = join(process.cwd(), "api.json");

	writeFileSync(outPath, JSON.stringify(result, null, 2));
	console.log("Finished generating API reference!");
}

main();
