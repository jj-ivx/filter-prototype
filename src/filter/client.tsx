"use client";

import {
  createContext,
  ReactNode,
  use,
  useCallback,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cx } from "class-variance-authority";
import {
  MenuItem,
  Popover,
  Autocomplete,
  Button,
  Heading,
  Input,
  Menu,
  MenuTrigger,
  SearchField,
  SubmenuTrigger,
  useFilter,
} from "../react-aria";
import {
  FilterSchema,
  Filter,
  FilterValue,
  BooleanFilter,
  MultiSelectFilter,
  SingleSelectFilter,
} from "./schema";

type FilterItem<T extends Filter, U extends string = string> = T extends T
  ? T & { id: U; current: FilterValue<T> }
  : never;

type FilterItems<T extends FilterSchema> = {
  [P in keyof T & string]: FilterItem<T[P], P>;
}[keyof T & string][];

export interface FilterState<T extends FilterSchema> {
  items: FilterItems<T>;
  set<K extends keyof FilterSchema>(key: K, value: FilterValue<T[K]>): void;
}

const FilterStateContext = createContext<FilterState<FilterSchema> | null>(
  null,
);

interface FilterStateProviderProps<T extends FilterSchema> {
  schema: T;
  children: ReactNode;
}

export function FilterStateProvider<const T extends FilterSchema>({
  schema,
  children,
}: FilterStateProviderProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string | boolean | string[] | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value) params.delete(name);
      else if (value === true) params.set(name, "");
      else if (Array.isArray(value)) {
        params.delete(name);
        value.forEach((v) => params.append(name, v));
      } else params.set(name, value);
      return params.toString();
    },
    [searchParams],
  );

  const state = useMemo<FilterState<T>>(() => {
    const values = Object.entries(schema).map(([id, schema]) => {
      switch (schema.type) {
        case "boolean": {
          const current = searchParams.get(id) != null;
          return { ...schema, id, current };
        }
        case "single-select": {
          const current = searchParams.get(id);
          return { ...schema, id, current };
        }
        case "multi-select": {
          const current = searchParams.getAll(id);
          return { ...schema, id, current };
        }
        default:
          throw new Error(`Unsupported schema ${schema satisfies never}`);
      }
    }) satisfies FilterState<FilterSchema>["items"] as FilterState<T>["items"];

    return {
      items: values,
      set(key, value) {
        router.replace(pathname + "?" + createQueryString(key, value));
      },
    };
  }, [schema, searchParams, createQueryString]);

  return (
    <FilterStateContext value={state as unknown as FilterState<FilterSchema>}>
      {children}
    </FilterStateContext>
  );
}

export function useFilterState() {
  const context = use(FilterStateContext);
  if (!context) {
    throw new Error("useFilterState must be used within a FilterStateProvider");
  }
  return context;
}

