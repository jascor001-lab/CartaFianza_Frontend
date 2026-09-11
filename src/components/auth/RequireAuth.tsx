"use client";

import { useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import type { AuthUser } from "@/lib/api";
import { TOKEN_KEY, USER_KEY } from "@/lib/session-keys";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`,
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function readCookieUser(): AuthUser | null {
  const raw = readCookie(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    try {
      return JSON.parse(decodeURIComponent(raw)) as AuthUser;
    } catch {
      return null;
    }
  }
}

export function RequireAuth({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, token, ready, isAdmin } = useAuth();

  const cookieToken = useMemo(
    () => (typeof window !== "undefined" ? readCookie(TOKEN_KEY) : null),
    [],
  );
  const cookieUser = useMemo(
    () => (typeof window !== "undefined" ? readCookieUser() : null),
    [],
  );

  const effectiveUser = user || cookieUser;
  const effectiveToken = token || cookieToken;
  const effectiveAdmin = effectiveUser?.role === "admin";

  useEffect(() => {
    if (!ready) return;
    if (!effectiveUser && !effectiveToken) {
      window.location.replace("/login?error=session");
      return;
    }
    if (adminOnly && effectiveUser && !effectiveAdmin) {
      window.location.replace("/dashboard");
    }
  }, [effectiveUser, effectiveToken, ready, effectiveAdmin, adminOnly]);

  if (effectiveUser && (!adminOnly || effectiveAdmin)) {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <div className="shell-loading">
        <div className="pulse-ring" />
        <span>Inicializando sesión</span>
      </div>
    );
  }

  if (!effectiveToken) {
    return (
      <div className="shell-loading">
        <div className="pulse-ring" />
        <span>Redirigiendo…</span>
        <meta httpEquiv="refresh" content="0;url=/login?error=session" />
      </div>
    );
  }

  // Token sin user parseable: igual dejamos pasar al dashboard
  if (!adminOnly) {
    return <>{children}</>;
  }

  return (
    <div className="shell-loading">
      <div className="pulse-ring" />
      <span>Cargando sesión…</span>
    </div>
  );
}
