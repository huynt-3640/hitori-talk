interface Correction {
  original: string;
  corrected: string;
  explanation: string;
  type: string;
}

interface CorrectionCardProps {
  corrections: Correction[];
}

export function CorrectionCard({ corrections }: CorrectionCardProps) {
  if (!corrections || corrections.length === 0) return null;

  return (
    <div className="space-y-2">
      {corrections.map((c, i) => (
        <div
          key={i}
          className="rounded-xl border border-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.08)] p-3 text-sm md:p-4 md:text-base"
        >
          <p className="mb-1 text-xs font-semibold text-destructive md:mb-2 md:text-sm">
            ✏️ Correction
          </p>
          <div>
            <span className="text-foreground-secondary line-through">{c.original}</span>
            <span className="mx-2 text-foreground-secondary">→</span>
            <span className="font-medium text-success">{c.corrected}</span>
          </div>
          {c.explanation && (
            <p className="mt-1 text-xs text-foreground-secondary md:mt-2 md:text-sm">
              {c.explanation}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
