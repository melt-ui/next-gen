export function createIdentifiers<const Parts extends string[]>(name: string, parts: Parts) {
	return parts.reduce(
		(acc, part) => {
			acc[part as Parts[number]] = `data-melt-${name}-${part}`;
			return acc;
		},
		{} as {
			[P in Parts[number]]: `data-melt-${P}`;
		},
	);
}
