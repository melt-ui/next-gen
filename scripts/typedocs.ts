/* eslint-disable @typescript-eslint/ban-types */
import { writeFileSync } from "fs";
import { globSync } from "glob";
import { join } from "path";
import {
	GetAccessorDeclaration,
	JSDoc,
	MethodDeclaration,
	ModuleResolutionKind,
	Project,
	PropertyDeclaration,
	Symbol,
	Type,
} from "ts-morph";
import { getBuilderPackage } from "./get-packages";
import * as prettier from "prettier";

type TypeSchema =
	| {
			name: string;
			type: string;
			description?: string;
			defaultValue?: string;
	  }
	| string;

type ResultSchema = Record<string, Record<string, Array<TypeSchema>>>;

function toArray<T>(value: T | T[]): T[] {
	return Array.isArray(value) ? value : [value];
}

async function formatType(type: string): Promise<string> {
	const prefix = "type TEMP = ";
	return (await prettier.format(prefix + type, { parser: "typescript", semi: false })).replace(
		prefix,
		"",
	);
}

async function trimType(value: string): Promise<string> {
	return await formatType(
		value
			.split("=>")
			.map((t) => t.replace(/import\(".*"\)\./, ""))
			.join("=>"),
	);
}

function getDefaultValue(property: Symbol): string {
	const tags = property.getJsDocTags();
	const [defaultValue] = tags.find((tag) => tag.getName() === "default")?.getText() ?? [];
	return defaultValue?.text;
}

function getDescription(property: any): string | undefined {
	const [description] = property.compilerSymbol?.getDocumentationComment(typeChecker) ?? [];
	return description?.text;
}

function getDescriptionFromJsDocs(property: { getJsDocs: () => Array<JSDoc> }): string | undefined {
	const tags = property.getJsDocs();
	return tags.map((j) => j.getText().replace("/**", "").replace("*/", "").trim()).join("\n");
}

async function parseMethod(method: MethodDeclaration): Promise<TypeSchema> {
	return {
		name: method.getName(),
		type: await trimType(method.getType().getText()),
		description: getDescriptionFromJsDocs(method),
	};
}

async function parseProperty(property: PropertyDeclaration): Promise<TypeSchema> {
	return {
		name: property.getName(),
		type: await trimType(property.getType().getText()),
		description: getDescriptionFromJsDocs(property),
	};
}

async function parseAccessor(accessor: GetAccessorDeclaration): Promise<TypeSchema> {
	return {
		name: accessor.getName(),
		type: await trimType(accessor.getType().getText()),
		description: getDescriptionFromJsDocs(accessor),
	};
}

async function parseSymbol(symbol: Symbol): Promise<TypeSchema> {
	const valueDeclaration = symbol.getValueDeclaration();
	const declaredType = valueDeclaration?.getType() ?? symbol.getDeclaredType();

	return {
		name: symbol.getName(),
		type: await trimType(declaredType.getText()),
		description: getDescription(symbol),
		defaultValue: getDefaultValue(symbol),
	};
}

async function parseType(t: Type): Promise<TypeSchema | Array<TypeSchema>> {
	if (t.isObject()) {
		return await Promise.all(t.getProperties().map((p) => parseSymbol(p)));
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
