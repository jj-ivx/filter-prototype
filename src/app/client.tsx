"use client";

import { useFilterState } from "../filter";

export function FilterDisplay() {
  const state = useFilterState();

  return (
    <pre>
      {JSON.stringify(
        state.items.reduce(
          (acc, item) => ({ ...acc, [item.id]: item.current }),
          {},
        ),
        null,
        2,
      )}
    </pre>
  );
}
