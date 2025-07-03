import { Suspense } from "react";
import { FilterBar, FilterDisplay, FilterMenu } from "../components/filter";

export default function Home() {
  return (
    <main className="p-12 flex flex-col gap-4 container mx-auto">
      <Suspense>
        <div className="flex justify-end">
          <FilterMenu />
        </div>
        <FilterBar />
        <hr />
        <FilterDisplay />
      </Suspense>
    </main>
  );
}
