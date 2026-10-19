/** Grafik batang harian tanpa library: tinggi batang = tayangan, batang gelap = pengunjung unik. */
export function TrafficChart({ daily }: { daily: { day: string; views: number; visitors: number }[] }) {
  const max = Math.max(1, ...daily.map((d) => d.views));
  const fmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
  const dense = daily.length > 14;

  return (
    <div>
      <div className="flex h-44 items-end gap-1 sm:gap-1.5" role="img" aria-label="Grafik tayangan harian">
        {daily.map((d) => (
          <div
            key={d.day}
            className="group relative flex h-full flex-1 flex-col justify-end"
            title={`${fmt.format(new Date(`${d.day}T00:00:00Z`))}: ${d.views} tayangan, ${d.visitors} pengunjung`}
          >
            <div className="relative w-full rounded-t bg-brand-100" style={{ height: `${Math.max((d.views / max) * 100, d.views > 0 ? 3 : 0)}%` }}>
              <div
                className="absolute inset-x-0 bottom-0 rounded-t bg-brand-600"
                style={{ height: d.views > 0 ? `${Math.min((d.visitors / d.views) * 100, 100)}%` : 0 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-neutral-400">
        <span>{daily[0] ? fmt.format(new Date(`${daily[0].day}T00:00:00Z`)) : ""}</span>
        {!dense && daily.length > 2 && daily[Math.floor(daily.length / 2)] ? (
          <span>{fmt.format(new Date(`${daily[Math.floor(daily.length / 2)]!.day}T00:00:00Z`))}</span>
        ) : null}
        <span>{daily.at(-1) ? fmt.format(new Date(`${daily.at(-1)!.day}T00:00:00Z`)) : ""}</span>
      </div>
      <p className="mt-3 flex gap-4 text-[11px] text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-100" /> Tayangan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> Pengunjung unik (porsi)
        </span>
      </p>
    </div>
  );
}
