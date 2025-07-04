"use client";

import {
  Popover as AriaPopover,
  PopoverProps,
  MenuItem as AriaMenuItem,
  MenuItemProps as AriaMenuItemProps,
} from "react-aria-components";
import { cx } from "class-variance-authority";

export * from "react-aria-components";

export function Popover(props: PopoverProps) {
  return (
    <AriaPopover
      {...props}
      className={(values) =>
        cx(
          "border bg-white rounded p-4 flex flex-col gap-3",
          typeof props.className === "function"
            ? props.className(values)
            : props.className,
        )
      }
    />
  );
}

export interface MenuItemProps<T extends object> extends AriaMenuItemProps<T> {
  // Missing in react-aria-components, see https://github.com/adobe/react-spectrum/issues/8208#issuecomment-2864752401
  closeOnSelect?: boolean;
}

export function MenuItem<T extends object>(props: MenuItemProps<T>) {
  return (
    <AriaMenuItem
      textValue={
        typeof props.children === "string" ? props.children : undefined
      }
      {...props}
      className={(values) =>
        cx(
          "hover:bg-gray-200 data-focused:bg-gray-200 px-1 cursor-pointer flex items-center gap-1 data-open:bg-gray-100",
          typeof props.className === "function"
            ? props.className(values)
            : props.className,
        )
      }
    >
      {(values) => (
        <>
          {typeof props.children === "function"
            ? props.children(values)
            : props.children}
          <span className="flex items-center gap-1 ml-auto">
            {values.isSelected && "✓"}
            {values.hasSubmenu && (
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
          </span>
        </>
      )}
    </AriaMenuItem>
  );
}
