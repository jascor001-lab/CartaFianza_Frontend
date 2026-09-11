"use client";

import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="login-shell">
      <div className="app-grid-bg" aria-hidden />
      <div className="login-card relative z-10 text-center">
        <div className="brand-mark mx-auto mb-4">M</div>
        <h1 className="page-title">Sin conexión</h1>
        <p className="page-sub mt-2 mb-6">
          Custodia Molina no puede alcanzar el servidor ahora. Revisa tu red e
          intenta de nuevo.
        </p>
        <Link
          href="/login"
          className="inline-flex rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-[#04110e]"
        >
          Reintentar
        </Link>
      </div>
    </div>
  );
}
