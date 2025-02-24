import { nanoid } from "nanoid";
import { keys } from "./object";

type DataIds<Name extends string, Parts extends string[]> = {
	[P in Parts[number]]: `data-melt-${Name}-${P}`;
};

/**
 * @deprecated use `createBuilderMetaData` instead
 */
export function createDataIds<const Name extends string, const Parts extends string[]>(
	name: Name,
	parts: Parts,
): DataIds<Name, Parts> {
	return parts.reduce(
		(acc, part) => {
			acc[part as Parts[number]] = `data-melt-${name}-${part}`;
			return acc;
		},
		{} as DataIds<Name, Parts>,
	);
}

type Ids<T extends DataIds<string, string[]>> = { [P in keyof T]: string };
export function createIds<const T extends DataIds<string, string[]>>(identifiers: T): Ids<T> {
	const id = nanoid();

	return Object.keys(identifiers).reduce((acc, key) => {
		acc[key] = `${key}-${id}`;
		return acc;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	}, {} as any);
}

export type BuilderMetadata<Name extends string, Parts extends string[]> = {
	dataAttrs: {
		[P in Parts[number]]: `data-melt-${Name}-${P}`;
	};
	dataSelectors: {
		[P in Parts[number]]: `[data-melt-${Name}-${P}]`;
	};
	createIds: () => {
		[P in Parts[number]]: string;
	};
};

export function createBuilderMetadata<const Name extends string, const Parts extends string[]>(
	name: Name,
	parts: Parts,
): BuilderMetadata<Name, Parts> {
	// TODO: clean this up
	const dataAttrs = createDataIds(name, parts);
	const dataSelectors = keys(dataAttrs).reduce((acc, key) => {
		acc[key] = `[${dataAttrs[key]}]`;
		return acc;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	}, {} as any);

	return {
		dataAttrs,
		dataSelectors,
		createIds: () => createIds(dataAttrs),
	};
}
