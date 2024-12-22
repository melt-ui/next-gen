/* eslint-disable @typescript-eslint/ban-types */
import * as prettier from "prettier";
import {
	GetAccessorDeclaration,
	JSDoc,
	MethodDeclaration,
	ModuleResolutionKind,
	Project,
	PropertyDeclaration,
	Symbol,
	Type,
	ts,
} from "ts-morph";

export type TypeSchema =
	| {
			name: string;
			type: string;
			description?: string;
			defaultValue?: string;
			optional?: boolean;
	  }
	| string;

export type ResultSchema = Record<string, Record<string, Array<TypeSchema> | string>>;

export function toArray<T>(value: T | T[]): T[] {
	return Array.isArray(value) ? value : [value];
}

export async function formatType(type: string): Promise<string> {
	const prefix = "type TEMP =";
	try {
		return (await prettier.format(prefix + type, { parser: "typescript", semi: false }))
			.replace(prefix, "")
			.trim();
	} catch (_e) {
		return type;
	}
}

export async function trimType(value: string): Promise<string> {
	return await formatType(
		value
			.split("=>")
			.map((t) => t.replace(/import\(".*"\)\./, ""))
			.join("=>"),
	);
}

export function getDefaultValue(property: Symbol): string {
	const tags = property.getJsDocTags();
	const [defaultValue] = tags.find((tag) => tag.getName() === "default")?.getText() ?? [];
	return defaultValue?.text;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDescription(property: any): string | undefined {
	const [description] = property.compilerSymbol?.getDocumentationComment(typeChecker) ?? [];
	return description?.text;
}

export function getDescriptionFromJsDocs(property: {
	getJsDocs: () => Array<JSDoc>;
}): string | undefined {
	const tags = property.getJsDocs();
	return tags
		.map((j) =>
			j
				.getText()
				// Remove the /** and */ wrapper
				.replace(/\/\*\*|\*\//g, "")
				// Remove any leading asterisks from multiline comments
				.replace(/^\s*\*\s*/gm, "")
				.trim(),
		)
		.join("\n");
}

export async function parseMethod(method: MethodDeclaration): Promise<TypeSchema> {
	return {
		name: method.getName(),
		type: await trimType(method.getType().getText()),
		description: getDescriptionFromJsDocs(method),
	};
}

export async function parseProperty(property: PropertyDeclaration): Promise<TypeSchema> {
	return {
		name: property.getName(),
		type: await trimType(property.getType().getText()),
		description: getDescriptionFromJsDocs(property),
	};
}

export async function parseAccessor(accessor: GetAccessorDeclaration): Promise<TypeSchema> {
	return {
		name: accessor.getName(),
		type: await trimType(accessor.getType().getText()),
		description: getDescriptionFromJsDocs(accessor),
	};
}

export async function parseSymbol(symbol: Symbol): Promise<TypeSchema> {
	const valueDeclaration = symbol.getValueDeclaration();
	const declaredType = valueDeclaration
		? symbol.getTypeAtLocation(valueDeclaration)
		: symbol.getDeclaredType();

	return {
		name: symbol.getName(),
		type: await trimType(declaredType.getText()),
		description: getDescription(symbol),
		defaultValue: getDefaultValue(symbol),
		optional: symbol.isOptional(),
	};
}

export async function parseType(t: Type): Promise<TypeSchema | Array<TypeSchema>> {
	if (t.isObject()) {
		return await Promise.all(t.getProperties().map((p) => parseSymbol(p)));
	}

	if (t.isIntersection()) {
		const objects = t.getIntersectionTypes().filter((t): t is Type<ts.ObjectType> => t.isObject());
		const allProperties = objects.flatMap((o) => o.getProperties());
		return await Promise.all(allProperties.map((p) => parseSymbol(p)));
	}

	return trimType(t.getText());
}

export const project = new Project({
	compilerOptions: {
		moduleResolution: ModuleResolutionKind.NodeNext,
	},
	tsConfigFilePath: "packages/melt/tsconfig.json",
});
export const typeChecker = project.getTypeChecker();
