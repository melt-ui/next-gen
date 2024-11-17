import type { Getter } from "$lib/types.js";

export type BuilderProps<TComponentProps> = {
	[K in keyof TComponentProps]: Getter<TComponentProps[K]>;
};

export function builderProps<TComponentProps extends Record<string, unknown>>(
	props: TComponentProps,
): BuilderProps<TComponentProps> {
	const result = {} as BuilderProps<TComponentProps>;
	for (const key in props) {
		result[key] = () => props[key];
	}
	return result;
}