export function FilterMenu() {
  const state = useFilterState();

  const booleanItems = state.items.filter((item) => item.type === "boolean");

  return (
    <MenuTrigger>
      <Button className="border bg-white rounded px-2 py-1 cursor-pointer">
        Filter
      </Button>
      <Popover className="min-w-[20rem]">
        <Heading className="text-2xl font-bold">Select filter</Heading>
        <Menu
          items={state.items}
          selectionMode="multiple"
          selectedKeys={booleanItems
            .filter((item) => item.current)
            .map((item) => item.id)}
          onSelectionChange={(selection) => {
            if (selection === "all") {
              throw new Error("All selection not supported");
            }
            booleanItems.forEach((item) => {
              state.set(item.id, selection.has(item.id));
            });
          }}
        >
          {(item) => {
            switch (item.type) {
              case "boolean":
                return <BooleanItem {...item} />;
              case "single-select":
                return <SingleSelectItem {...item} />;
              case "multi-select":
                return <MultiSelectItem {...item} />;
              default:
                throw new Error(`Unsupported item ${item satisfies never}`);
            }
          }}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}

export function FilterBar() {
  const state = useFilterState();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  return (
    <div className="flex gap-4">
      {state.items.map((item) => {
        switch (item.type) {
          case "boolean": {
            if (!item.current) return null;
            return (
              <div key={item.id} className="flex gap-1">
                {item.label}
                <Button
                  className="cursor-pointer"
                  onPress={() => state.set(item.id, false)}
                >
                  ✕
                </Button>
              </div>
            );
          }
          case "single-select": {
            if (!item.current) return null;
            const selectedOption = item.options.find(
              (option) => option.id === item.current,
            );
            if (!selectedOption) return null;
            return (
              <div key={item.id} className="flex gap-1">
                <MenuTrigger>
                  <Button className="cursor-pointer">
                    {item.label}: {selectedOption.label}
                  </Button>
                  <SingleSelectPopover {...item} standalone />
                </MenuTrigger>
                <Button
                  className="cursor-pointer"
                  onPress={() => state.set(item.id, null)}
                >
                  ✕
                </Button>
              </div>
            );
          }
          case "multi-select": {
            if (menuOpen !== item.id && item.current.length === 0) return null;
            return (
              <div key={item.id} className="flex gap-1">
                <MenuTrigger
                  onOpenChange={(isOpen) =>
                    setMenuOpen(isOpen ? item.id : null)
                  }
                >
                  <Button className="cursor-pointer">
                    {item.label}: <Tag>{item.current.length}</Tag> selected
                  </Button>
                  <MultiSelectPopover {...item} />
                </MenuTrigger>
                <Button
                  className="cursor-pointer"
                  onPress={() => state.set(item.id, [])}
                >
                  ✕
                </Button>
              </div>
            );
          }
          default:
            throw new Error(`Unsupported item ${item satisfies never}`);
        }
      })}
    </div>
  );
}

function BooleanItem({ id, label }: FilterItem<BooleanFilter>) {
  return (
    <MenuItem id={id} closeOnSelect={false}>
      {label}
    </MenuItem>
  );
}

function SingleSelectItem(props: FilterItem<SingleSelectFilter>) {
  const selectedOption = props.options.find(
    (option) => option.id === props.current,
  );

  return (
    <SubmenuTrigger>
      <MenuItem id={props.id}>
        <div className="flex items-center w-full">
          {props.label}
          <span className="ml-auto">{selectedOption?.label}</span>
        </div>
      </MenuItem>
      <SingleSelectPopover {...props} standalone={false} />
    </SubmenuTrigger>
  );
}

function SingleSelectPopover(
  props: FilterItem<SingleSelectFilter> & { standalone: boolean },
) {
  const state = useFilterState();

  return (
    <Popover className="min-w-[10rem]">
      <Menu
        selectionMode="single"
        escapeKeyBehavior="none"
        items={props.options}
        selectedKeys={props.current ? [props.current] : []}
        onSelectionChange={(selection) => {
          if (selection === "all") {
            throw new Error("All selection not supported");
          }
          if (selection.size > 1) {
            throw new Error("Multi selection not supported");
          }
          state.set(props.id, [...selection].at(0)?.toString() ?? null);
        }}
      >
        {(item) => (
          <MenuItem id={item.id} closeOnSelect={props.standalone}>
            {item.label}
          </MenuItem>
        )}
      </Menu>
    </Popover>
  );
}

function MultiSelectItem(props: FilterItem<MultiSelectFilter>) {
  return (
    <SubmenuTrigger>
      <MenuItem id={props.id}>
        <div className="flex items-center w-full">
          {props.label}
          <Tag className="ml-auto">{props.current.length}</Tag>
        </div>
      </MenuItem>
      <MultiSelectPopover {...props} />
    </SubmenuTrigger>
  );
}

function MultiSelectPopover({
  id,
  options,
  current,
}: FilterItem<MultiSelectFilter>) {
  const state = useFilterState();
  const { contains } = useFilter({ sensitivity: "base" });

  return (
    <Popover className="min-w-[10rem]">
      <Autocomplete filter={contains}>
        <SearchField autoFocus aria-label="Search" className="relative group">
          <Input className="pl-1 pr-6" />
          <Button className="group-data-empty:hidden absolute right-2 cursor-pointer">
            ✕
          </Button>
        </SearchField>
        <Menu
          selectionMode="multiple"
          escapeKeyBehavior="none"
          selectedKeys={current}
          onSelectionChange={(selection) => {
            if (selection === "all") {
              throw new Error("All selection not supported");
            }
            state.set(
              id,
              [...selection].map((id) => id.toString()),
            );
          }}
          items={options}
        >
          {(item) => (
            <MenuItem id={item.id} closeOnSelect={false}>
              {item.label}
            </MenuItem>
          )}
        </Menu>
      </Autocomplete>
    </Popover>
  );
}

function Tag({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "border rounded leading-4 px-1 min-w-[2ch] text-center",
        className,
      )}
    >
      {children}
    </span>
  );
}
