"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Autocomplete,
  Button,
  Heading,
  Input,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover as AriaPopover,
  PopoverProps,
  SearchField,
  SubmenuTrigger,
  useFilter,
  MenuItemProps,
} from "react-aria-components";

const types = [
  { id: "absence", name: "Absence" },
  { id: "break", name: "Break" },
  { id: "illness", name: "Illness" },
];

interface FilterState {
  values: {
    "only-admins": boolean;
    "planning-unit": string[];
    "activity-type": string | null;
  };
  set<K extends keyof this["values"]>(key: K, value: this["values"][K]): void;
}

function useFilterState(): FilterState {
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

  return {
    values: {
      "only-admins": searchParams.get("only-admins") != null,
      "planning-unit": searchParams.getAll("planning-unit"),
      "activity-type": searchParams.get("activity-type"),
    },
    set(key, value) {
      router.replace(pathname + "?" + createQueryString(key, value));
    },
  };
}

export function FilterMenu() {
  const state = useFilterState();

  return (
    <MenuTrigger>
      <Button className="border bg-white rounded px-2 py-1 cursor-pointer">
        Filter
      </Button>
      <Popover className="min-w-[20rem]">
        <Heading className="text-2xl font-bold">Select filter</Heading>
        <Menu
          selectionMode="multiple"
          selectedKeys={state.values["only-admins"] ? ["only-admins"] : []}
          onSelectionChange={(selection) => {
            if (selection === "all") {
              throw new Error("All selection not supported");
            }
            state.set("only-admins", selection.has("only-admins"));
          }}
        >
          <Item id="only-admins">Only admins</Item>
          <SubmenuTrigger>
            <SubmenuItem
              id="planning-unit"
              selectedCount={state.values["planning-unit"].length}
            >
              Planning units
            </SubmenuItem>
            <PlanningUnitPopover />
          </SubmenuTrigger>
          <SubmenuTrigger>
            <SubmenuItem2
              id="activity-type"
              selectedItemName={
                types.find((type) => type.id === state.values["activity-type"])
                  ?.name
              }
            >
              Activity type
            </SubmenuItem2>
            <ActivityTypePopover standalone={false} />
          </SubmenuTrigger>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}

export function FilterBar() {
  const state = useFilterState();
  const [menuOpen, setMenuOpen] = useState<"planning-unit" | null>(null);

  return (
    <div className="flex gap-4">
      {state.values["only-admins"] && (
        <div className="flex gap-1">
          Only admins
          <Button
            className="cursor-pointer"
            onPress={() => state.set("only-admins", false)}
          >
            ✕
          </Button>
        </div>
      )}
      {(menuOpen === "planning-unit" ||
        state.values["planning-unit"].length > 0) && (
        <div className="flex gap-1">
          <MenuTrigger
            onOpenChange={(isOpen) =>
              setMenuOpen(isOpen ? "planning-unit" : null)
            }
          >
            <Button className="cursor-pointer">
              Planning units: {state.values["planning-unit"].length} selected
            </Button>
            <PlanningUnitPopover />
          </MenuTrigger>
          <Button
            className="cursor-pointer"
            onPress={() => state.set("planning-unit", [])}
          >
            ✕
          </Button>
        </div>
      )}
      {state.values["activity-type"] && (
        <div className="flex gap-1">
          <MenuTrigger>
            <Button className="cursor-pointer">
              Activity type:{" "}
              {
                types.find((type) => type.id === state.values["activity-type"])
                  ?.name
              }
            </Button>
            <ActivityTypePopover standalone />
          </MenuTrigger>
          <Button
            className="cursor-pointer"
            onPress={() => state.set("activity-type", null)}
          >
            ✕
          </Button>
        </div>
      )}
    </div>
  );
}

export function FilterDisplay() {
  const state = useFilterState();

  return <pre>{JSON.stringify(state.values, null, 2)}</pre>;
}

function Popover(props: PopoverProps) {
  return (
    <AriaPopover
      {...props}
      className={(values) =>
        `border bg-white rounded p-4 flex flex-col gap-3 ${
          typeof props.className === "function"
            ? props.className(values)
            : props.className
        }`
      }
    />
  );
}

function PlanningUnitPopover() {
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
          selectedKeys={state.values["planning-unit"]}
          onSelectionChange={(selection) => {
            if (selection === "all") {
              throw new Error("All selection not supported");
            }
            state.set(
              "planning-unit",
              [...selection].map((id) => id.toString()),
            );
          }}
        >
          <Item id="1" closeOnSelect={false}>
            Planning unit 1
          </Item>
          <Item id="2" closeOnSelect={false}>
            Planning unit 2
          </Item>
          <Item id="3" closeOnSelect={false}>
            Planning unit 3
          </Item>
        </Menu>
      </Autocomplete>
    </Popover>
  );
}

function ActivityTypePopover({ standalone }: { standalone: boolean }) {
  const state = useFilterState();

  return (
    <Popover className="min-w-[10rem]">
      <Menu
        selectionMode="single"
        escapeKeyBehavior="none"
        selectedKeys={
          state.values["activity-type"] ? [state.values["activity-type"]] : []
        }
        onSelectionChange={(selection) => {
          if (selection === "all") {
            throw new Error("All selection not supported");
          }
          if (selection.size > 1) {
            throw new Error("Multi selection not supported");
          }
          state.set("activity-type", [...selection].at(0)?.toString() ?? null);
        }}
        items={types}
      >
        {(item) => (
          <Item id={item.id} closeOnSelect={standalone}>
            {item.name}
          </Item>
        )}
      </Menu>
    </Popover>
  );
}

function SubmenuItem<T extends object>({
  selectedCount,
  ...props
}: MenuItemProps<T> & { selectedCount: number }) {
  return (
    <Item {...props}>
      {(values) => (
        <>
          {typeof props.children === "function"
            ? props.children(values)
            : props.children}
          <span className="ml-auto border rounded leading-4 px-1 w-[2ch] text-center">
            {selectedCount}
          </span>
          {values.hasSubmenu && (
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6" />
            </svg>
          )}
        </>
      )}
    </Item>
  );
}

function SubmenuItem2<T extends object>({
  selectedItemName,
  ...props
}: MenuItemProps<T> & { selectedItemName: string | undefined }) {
  return (
    <Item {...props}>
      {(values) => (
        <>
          {typeof props.children === "function"
            ? props.children(values)
            : props.children}
          <span className="ml-auto">{selectedItemName}</span>
          {values.hasSubmenu && (
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6" />
            </svg>
          )}
        </>
      )}
    </Item>
  );
}

function Item<T extends object>(
  props: MenuItemProps<T> & { closeOnSelect?: boolean },
) {
  return (
    <MenuItem
      className="hover:bg-gray-200 data-focused:bg-gray-200 px-1 cursor-pointer flex items-center gap-1 data-open:bg-gray-100"
      textValue={
        typeof props.children === "string" ? props.children : undefined
      }
      {...props}
    >
      {(values) => (
        <>
          {typeof props.children === "function"
            ? props.children(values)
            : props.children}
          {values.isSelected && <span className="ml-auto">✓</span>}
        </>
      )}
    </MenuItem>
  );
}
