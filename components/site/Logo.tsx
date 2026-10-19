/** Wordmark: TK monogram tile + "TeknoKini". `inverted` for dark backgrounds. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`relative grid h-[30px] w-[30px] place-items-center rounded-[7px] font-mono text-[13px] font-semibold tracking-tighter ${
          inverted ? "bg-white text-ink" : "bg-ink text-white"
        }`}
        aria-hidden
      >
        TK
        <span className="absolute -right-[3px] -bottom-[3px] h-[9px] w-[9px] rounded-[2px] bg-brand-600" />
      </span>
      <span className={`font-display text-[22px] font-extrabold tracking-tight ${inverted ? "text-white" : "text-ink"}`}>
        Tekno<span className="text-brand-500">Kini</span>
      </span>
    </span>
  );
}
