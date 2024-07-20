type DataReturn<T> = T extends true ? "" : T extends false ? undefined : T;

export function dataAttr<T>(value: T): DataReturn<T> {
	return (value === true ? "" : value === false ? undefined : value) as DataReturn<T>;
}
