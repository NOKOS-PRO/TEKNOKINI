import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Masuk Admin",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="font-[Inter] text-lg font-bold tracking-tight text-neutral-900">
            {siteConfig.name} <span className="text-brand-600">Admin</span>
          </p>
          <p className="mt-1 text-sm text-neutral-500">Masuk untuk mengelola konten.</p>
        </div>
        <LoginForm next={params.next ?? "/admin"} />
      </div>
    </main>
  );
}
