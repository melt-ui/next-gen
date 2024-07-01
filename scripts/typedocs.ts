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

function trimType(value: string): string {
	return value
		.split("=>")
		.map((t) => t.replace(/import\(".*"\)\./, ""))
		.join("=>");
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

function parseMethod(method: MethodDeclaration): TypeSchema {
	return {
		name: method.getName(),
		type: trimType(method.getType().getText()),
		description: getDescriptionFromJsDocs(method),
	};
}

function parseProperty(property: PropertyDeclaration): TypeSchema {
	return {
		name: property.getName(),
		type: trimType(property.getType().getText()),
		description: getDescriptionFromJsDocs(property),
	};
}

function parseAccessor(accessor: GetAccessorDeclaration): TypeSchema {
	return {
		name: accessor.getName(),
		type: trimType(accessor.getType().getText()),
		description: getDescriptionFromJsDocs(accessor),
	};
}

function parseSymbol(symbol: Symbol): TypeSchema {
	const valueDeclaration = symbol.getValueDeclaration();
	const declaredType = valueDeclaration?.getType() ?? symbol.getDeclaredType();

	return {
		name: symbol.getName(),
		type: trimType(declaredType.getText()),
		description: getDescription(symbol),
		defaultValue: getDefaultValue(symbol),
	};
}

function parseType(t: Type): TypeSchema | Array<TypeSchema> {
	if (t.isObject()) {
		return t.getProperties().map(parseSymbol);
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
			result[name].constructorProps = toArray(parseType(props?.getType()));
		}

		result[name].methods = builderClass
			.getMethods()
			.filter((m) => !m.getName().startsWith("#"))
			.map(parseMethod);

		result[name].properties = builderClass
			.getProperties()
			.filter((p) => !p.getName().startsWith("#"))
			.map(parseProperty);

		const accessors = builderClass.getGetAccessors();
		accessors.forEach((a) => {
			result[name].properties.push(parseAccessor(a));
		});
	});

	const outPath = join(process.cwd(), "docs/src/api.json");

	writeFileSync(outPath, JSON.stringify(result, null, 2));
	console.log("Finished generating API reference!");
}

main();
