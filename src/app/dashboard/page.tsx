"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { ApiError, listBonds } from "@/lib/api";
import {
  enrichBond,
  type Bond,
  type BondAlert,
  type BondStatus,
} from "@/lib/bonds";
import { Building2, Calendar, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function statusClass(status: BondStatus) {
  switch (status) {
    case "VENCIDA":
      return "bg-red-500/20 text-red-300";
    case "CRITICO":
      return "bg-orange-500/20 text-orange-300";
    case "POR_VENCER":
      return "bg-amber-500/20 text-amber-300";
    default:
      return "bg-emerald-500/20 text-emerald-300";
  }
}

function statusLabel(status: BondStatus) {
  switch (status) {
    case "POR_VENCER":
      return "POR VENCER";
    case "CRITICO":
      return "CRÍTICO";
    default:
      return status;
  }
}

function daysText(daysLeft: number) {
  if (daysLeft < 0) return `Venció hace ${Math.abs(daysLeft)} d`;
  if (daysLeft === 0) return "Vence hoy";
  if (daysLeft === 1) return "1 día";
  return `${daysLeft} días`;
}

function BondCards({ rows }: { rows: BondAlert[] }) {
  return (
    <div className="flex flex-col gap-4 lg:hidden">
      {rows.map((item) => (
        <div
          key={item.id}
          className="bg-white/5 border border-white/10 rounded-2xl p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold leading-tight">{item.razonSocial}</h3>
              <p className="text-xs text-gray-400 mt-1">{item.documento}</p>
            </div>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${statusClass(item.status)}`}
            >
              {statusLabel(item.status)}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Building2 size={15} />
              {item.entidadFinanciera}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck size={15} />
              {item.carta}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={15} />
              {item.vigenciaDel} → {item.vigenciaAl}
            </div>
            <p className="text-sm font-mono text-amber-200/90">
              {daysText(item.daysLeft)}
            </p>
            <div>
              <p className="text-xs text-gray-400">Importe</p>
              <p className="font-semibold">{item.importe}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BondTable({
  rows,
  showOwner,
}: {
  rows: BondAlert[];
  showOwner?: boolean;
}) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-white/10">
            {showOwner && <th className="py-4 pr-4">Usuario</th>}
            <th className="py-4 pr-4">Empresa</th>
            <th className="py-4 pr-4">Entidad</th>
            <th className="py-4 pr-4">N°</th>
            <th className="py-4 pr-4">Vigencia</th>
            <th className="py-4 pr-4">Restante</th>
            <th className="py-4 pr-4">Importe</th>
            <th className="py-4">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr
              key={item.id}
              className="border-b border-white/5 hover:bg-white/5 transition"
            >
              {showOwner && (
                <td className="pr-4 text-xs text-emerald-200/90">
                  {item.ownerName || "Sin propietario"}
                </td>
              )}
              <td className="py-4 pr-4">
                <p className="font-medium">{item.razonSocial}</p>
                <p className="text-xs text-gray-400 mt-1">{item.documento}</p>
              </td>
              <td className="pr-4">{item.entidadFinanciera}</td>
              <td className="pr-4 font-mono text-xs">{item.carta}</td>
              <td className="pr-4">
                {item.vigenciaDel} – {item.vigenciaAl}
              </td>
              <td className="pr-4 font-mono text-xs">
                {daysText(item.daysLeft)}
              </td>
              <td className="pr-4 font-medium">{item.importe}</td>
              <td className="pr-4">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${statusClass(item.status)}`}
                >
                  {statusLabel(item.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DashboardContent() {
  const { token, isAdmin } = useAuth();
  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBonds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listBonds(token);
      setBonds(data as Bond[]);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "No se pudo cargar el inventario",
      );
      setBonds([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadBonds();
    const onUpdate = () => {
      void loadBonds();
    };
    window.addEventListener("cfm-bonds-updated", onUpdate);
    window.addEventListener("focus", onUpdate);
    return () => {
      window.removeEventListener("cfm-bonds-updated", onUpdate);
      window.removeEventListener("focus", onUpdate);
    };
  }, [loadBonds]);

  const enriched = useMemo(() => bonds.map(enrichBond), [bonds]);

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of enriched) {
      const id = b.ownerUserId || "__none__";
      const name = b.ownerName || "Sin propietario";
      if (!map.has(id)) map.set(id, name);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
  }, [enriched]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (isAdmin && ownerFilter !== "all") {
      list = list.filter(
        (item) => (item.ownerUserId || "__none__") === ownerFilter,
      );
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.razonSocial.toLowerCase().includes(q) ||
        item.carta.toLowerCase().includes(q) ||
        item.documento.toLowerCase().includes(q) ||
        (item.ownerName || "").toLowerCase().includes(q),
    );
  }, [enriched, isAdmin, ownerFilter, query]);

  const grouped = useMemo(() => {
    if (!isAdmin) {
      return [{ key: "mine", title: "Mi inventario", rows: filtered }];
    }
    const map = new Map<string, { title: string; rows: BondAlert[] }>();
    for (const item of filtered) {
      const key = item.ownerUserId || "__none__";
      const title = item.ownerName || "Sin propietario";
      const bucket = map.get(key) || { title, rows: [] };
      bucket.rows.push(item);
      map.set(key, bucket);
    }
    return [...map.entries()]
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.title.localeCompare(b.title, "es"));
  }, [filtered, isAdmin]);

  const stats = useMemo(
    () => ({
      total: filtered.length,
      vigentes: filtered.filter((d) => d.status === "VIGENTE").length,
      alerta: filtered.filter(
        (d) => d.status === "POR_VENCER" || d.status === "CRITICO",
      ).length,
      vencidas: filtered.filter((d) => d.status === "VENCIDA").length,
    }),
    [filtered],
  );

  return (
    <Layout>
      <div>
        <h1 className="page-title">Custodia</h1>
        <p className="page-sub mb-4">
          {isAdmin
            ? "Vista administrativa · inventario separado por usuario"
            : "Tu inventario personal · recordatorios según lo que registres"}
        </p>

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
            <span>Por vencer</span>
            <strong className="text-amber-300">{stats.alerta}</strong>
          </div>
          <div className="stat-card">
            <span>Vencidas</span>
            <strong className="text-red-300">{stats.vencidas}</strong>
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold">Inventario</h2>
              <p className="text-sm text-[var(--muted)]">
                Cargado en Registro · crítico ≤ 7 días · aviso ≤ 30 días
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              {isAdmin && (
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none w-full sm:w-56 focus:border-emerald-400/40"
                >
                  <option value="all">Todos los usuarios</option>
                  {owners.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar empresa o N°…"
                className="bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none w-full lg:w-72 focus:border-emerald-400/40"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--muted)] py-8 text-center">
              Cargando inventario…
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-[var(--muted)] py-8 text-center">
              Sin registros. Cárgalos en{" "}
              <Link
                href="/registro"
                className="text-emerald-300 hover:underline"
              >
                Registro
              </Link>{" "}
              (manual o Excel) para activar tus recordatorios.
            </p>
          ) : (
            <div className="space-y-8">
              {grouped.map((group) => (
                <section key={group.key}>
                  {isAdmin && (
                    <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-white/10">
                      <h3 className="text-base font-semibold m-0 text-emerald-200">
                        {group.title}
                      </h3>
                      <span className="text-xs text-[var(--muted)]">
                        {group.rows.length} registro
                        {group.rows.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  )}
                  <BondCards rows={group.rows} />
                  <BondTable rows={group.rows} showOwner={false} />
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
