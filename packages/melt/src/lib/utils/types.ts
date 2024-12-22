export type ValueOf<T> = T[keyof T];

/* God forgive me */
export type Expand<T> = T extends infer O ? O : never;

export type ExpandDeep<T> = T extends object
	? T extends infer O
		? { [K in keyof O]: ExpandDeep<O[K]> }
		: never
	: T;

type What<
	T extends Record<string, string | number | boolean>,
	Sep extends string = "; ",
	K extends string = "",
> = ExpandDeep<{
	[key in keyof T]: key extends string
		? // eslint-disable-next-line @typescript-eslint/no-empty-object-type
			{} extends Omit<T, key>
			? `${K}${key}: ${T[key]}`
			: What<Omit<T, key>, Sep, `${K}${key}: ${T[key]}${Sep}`>
		: never;
}>;

type UnionToParm<U> = U extends unknown ? (k: U) => void : never;
type UnionToSect<U> = UnionToParm<U> extends (k: infer I) => void ? I : never;
type ExtractParm<F> = F extends { (a: infer A): void } ? A : never;

type SpliceOne<Union> = Exclude<Union, ExtractOne<Union>>;
type ExtractOne<Union> = ExtractParm<UnionToSect<UnionToParm<Union>>>;

type ToTuple<Union> = ToTupleRec<Union, []>;
type ToTupleRec<Union, Rslt extends unknown[]> =
	SpliceOne<Union> extends never
		? [ExtractOne<Union>, ...Rslt]
		: ToTupleRec<SpliceOne<Union>, [ExtractOne<Union>, ...Rslt]>;

// @ts-expect-error - this is hacky, but it works
type FindWhat<T> = ToTuple<T extends string ? T : FindWhat<T[keyof T]>>[0];

export type ObjToString<T extends Record<string, string | number | boolean>> = FindWhat<What<T>>;

export type Expect<T extends true> = T;
export type Equal<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

export type FalseIfUndefined<T extends boolean | undefined> = T extends undefined ? false : T;
