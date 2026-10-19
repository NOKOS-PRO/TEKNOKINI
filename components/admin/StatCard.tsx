export function StatCard({ label, value, tone }: { label: string; value: number; tone?: "brand" | "neutral" }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${tone === "brand" ? "text-brand-600" : "text-neutral-900"}`}>
        {value.toLocaleString("id-ID")}
      </p>
    </div>
  );
}
