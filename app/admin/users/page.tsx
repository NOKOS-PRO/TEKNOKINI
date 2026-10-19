import { requireRole } from "@/lib/auth/session";
import { listProfiles } from "@/lib/services/users";
import { RoleSelect } from "@/components/admin/RoleSelect";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Pengguna" };

export default async function UsersPage() {
  const me = await requireRole(["admin"]);
  const profiles = await listProfiles();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Pengguna</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Akun baru dibuat lewat Supabase Auth (dashboard atau undangan) dan otomatis mendapat role{" "}
          <code className="rounded bg-neutral-100 px-1">writer</code>. Naikkan role di sini.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Bergabung</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {profiles.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {p.display_name}
                  {p.id === me.id && <span className="ml-2 text-xs text-neutral-400">(Anda)</span>}
                </td>
                <td className="hidden px-4 py-3 text-neutral-500 sm:table-cell">
                  {formatDate(p.created_at)}
                </td>
                <td className="px-4 py-3">
                  <RoleSelect userId={p.id} currentRole={p.role} disabled={p.id === me.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
