import { type MaybeGetter } from "@melt-ui/builders";

export type WithoutGetters<Obj extends Record<string, unknown>> = {
	[K in keyof Obj]: Obj[K] extends MaybeGetter<infer T> ? T : Obj[K];
};
