import { createAttachmentKey, type Attachment } from "svelte/attachments";
import { keys } from "./object";

let id = 0;
export function createId() {
	return `melt-${id++}`;
}

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
	const id = createId();

	return Object.keys(identifiers).reduce((acc, key) => {
		acc[key] = `${key}-${id}`;
		return acc;
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
	createReferences: () => {
		get: (key: Parts[number]) => HTMLElement | undefined;
		attach: (key: Parts[number]) => Attachment<HTMLElement>;
		key: any;
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
	}, {} as any);

	return {
		dataAttrs,
		dataSelectors,
		createIds: () => createIds(dataAttrs),
		createReferences: () => createReferences<Parts>(),
	};
}

export function createReferences<const Parts extends string[]>() {
	const refs = new Map<Parts[number], HTMLElement>();
	const ak = createAttachmentKey();

	return {
		get(key: Parts[number]): HTMLElement | undefined {
			return refs.get(key);
		},
		attach(key: Parts[number]): Attachment<HTMLElement> {
			return (node) => {
				refs.set(key, node);
				return () => refs.delete(key);
			};
		},
		key: ak,
	};
}
