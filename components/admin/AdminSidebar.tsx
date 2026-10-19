"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types/database.types";
import { siteConfig } from "@/lib/config/site";

export interface NavItem {
  label: string;
  href: string;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", roles: ["admin", "editor", "writer"] },
  { label: "Artikel", href: "/admin/articles", roles: ["admin", "editor", "writer"] },
  { label: "Rencana Konten", href: "/admin/plan", roles: ["admin", "editor"] },
  { label: "Trafik", href: "/admin/traffic", roles: ["admin", "editor"] },
  { label: "Kategori", href: "/admin/categories", roles: ["admin", "editor"] },
  { label: "Tag", href: "/admin/tags", roles: ["admin", "editor"] },
  { label: "Penulis", href: "/admin/authors", roles: ["admin", "editor"] },
  { label: "Media", href: "/admin/media", roles: ["admin", "editor", "writer"] },
  { label: "Sumber", href: "/admin/sources", roles: ["admin", "editor"] },
  { label: "Pengguna", href: "/admin/users", roles: ["admin"] },
  { label: "Pengaturan", href: "/admin/settings", roles: ["admin", "editor"] },
];

export function AdminSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-60 shrink-0 border-r border-neutral-200 bg-white md:block">
      <div className="flex h-16 items-center px-6">
        <Link href="/admin" className="text-base font-bold tracking-tight text-neutral-900">
          {siteConfig.name} <span className="text-brand-600">CMS</span>
        </Link>
      </div>
      <nav className="space-y-0.5 px-3">
        {items.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
