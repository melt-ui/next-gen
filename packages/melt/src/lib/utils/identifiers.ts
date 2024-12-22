import { nanoid } from "nanoid";

type DataIds<Name extends string, Parts extends string[]> = {
	[P in Parts[number]]: `data-melt-${Name}-${P}`;
};
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
