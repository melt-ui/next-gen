import { getContext, setContext } from "svelte";
import { objectMap } from "@antfu/utils";

const CTX_KEY = Symbol();

function set<Schema extends SchemaExtends>(ctx: Context<Schema>) {
	return setContext(CTX_KEY, ctx);
}

function get<Schema extends SchemaExtends>() {
	return getContext<Context<Schema>>(CTX_KEY) ?? {};
}

export const previewCtx = { get, set };

// A type that marks all readonly values as writable
type Writable<T> = {
	-readonly [P in keyof T]: T[P];
};

type BooleanControl = {
	label: string;
	defaultValue: boolean;
	type: "boolean";
};

type SelectControl = {
	label: string;
	defaultValue: string;
	options: string[];
	type: "select";
};

type NumberControl = {
	label: string;
	defaultValue: number;
	type: "number";
	min?: number;
	max?: number;
};

type Control = BooleanControl | SelectControl | NumberControl;

type NormalizeType<T> = T extends string
	? T
	: T extends number
		? T
		: T extends boolean
			? boolean
			: // eslint-disable-next-line @typescript-eslint/no-explicit-any
				T extends Record<string, any>
				? T
				: never;

type SchemaExtends = Record<string, Control>;

type Context<Schema extends SchemaExtends> = {
	values: {
		[K in keyof Schema]: NormalizeType<
			Schema[K] extends SelectControl ? Schema[K]["options"][number] : Schema[K]["defaultValue"]
		>;
	};
	schema: Schema;
};

export function usePreviewControls<const Schema extends SchemaExtends>(
	schema: Schema,
): Writable<Context<Schema>["values"]> {
	const values = $state(
		objectMap(schema, (key, { defaultValue }) => {
			return [key, defaultValue];
		}),
	) as Context<Schema>["values"];

	previewCtx.set<Schema>({ values, schema });

	return values;
}
