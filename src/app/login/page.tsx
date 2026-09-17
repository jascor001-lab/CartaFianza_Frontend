"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { user, token, ready, logout } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [unlock, setUnlock] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Limpia cualquier valor que el navegador haya autocompletado
    setLoginId("");
    setPassword("");
    const t = window.setTimeout(() => setUnlock(true), 50);

    const params = new URLSearchParams(window.location.search);
    const reason = params.get("error");
    if (reason === "session") {
      setError("Sesión no válida o expirada. Vuelve a iniciar sesión.");
    }
    if (reason === "auth") {
      setError("DNI/correo o contraseña incorrectos.");
    }

    return () => window.clearTimeout(t);
  }, []);

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
        </p>

        {/* Cebos para que el navegador no rellene DNI/contraseña reales */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "-9999px",
            height: 0,
            overflow: "hidden",
          }}
        >
          <input type="text" name="username" tabIndex={-1} autoComplete="username" />
          <input
            type="password"
            name="password_fake"
            tabIndex={-1}
            autoComplete="current-password"
          />
        </div>

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
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              readOnly={!unlock}
              onFocus={() => setUnlock(true)}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder=""
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
              autoComplete="new-password"
              readOnly={!unlock}
              onFocus={() => setUnlock(true)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
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
