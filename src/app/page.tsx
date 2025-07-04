import { Suspense } from "react";
import {
  FilterSchema,
  FilterBar,
  FilterMenu,
  FilterStateProvider,
} from "../filter";
import { FilterDisplay } from "./client";

const schema = FilterSchema({
  "only-admins": { type: "boolean", label: "Only admins" },
  "planning-unit": {
    type: "multi-select",
    label: "Planning unit",
    options: [
      { id: "1", label: "Planning unit 1" },
      { id: "2", label: "Planning unit 2" },
      { id: "3", label: "Planning unit 3" },
    ],
  },
  "activity-type": {
    type: "single-select",
    label: "Activity type",
    options: [
      { id: "absence", label: "Absence" },
      { id: "break", label: "Break" },
      { id: "illness", label: "Illness" },
    ],
  },
});

export default function Home() {
  return (
    <main className="p-12 flex flex-col gap-4 container mx-auto">
      <Suspense>
        <FilterStateProvider schema={schema}>
          <div className="flex justify-end">
            <FilterMenu />
          </div>
          <FilterBar />
          <hr />
          <FilterDisplay />
        </FilterStateProvider>
      </Suspense>
    </main>
  );
}
