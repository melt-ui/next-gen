import type { Getter } from "$lib/types.js";

type Getters<Obj extends Record<string, unknown>> = {
	[Key in keyof Obj]: Getter<Obj[Key]>;
};

export function getters<Obj extends Record<string, unknown>>(obj: Obj): Getters<Obj> {
	return Object.fromEntries(Object.keys(obj).map((key) => [key, () => obj[key]])) as Getters<Obj>;
}
