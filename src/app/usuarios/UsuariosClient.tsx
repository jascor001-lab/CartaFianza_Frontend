"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import {
  ApiError,
  createUser,
  listUsers,
  updateUser,
  type AuthUser,
  type UserRole,
} from "@/lib/api";
import { TOKEN_KEY } from "@/lib/session-keys";

type FormState = {
  name: string;
  email: string;
  dni: string;
  password: string;
  role: UserRole;
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  dni: "",
  password: "",
  role: "user",
  active: true,
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`,
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function resolveToken(authToken: string | null): string | null {
  if (authToken) return authToken;
  try {
    return localStorage.getItem(TOKEN_KEY) || readCookie(TOKEN_KEY);
  } catch {
    return readCookie(TOKEN_KEY);
  }
}

export function UsuariosClient({
  initialUsers = [],
}: {
  initialUsers?: AuthUser[];
}) {
  const { token: authToken } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>(initialUsers);
  const [loading, setLoading] = useState(initialUsers.length === 0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const loadUsers = useCallback(async () => {
    const token = resolveToken(authToken);
    setLoading(true);
    setError("");
    try {
      // Cookie de sesión basta en /api/web-users (localhost e IP)
      setUsers(await listUsers(token));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo cargar usuarios (¿API en :4006?)",
      );
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  function startEdit(user: AuthUser) {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      dni: user.dni ?? "",
      password: "",
      role: user.role,
      active: user.active,
    });
    setError("");
    setSuccess("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = resolveToken(authToken);
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (editingId) {
        await updateUser(token, editingId, {
          name: form.name.trim(),
          email: form.email.trim(),
          dni: form.dni.trim(),
          role: form.role,
          active: form.active,
          ...(form.password.trim() ? { password: form.password } : {}),
        });
        setSuccess("Usuario actualizado en el backend");
      } else {
        if (form.password.trim().length < 6) {
          throw new ApiError("La contraseña debe tener al menos 6 caracteres", 400);
        }
        await createUser(token, {
          name: form.name.trim(),
          email: form.email.trim(),
          dni: form.dni.trim(),
          password: form.password,
          role: form.role,
        });
        setSuccess("Usuario creado en el backend");
        setForm(emptyForm);
        setEditingId(null);
      }
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : editingId
            ? "No se pudo actualizar el usuario"
            : "No se pudo crear el usuario",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="page-title">Accesos</h1>
        <p className="page-sub">Alta, edición y roles de cuentas del sistema</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={onSubmit} className="panel p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold m-0">
              {editingId ? "Editar acceso" : "Nuevo acceso"}
            </h2>
            {editingId && (
              <button
                type="button"
                className="text-xs text-emerald-300 hover:underline"
                onClick={startCreate}
              >
                Nuevo
              </button>
            )}
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-white/70">Nombre</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-white/70">DNI</span>
            <input
              required
              inputMode="numeric"
              pattern="\d{8,12}"
              title="Entre 8 y 12 dígitos"
              value={form.dni}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  dni: e.target.value.replace(/\D/g, "").slice(0, 12),
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-white/70">Correo</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-white/70">
              Contraseña{editingId ? " (opcional)" : ""}
            </span>
            <input
              type="password"
              required={!editingId}
              minLength={editingId ? undefined : 6}
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              placeholder={editingId ? "Dejar vacío para no cambiar" : ""}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-white/70">Rol</span>
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as UserRole }))
              }
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 outline-none"
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </label>

          {editingId && (
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
              />
              Cuenta activa
            </label>
          )}

          {error && (
            <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-[#04110e] hover:bg-emerald-400 disabled:opacity-60"
          >
            {submitting
              ? "Guardando…"
              : editingId
                ? "Guardar cambios"
                : "Crear usuario"}
          </button>
        </form>

        <div className="panel p-5 overflow-x-auto">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold m-0">Cuentas activas</h2>
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
            >
              Actualizar
            </button>
          </div>
          {loading && users.length === 0 ? (
            <p className="text-white/60">Cargando…</p>
          ) : users.length === 0 ? (
            <p className="text-white/60">
              {error || "No hay usuarios para mostrar."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="py-3 pr-3">Nombre</th>
                  <th className="py-3 pr-3">DNI</th>
                  <th className="py-3 pr-3">Correo</th>
                  <th className="py-3 pr-3">Rol</th>
                  <th className="py-3 pr-3">Estado</th>
                  <th className="py-3">Editar</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5">
                    <td className="py-3 pr-3 font-medium">{u.name}</td>
                    <td className="pr-3 font-mono text-xs">{u.dni}</td>
                    <td className="pr-3 text-white/80">{u.email}</td>
                    <td className="pr-3">
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">
                        {u.role}
                      </span>
                    </td>
                    <td className="pr-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          u.active
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {u.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => startEdit(u)}
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {error && users.length > 0 ? (
            <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
