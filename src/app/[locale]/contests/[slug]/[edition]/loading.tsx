/**
 * Scoreboard loading skeleton - the full table (~500 rows) is server-rendered
 * for SEO, so navigation shows this shimmer until the HTML streams in.
 * Geometry mirrors the real Scoreboard in page.tsx (column widths, paddings,
 * 32px avatar circles, breakout width) so the swap is layout-stable.
 */
const PROBLEM_COLS = 12
const ROWS = 15
// Same formula as Scoreboard: fixed cols + team min 18 + 3.25 per problem.
const minRem = 30 + PROBLEM_COLS * 3.25
const width = `clamp(100%, ${minRem}rem, 100vw - 3rem)`

function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-wash ${className}`} />
}

export default function EditionLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="motion-reduce:animate-none"
    >
      <div className="animate-pulse motion-reduce:animate-none">
        <Bar className="h-3 w-28" />
        <Bar className="mt-1.5 h-9 w-80 max-w-full" />
        <div className="mt-3 flex gap-5">
          <Bar className="h-5 w-36" />
          <Bar className="h-5 w-48" />
        </div>

        <div
          aria-hidden="true"
          className="mt-7 overflow-x-auto"
          style={{ width, marginInline: `calc((100% - ${width}) / 2)` }}
        >
          <table
            className="w-full table-fixed border-collapse"
            style={{ minWidth: `${minRem}rem` }}
          >
            <thead>
              <tr>
                <th className="w-12 border-b border-line-strong px-3.5 py-2.5">
                  <Bar className="h-3 w-4" />
                </th>
                <th className="border-b border-line-strong px-3.5 py-2.5">
                  <Bar className="h-3 w-16" />
                </th>
                <th className="w-16 border-b border-line-strong px-3.5 py-2.5">
                  <Bar className="mx-auto h-3 w-8" />
                </th>
                <th className="w-20 border-b border-line-strong px-3.5 py-2.5">
                  <Bar className="mx-auto h-3 w-10" />
                </th>
                {Array.from({ length: PROBLEM_COLS }, (_, i) => (
                  <th
                    key={i}
                    className="w-[3.25rem] border-b border-line-strong px-3.5 py-2.5"
                  >
                    <Bar className="mx-auto h-3 w-3" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }, (_, i) => (
                <tr key={i}>
                  <td className="border-b border-line px-3 py-2.5">
                    <Bar className="mx-auto h-4 w-6" />
                  </td>
                  <td className="border-b border-line px-3 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <div className="size-8 shrink-0 rounded-full bg-wash" />
                      <div className="size-8 shrink-0 rounded-full bg-wash" />
                      <span className="min-w-0 flex-1">
                        <Bar className="h-3.5 w-2/3" />
                        <Bar className="mt-1 h-2.5 w-1/2" />
                      </span>
                    </span>
                  </td>
                  <td className="border-b border-line px-3 py-2.5">
                    <Bar className="mx-auto h-4 w-8" />
                  </td>
                  <td className="border-b border-line px-3 py-2.5">
                    <Bar className="mx-auto h-4 w-10" />
                  </td>
                  {Array.from({ length: PROBLEM_COLS }, (_, j) => (
                    <td key={j} className="border-b border-line px-1 py-1">
                      <Bar className="h-8" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}
