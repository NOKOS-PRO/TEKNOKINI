"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { NAV_ITEMS } from "./AdminSidebar";
import type { Profile } from "@/types/database.types";

const ROLE_LABEL: Record<Profile["role"], string> = {
  admin: "Admin",
  editor: "Editor",
  writer: "Penulis",
};

export function AdminHeaderBar({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(profile.role));

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 md:hidden"
          aria-label="Buka menu"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            ) : (
              <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
            )}
          </svg>
        </button>

        <div className="hidden text-sm text-neutral-400 md:block">
          Masuk sebagai <span className="font-medium text-neutral-700">{ROLE_LABEL[profile.role]}</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/" target="_blank" className="hidden text-sm font-medium text-neutral-500 hover:text-brand-600 sm:block">
            Lihat situs ↗
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {profile.display_name.slice(0, 2).toUpperCase()}
            </div>
            <span className="hidden text-sm font-medium text-neutral-700 sm:block">
              {profile.display_name}
            </span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Keluar
            </button>
          </form>
        </div>
      </div>

      {open && (
        <nav className="border-t border-neutral-200 px-4 py-2 md:hidden">
          {items.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                  active ? "bg-brand-50 text-brand-700" : "text-neutral-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
