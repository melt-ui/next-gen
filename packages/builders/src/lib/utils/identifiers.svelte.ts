export function createIdentifiers<Parts extends string[]>(name: string, parts: Parts) {
	return parts.reduce(
		(acc, part) => {
			acc[part as Parts[number]] = `data-melt-${name}-${part}`;
			return acc;
		},
		{} as Record<Parts[number], string>,
	);
}
