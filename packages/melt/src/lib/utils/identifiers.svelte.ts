import { nanoid } from "nanoid";

type DataIds<Parts extends string[]> = {
	[P in Parts[number]]: `data-melt-${P}`;
};
export function createDataIds<const Parts extends string[]>(
	name: string,
	parts: Parts,
): DataIds<Parts> {
	return parts.reduce((acc, part) => {
		acc[part as Parts[number]] = `data-melt-${name}-${part}`;
		return acc;
	}, {} as DataIds<Parts>);
}

type Ids<T extends DataIds<string[]>> = { [P in keyof T]: string };
export function createIds<const T extends DataIds<string[]>>(identifiers: T): Ids<T> {
	const id = nanoid();

	return Object.keys(identifiers).reduce((acc, key) => {
		acc[key] = `${key}-${id}`;
		return acc;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	}, {} as any);
}
