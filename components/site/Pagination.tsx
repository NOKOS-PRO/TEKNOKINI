import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath,
  extraParams = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  extraParams?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const sp = new URLSearchParams(extraParams);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-8">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            p === page ? "bg-brand-600 text-white" : "border border-neutral-200 text-neutral-600"
          }`}
        >
          {p}
        </Link>
      ))}
    </div>
  );
}
