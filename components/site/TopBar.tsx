import { siteConfig } from "@/lib/config/site";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

/** Thin dark strip above the header: today's date (WIB) and the tagline. */
export function TopBar() {
  return (
    <div className="bg-band font-mono text-[11px] text-band-muted">
      <div className="mx-auto flex h-8 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <span className="flex items-center gap-2 text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
          {dateFormatter.format(new Date())}
        </span>
        <span className="hidden md:inline">{siteConfig.tagline}</span>
      </div>
    </div>
  );
}
