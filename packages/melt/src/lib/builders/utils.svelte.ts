import type { Getter } from "$lib/types";

type Getters<Obj extends Record<string, unknown>> = {
	[Key in keyof Obj]: Getter<Obj[Key]>;
};

export function getters<Obj extends Record<string, unknown>>(obj: Obj): Getters<Obj> {
	return Object.fromEntries(
		Object.entries(obj).map(([key, value]) => [key, () => value]),
	) as Getters<Obj>;
}
