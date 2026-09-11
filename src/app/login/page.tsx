"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { user, token, ready, logout } = useAuth();
  const [loginId, setLoginId] = useState("10000000");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hostLabel, setHostLabel] = useState("localhost:3050");

  useEffect(() => {
    if (typeof window === "undefined") return;

    setHostLabel(window.location.host);

    const params = new URLSearchParams(window.location.search);
    const reason = params.get("error");
    if (reason === "session") {
      setError("Sesión no válida o expirada. Vuelve a iniciar sesión.");
    }
    if (reason === "auth") {
      setError("DNI/correo o contraseña incorrectos.");
    }
  }, []);

  // Misma regla en localhost e IP: si ya hay sesión → dashboard
  useEffect(() => {
    if (!ready) return;
    if (!(user || token)) return;
    window.location.replace("/dashboard");
  }, [ready, user, token]);

  if (ready && (user || token)) {
    return (
      <div className="shell-loading">
        <div className="pulse-ring" />
        <span>Entrando…</span>
        <script
          dangerouslySetInnerHTML={{
            __html: 'window.location.replace("/dashboard");',
          }}
        />
        <div className="mt-4 flex flex-col items-center gap-2">
          <a href="/dashboard" style={{ color: "#34d399" }}>
            Continuar al dashboard
          </a>
          <button
            type="button"
            className="text-sm text-[var(--muted)] underline"
            onClick={() => logout()}
          >
            Usar otra cuenta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-shell">
      <div className="app-grid-bg" aria-hidden />
      <div className="login-card relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="brand-mark">M</div>
          <div>
            <p className="brand-kicker">Municipalidad de la Molina</p>
            <h1 className="brand-name m-0 text-xl leading-tight">
              Portal de Carta Fianza / Custodia
            </h1>
          </div>
        </div>

        <p className="page-sub mb-6">
          Ingresa con tu DNI o correo institucional.
          <br />
          <span className="text-xs text-[var(--muted)]">
            Acceso: https://{hostLabel}/login
          </span>
        </p>

        {/* Mismo flujo en localhost e IP: POST servidor → cookies → dashboard */}
        <form
          action="/api/web-login"
          method="post"
          className="space-y-4"
          autoComplete="off"
          onSubmit={() => setSubmitting(true)}
        >
          <label className="block text-sm">
            <span className="mb-1.5 block text-[var(--muted)]">
              DNI o correo
            </span>
            <input
              type="text"
              name="login"
              required
              autoComplete="off"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="10000000"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-emerald-400/50"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block text-[var(--muted)]">Contraseña</span>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-emerald-400/50"
            />
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-400/40 bg-red-500/20 px-3 py-2 text-sm font-medium text-red-200"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-[#04110e] transition hover:bg-emerald-300 disabled:opacity-60"
          >
            {submitting ? "Validando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
