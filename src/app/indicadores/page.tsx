"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { ApiError, listBonds } from "@/lib/api";
import { enrichBond, type Bond } from "@/lib/bonds";
import { toast } from "sonner";

function IndicadoresContent() {
  const { token } = useAuth();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listBonds(token);
        if (!cancelled) setBonds(data as Bond[]);
      } catch (err) {
        if (!cancelled) {
          toast.error(
            err instanceof ApiError
              ? err.message
              : "No se pudieron cargar los indicadores",
          );
          setBonds([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const onUpdate = () => {
      void listBonds(token)
        .then((data) => setBonds(data as Bond[]))
        .catch(() => undefined);
    };
    window.addEventListener("cfm-bonds-updated", onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("cfm-bonds-updated", onUpdate);
    };
  }, [token]);

  const enriched = useMemo(() => bonds.map(enrichBond), [bonds]);

  const stats = useMemo(() => {
    const vigentes = enriched.filter((d) => d.status === "VIGENTE").length;
    const critico = enriched.filter((d) => d.status === "CRITICO").length;
    const porVencer = enriched.filter((d) => d.status === "POR_VENCER").length;
    const vencidas = enriched.filter((d) => d.status === "VENCIDA").length;
    return {
      total: enriched.length,
      vigentes,
      critico,
      porVencer,
      alerta: critico + porVencer,
      vencidas,
    };
  }, [enriched]);

  const byEntity = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of enriched) {
      const key = b.entidadFinanciera || "Sin entidad";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [enriched]);

  return (
    <Layout>
      <div>
        <h1 className="page-title">Indicadores</h1>
        <p className="page-sub mb-6">
          Resumen del inventario importado · mismos datos que Custodia
        </p>

        {loading ? (
          <p className="text-sm text-[var(--muted)]">Cargando indicadores…</p>
        ) : stats.total === 0 ? (
          <div className="panel p-6">
            <p className="text-sm text-[var(--muted)] m-0">
              Aún no hay cartas fianza. Un administrador debe importar el Excel
              en Custodia para alimentar estos indicadores.
            </p>
          </div>
        ) : (
          <>
            <div
              className="stats-row"
              style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
            >
              <div className="stat-card">
                <span>Total</span>
                <strong>{stats.total}</strong>
              </div>
              <div className="stat-card">
                <span>Vigentes</span>
                <strong className="text-emerald-300">{stats.vigentes}</strong>
              </div>
              <div className="stat-card">
                <span>En alerta</span>
                <strong className="text-amber-300">{stats.alerta}</strong>
              </div>
              <div className="stat-card">
                <span>Vencidas</span>
                <strong className="text-red-300">{stats.vencidas}</strong>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="panel p-4">
                <h2 className="text-lg font-semibold mb-4">Estado de vigencia</h2>
                <ul className="space-y-3 text-sm m-0 p-0 list-none">
                  <li className="flex justify-between gap-3">
                    <span>Vigente</span>
                    <strong className="text-emerald-300">{stats.vigentes}</strong>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Por vencer (≤ 30 d)</span>
                    <strong className="text-amber-300">{stats.porVencer}</strong>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Crítico (≤ 7 d)</span>
                    <strong className="text-orange-300">{stats.critico}</strong>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Vencida</span>
                    <strong className="text-red-300">{stats.vencidas}</strong>
                  </li>
                </ul>
              </div>

              <div className="panel p-4">
                <h2 className="text-lg font-semibold mb-4">Por entidad financiera</h2>
                {byEntity.length === 0 ? (
                  <p className="text-sm text-[var(--muted)] m-0">Sin datos</p>
                ) : (
                  <ul className="space-y-3 text-sm m-0 p-0 list-none">
                    {byEntity.map(([name, count]) => (
                      <li key={name} className="flex justify-between gap-3">
                        <span>{name}</span>
                        <strong>{count}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default function IndicadoresPage() {
  return (
    <RequireAuth adminOnly>
      <IndicadoresContent />
    </RequireAuth>
  );
}
