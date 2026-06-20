"use client";

import { useMemo, useState } from "react";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { LessonsLearnedByTag } from "@/components/LessonsLearnedByTag";
import { MistakeList } from "@/components/MistakeList";
import {
  buildLabelFilterOptions,
  downloadMistakesCsv,
  filterMistakesByLabel,
} from "@/lib/mistakes-utils";
import type { Mistake, MistakeLabel } from "@/lib/types";

function MistakeLabelChips({
  options,
  selectedLabelFilter,
  onSelect,
}: {
  options: ReturnType<typeof buildLabelFilterOptions>;
  selectedLabelFilter: string | null;
  onSelect: (labelFilter: string | null) => void;
}) {
  const chipClass = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm transition-colors ${
      active
        ? "bg-[var(--color-primary)] text-white"
        : "bg-slate-100 text-slate-700 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
    }`;

  return (
    <ul className="flex flex-wrap gap-2">
      <li>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={chipClass(selectedLabelFilter === null)}
        >
          All
        </button>
      </li>
      {options.map((option) => (
        <li key={option.id}>
          <button
            type="button"
            onClick={() => onSelect(option.id)}
            className={chipClass(selectedLabelFilter === option.id)}
          >
            {option.name}
            <span className="ml-1 opacity-80">({option.count})</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function MistakesExplorer({
  mistakes,
  labels,
  studentName,
  showLessonsColumn = false,
  listTitle = "All mistakes",
}: {
  mistakes: Mistake[];
  labels: MistakeLabel[];
  studentName: string;
  showLessonsColumn?: boolean;
  listTitle?: string;
}) {
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string | null>(
    null
  );

  const labelOptions = useMemo(
    () => buildLabelFilterOptions(labels, mistakes),
    [labels, mistakes]
  );

  const filteredMistakes = useMemo(
    () => filterMistakesByLabel(mistakes, selectedLabelFilter),
    [mistakes, selectedLabelFilter]
  );

  const selectedLabelName =
    selectedLabelFilter === null
      ? null
      : labelOptions.find((option) => option.id === selectedLabelFilter)?.name;

  const filteredTitle = selectedLabelName
    ? `${listTitle}: ${selectedLabelName}`
    : listTitle;

  const filterSummary =
    selectedLabelName ??
    (labelOptions.length > 0 ? "All categories" : "No categories");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {labelOptions.length > 0 ? (
          <CollapsibleSection
            title={`Filter by category · ${filterSummary}`}
            className="min-w-[240px] flex-1"
            defaultOpen={false}
          >
            <MistakeLabelChips
              options={labelOptions}
              selectedLabelFilter={selectedLabelFilter}
              onSelect={setSelectedLabelFilter}
            />
          </CollapsibleSection>
        ) : null}
        {mistakes.length > 0 && (
          <button
            type="button"
            onClick={() => downloadMistakesCsv(mistakes, studentName)}
            className="btn btn-secondary shrink-0 text-sm"
          >
            Export CSV
          </button>
        )}
      </div>

      {showLessonsColumn ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <CollapsibleSection
            title={`${filteredTitle} (${filteredMistakes.length})`}
            defaultOpen={false}
          >
            <MistakeList
              mistakes={filteredMistakes}
              emptyMessage="No mistakes match this category."
            />
          </CollapsibleSection>
          <CollapsibleSection title="Lessons learned" defaultOpen={false}>
            <LessonsLearnedByTag
              mistakes={mistakes}
              selectedLabelFilter={selectedLabelFilter}
              onLabelSelect={setSelectedLabelFilter}
            />
          </CollapsibleSection>
        </div>
      ) : (
        <CollapsibleSection
          title={`${filteredTitle} (${filteredMistakes.length})`}
          defaultOpen={false}
        >
          <MistakeList
            mistakes={filteredMistakes}
            emptyMessage="No mistakes match this category."
          />
        </CollapsibleSection>
      )}
    </div>
  );
}
