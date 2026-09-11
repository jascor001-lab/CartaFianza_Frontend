import { cookies } from "next/headers";
import { UsuariosClient } from "./UsuariosClient";
import type { AuthUser } from "@/lib/api";
import { TOKEN_KEY } from "@/lib/session-keys";
import { RequireAuth } from "@/components/auth/RequireAuth";

const API =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3020";

async function fetchUsersServer(): Promise<AuthUser[] | null> {
  const jar = await cookies();
  const token = jar.get(TOKEN_KEY)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API}/users`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as AuthUser[];
  } catch {
    return null;
  }
}

export default async function UsuariosPage() {
  const initialUsers = (await fetchUsersServer()) ?? [];

  return (
    <RequireAuth adminOnly>
      <UsuariosClient initialUsers={initialUsers} />
    </RequireAuth>
  );
}
