import type { ContributionWithAuthor, Section } from "@/types";
import { SECTIONS, SECTION_LABELS } from "@/types";
import { ContributionCard } from "@/components/ContributionCard";
import { EmptyState } from "@/components/ui/EmptyState";

function groupBySection(
  contributions: ContributionWithAuthor[],
): Record<Section, ContributionWithAuthor[]> {
  const grouped: Record<Section, ContributionWithAuthor[]> = {
    quotidiani: [],
    speciali: [],
    rilancio: [],
  };
  for (const c of contributions) grouped[c.section].push(c);
  return grouped;
}

export function DayView({
  contributions,
}: {
  contributions: ContributionWithAuthor[];
}) {
  if (contributions.length === 0) {
    return (
      <EmptyState
        title="Nessun contributo per oggi"
        description="Quando qualcuno scriverà qualcosa apparirà qui."
      />
    );
  }
  const grouped = groupBySection(contributions);
  const visibleSections = SECTIONS.filter((s) => grouped[s].length > 0);

  return (
    <div className="space-y-6">
      {visibleSections.map((section) => (
        <section key={section} aria-labelledby={`sec-${section}`}>
          <h2
            id={`sec-${section}`}
            className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted"
          >
            {SECTION_LABELS[section]}
          </h2>
          <div className="space-y-3">
            {grouped[section].map((c) => (
              <ContributionCard key={c.id} contribution={c} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
