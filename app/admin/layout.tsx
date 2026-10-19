import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeaderBar } from "@/components/admin/AdminHeaderBar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["admin", "editor", "writer"]);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AdminSidebar role={profile.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeaderBar profile={profile} />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
