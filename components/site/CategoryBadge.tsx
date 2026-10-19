import Link from "next/link";
import { getCategoryStyle } from "@/lib/config/categories";

export function CategoryBadge({ name, slug }: { name: string; slug: string }) {
  const style = getCategoryStyle(slug);
  return (
    <Link
      href={`/${slug}`}
      className={`relative z-10 inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider uppercase hover:underline ${style.text}`}
    >
      <span className={`h-2 w-2 rounded-[2px] ${style.dot}`} aria-hidden />
      {name}
    </Link>
  );
}
