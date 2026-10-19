"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "@/lib/config/site";
import { getCategoryStyle } from "@/lib/config/categories";
import { Logo } from "./Logo";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="TeknoKini, ke beranda">
          <Logo />
        </Link>

        <nav aria-label="Kategori" className="ml-3 hidden items-center gap-0.5 md:flex">
          {primaryNav.map((item) => {
            const slug = item.href.slice(1);
            const style = getCategoryStyle(slug);
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  active ? "bg-paper text-ink" : "text-ink-soft hover:bg-paper hover:text-ink"
                }`}
              >
                {item.href !== "/" && <span className={`h-[7px] w-[7px] rounded-[2px] ${style.dot}`} aria-hidden />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/search"
            className="flex h-[38px] items-center gap-2.5 rounded-lg border border-line bg-paper px-3 text-[13px] text-ink-soft hover:border-brand-500 hover:text-ink"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="hidden sm:inline">Cari artikel</span>
            <span className="sr-only sm:hidden">Cari artikel</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="grid h-[38px] w-[38px] place-items-center rounded-lg border border-line bg-paper text-ink-soft md:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              {open ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Kategori" className="border-t border-line px-4 py-2 md:hidden">
          {primaryNav.map((item) => {
            const style = getCategoryStyle(item.href.slice(1));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-semibold text-ink hover:bg-paper"
              >
                {item.href !== "/" && <span className={`h-2 w-2 rounded-[2px] ${style.dot}`} aria-hidden />}
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
