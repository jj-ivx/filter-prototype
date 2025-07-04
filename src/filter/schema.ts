export type BooleanFilter = { type: "boolean"; label: string };

export type SingleSelectFilter = {
  type: "single-select";
  label: string;
  options: { id: string; label: string }[];
};

export type MultiSelectFilter = {
  type: "multi-select";
  label: string;
  options: { id: string; label: string }[];
};

export type Filter = BooleanFilter | SingleSelectFilter | MultiSelectFilter;

export type FilterType = Filter["type"];

export type FilterSchema = Record<string, Filter>;

export function FilterSchema<const T extends FilterSchema>(
  schema: T,
): NoInfer<T> {
  return schema;
}

type ValidateFilterTypeMap<T extends Record<FilterType, unknown>> = T;

type FilterTypeMap = ValidateFilterTypeMap<{
  boolean: boolean;
  "single-select": string | null;
  "multi-select": string[];
}>;

export type FilterValue<T extends Filter> = FilterTypeMap[T["type"]];

export type InferFilterValues<T extends FilterSchema> = {
  [P in keyof T & string]: FilterValue<T[P]>;
};
