// Server-rendered HTML/CSS charts for the analytics page. No chart library.
// Colors: a validated two-hue categorical pair (blue, amber: CVD-safe) and a
// single-hue blue ramp for magnitude. The amber is below 3:1 contrast on white,
// so every bar carries a visible number label and charts don't rely on color alone.

const SERIES_BLUE = "#2f6fb0";
const SERIES_AMBER = "#c98a1e";

function percent(value: number | null, digits = 0) {
  return value === null ? "–" : `${(value * 100).toFixed(digits)}%`;
}

// ---------------------------------------------------------------- Bar list (one series)

type BarItem = { label: string; value: number; display?: string; title?: string };

export function BarList({ items, max, ariaLabel }: { items: BarItem[]; max?: number; ariaLabel: string }) {
  const scaleMax = Math.max(max ?? 0, ...items.map((item) => item.value), 1);

  return (
    <ul className="space-y-2" aria-label={ariaLabel}>
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[minmax(7rem,12rem)_1fr] items-center gap-3 text-sm" title={item.title}>
          <span className="truncate text-ink/75">{item.label}</span>
          <span className="flex items-center gap-2">
            <span className="h-3 flex-1 rounded-r bg-ink/5">
              <span
                className="block h-3 rounded-r"
                style={{ width: `${(100 * item.value) / scaleMax}%`, backgroundColor: SERIES_BLUE }}
              />
            </span>
            <span className="w-12 shrink-0 text-right font-semibold tabular-nums text-ink">{item.display ?? item.value}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------- Paired bars (two series, same scale)

type PairedItem = { label: string; first: number; second: number };

export function PairedBars({
  items,
  firstLabel,
  secondLabel,
  ariaLabel
}: {
  items: PairedItem[];
  firstLabel: string;
  secondLabel: string;
  ariaLabel: string;
}) {
  const scaleMax = Math.max(1, ...items.flatMap((item) => [item.first, item.second]));
  const series = [
    { key: "first" as const, label: firstLabel, color: SERIES_BLUE },
    { key: "second" as const, label: secondLabel, color: SERIES_AMBER }
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-ink/70" aria-hidden="true">
        {series.map((entry) => (
          <span key={entry.key} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: entry.color }} />
            {entry.label}
          </span>
        ))}
      </div>
      <ul className="space-y-3" aria-label={ariaLabel}>
        {items.map((item) => (
          <li key={item.label} className="grid grid-cols-[minmax(7rem,12rem)_1fr] items-center gap-3 text-sm">
            <span className="truncate text-ink/75" title={item.label}>
              {item.label}
            </span>
            {/* 2px gap between the two bars keeps them distinct without relying on color. */}
            <span className="space-y-[2px]">
              {series.map((entry) => (
                <span
                  key={entry.key}
                  className="flex items-center gap-2"
                  title={`${item.label}: ${item[entry.key]} ${entry.label.toLowerCase()}`}
                >
                  <span className="h-2.5 flex-1 rounded-r bg-ink/5">
                    <span
                      className="block h-2.5 rounded-r"
                      style={{ width: `${(100 * item[entry.key]) / scaleMax}%`, backgroundColor: entry.color }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-ink">
                    {item[entry.key]}
                    <span className="sr-only"> {entry.label}</span>
                  </span>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------- Heatmap (one-hue ramp)

// Light-to-dark steps of one blue; text flips to white on the darker half.
const RAMP = ["#eef4fa", "#cfe0f1", "#9fc1e3", "#6a9dd1", "#3d79b8", "#255d94"];

function rampColor(value: number, max: number) {
  if (value === 0 || max === 0) return null;
  const index = Math.min(RAMP.length - 1, Math.ceil((value / max) * (RAMP.length - 1)));
  return { background: RAMP[index], text: index >= 3 ? "#ffffff" : "#17201f" };
}

export function Heatmap({
  rows,
  columns,
  counts,
  rowHeading,
  columnHeading
}: {
  rows: string[];
  columns: string[];
  counts: number[][];
  rowHeading: string;
  columnHeading: string;
}) {
  const max = Math.max(0, ...counts.flat());

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-[2px] text-xs">
        <caption className="sr-only">
          {rowHeading} by {columnHeading}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="p-2 text-left font-semibold text-ink/60">
              {rowHeading} ↓ / {columnHeading} →
            </th>
            {columns.map((column) => (
              <th key={column} scope="col" className="max-w-24 p-2 text-left align-bottom font-semibold text-ink/70">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row}>
              <th scope="row" className="whitespace-nowrap p-2 text-left font-semibold text-ink/70">
                {row}
              </th>
              {columns.map((column, columnIndex) => {
                const value = counts[rowIndex][columnIndex];
                const color = rampColor(value, max);
                // Same department on both sides is the diagonal: not cross-department.
                const isSameDepartment = row === column;

                return (
                  <td
                    key={column}
                    title={`${row} → ${column}: ${value} application${value === 1 ? "" : "s"}`}
                    className={`h-9 min-w-12 rounded text-center tabular-nums ${isSameDepartment ? "outline outline-1 outline-ink/30" : ""}`}
                    style={{ backgroundColor: color?.background ?? "#f6f5f1", color: color?.text ?? "#17201f80" }}
                  >
                    {value === 0 ? "·" : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// -------------------------------------------- Recommendation quality (table + bars)

type MethodSummary = {
  method: "semantic" | "keyword" | "hybrid";
  count: number;
  meanPercentile: number | null;
  hitAt1: number | null;
  hitAt3: number | null;
};

const methodLabels: Record<MethodSummary["method"], string> = {
  semantic: "Semantic (meaning only)",
  keyword: "Keyword (exact skills only)",
  hybrid: "Hybrid (shown to users)"
};

export function MethodComparison({ methods }: { methods: MethodSummary[] }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs text-ink/60">
          Average position of the project people actually applied to, among all projects they could have chosen (100% = always
          ranked first; the dashed line at 50% is what random ordering gives).
        </p>
        <ul className="space-y-2" aria-label="Mean percentile rank of applied projects by method">
          {methods.map((method) => (
            <li key={method.method} className="grid grid-cols-[minmax(7rem,14rem)_1fr] items-center gap-3 text-sm">
              <span className="text-ink/75">{methodLabels[method.method]}</span>
              <span className="flex items-center gap-2">
                <span className="relative h-3 flex-1 rounded-r bg-ink/5">
                  <span
                    className="block h-3 rounded-r"
                    style={{ width: `${100 * (method.meanPercentile ?? 0)}%`, backgroundColor: SERIES_BLUE }}
                  />
                  <span className="absolute inset-y-[-3px] left-1/2 border-l border-dashed border-ink/50" aria-hidden="true" />
                </span>
                <span className="w-12 shrink-0 text-right font-semibold tabular-nums text-ink">{percent(method.meanPercentile)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-ink/50">
          <tr>
            <th scope="col" className="py-2 pr-3 font-semibold">Method</th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">Mean rank percentile</th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">Top-1 hit rate</th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">Top-3 hit rate</th>
            <th scope="col" className="py-2 text-right font-semibold">Applications</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {methods.map((method) => (
            <tr key={method.method}>
              <th scope="row" className="py-2 pr-3 font-medium text-ink">{methodLabels[method.method]}</th>
              <td className="py-2 pr-3 text-right tabular-nums">{percent(method.meanPercentile, 1)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{percent(method.hitAt1, 1)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{percent(method.hitAt3, 1)}</td>
              <td className="py-2 text-right tabular-nums">{method.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
