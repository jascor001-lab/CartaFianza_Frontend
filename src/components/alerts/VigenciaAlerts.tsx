"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Clock3, X } from "lucide-react";
import { toast } from "sonner";
import {
  ALERT_CRITICAL_DAYS,
  ALERT_WARNING_DAYS,
  getExpiringBonds,
  todayKey,
  type Bond,
  type BondAlert,
} from "@/lib/bonds";
import { listBonds } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  FORCE_ALERT_EVENT,
  LAST_ALERT_DAY_KEY,
  LOGIN_ALERT_FLAG,
  TOKEN_KEY,
} from "@/lib/session-keys";

const DOCKED_KEY = "cfm_alert_docked";
const CLOSED_ALL_KEY = "cfm_alert_closed_all";

type AlertMode = "center" | "dock" | "hidden";

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

function daysLabel(days: number) {
  if (days < 0) return `venció hace ${Math.abs(days)} d`;
  if (days === 0) return "vence hoy";
  if (days === 1) return "vence mañana";
  return `${days} días restantes`;
}

function AlertList({ items }: { items: BondAlert[] }) {
  return (
    <ul className="vigencia-list">
      {items.map((item) => (
        <li
          key={item.id}
          className={`vigencia-item ${
            item.status === "CRITICO" || item.status === "VENCIDA"
              ? "is-critical"
              : "is-warning"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold m-0 text-base">{item.razonSocial}</p>
              <p className="text-sm text-[var(--muted)] m-0 mt-1">
                {item.carta} · {item.entidadFinanciera}
              </p>
              <p className="text-sm text-[var(--muted)] m-0 mt-2">
                Vigencia hasta {item.vigenciaAl} · {item.importe}
              </p>
            </div>
            <span className="vigencia-badge">
              <Clock3 size={14} />
              {daysLabel(item.daysLeft)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Popups emergentes arriba (desaparecen solos). */
function showTopEmergentPopups(expiring: BondAlert[]) {
  toast.dismiss();

  expiring.forEach((item, index) => {
    window.setTimeout(() => {
      const payload = {
        description: `${item.carta} · ${daysLabel(item.daysLeft)} · hasta ${item.vigenciaAl}`,
        duration: 4200,
        position: "top-center" as const,
      };

      if (item.status === "CRITICO" || item.status === "VENCIDA") {
        toast.error(`⚠ ${item.razonSocial}`, payload);
      } else {
        toast.warning(item.razonSocial, payload);
      }
    }, index * 380);
  });
}

export function VigenciaAlerts() {
  const { user, ready, token } = useAuth();
  const [mode, setMode] = useState<AlertMode>("hidden");
  const [items, setItems] = useState<BondAlert[]>([]);
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);
  const [stackReady, setStackReady] = useState(false);
  const timersRef = useRef<number[]>([]);
  const bootstrapped = useRef(false);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const refreshBonds = useCallback(async () => {
    try {
      const data = await listBonds(resolveToken(token));
      return data as Bond[];
    } catch {
      return [] as Bond[];
    }
  }, [token]);

  const mountBottomStatic = useCallback((expiring: BondAlert[]) => {
    setItems(expiring);
    setMode("dock");
    sessionStorage.setItem(DOCKED_KEY, "1");

    if (sessionStorage.getItem(CLOSED_ALL_KEY) === "1") {
      setHiddenIds(expiring.map((i) => i.id));
      setStackReady(false);
      return;
    }

    setHiddenIds([]);
    setStackReady(false);
    const t = window.setTimeout(() => setStackReady(true), 40);
    timersRef.current.push(t);
  }, []);

  /** 1) emergentes arriba → 2) desaparecen → 3) estáticas abajo */
  const playTopThenBottom = useCallback(
    (expiring: BondAlert[]) => {
      clearTimers();
      setMode("hidden");
      setItems(expiring);
      sessionStorage.setItem(DOCKED_KEY, "1");
      sessionStorage.removeItem(CLOSED_ALL_KEY);

      showTopEmergentPopups(expiring);

      const bottomAt = Math.max(2200, expiring.length * 380 + 1600);
      const t = window.setTimeout(() => {
        mountBottomStatic(expiring);
      }, bottomAt);
      timersRef.current.push(t);
    },
    [mountBottomStatic],
  );

  const openCenter = useCallback((expiring: BondAlert[]) => {
    clearTimers();
    toast.dismiss();
    setItems(expiring);
    setHiddenIds([]);
    setStackReady(false);
    setMode("center");
    sessionStorage.removeItem(DOCKED_KEY);
    sessionStorage.removeItem(CLOSED_ALL_KEY);
    localStorage.setItem(LAST_ALERT_DAY_KEY, todayKey());
  }, []);

  /** Modal central + popups superiores a la vez */
  const openCenterWithPopups = useCallback(
    (expiring: BondAlert[]) => {
      openCenter(expiring);
      showTopEmergentPopups(expiring);
    },
    [openCenter],
  );

  const evaluate = useCallback(
    async (forceCenter = false, source: Bond[] = []) => {
      const expiring = getExpiringBonds(source);
      setItems(expiring);

      if (expiring.length === 0) {
        setMode("hidden");
        if (forceCenter) {
          toast.message("Sin alertas de vigencia", {
            description:
              "No hay cartas vencidas ni por vencer (≤ 30 días) en el inventario.",
            duration: 3500,
          });
        }
        return;
      }

      const today = todayKey();
      const lastDay = localStorage.getItem(LAST_ALERT_DAY_KEY);
      const justLoggedIn = sessionStorage.getItem(LOGIN_ALERT_FLAG) === "1";
      const wasDocked = sessionStorage.getItem(DOCKED_KEY) === "1";

      if (justLoggedIn || forceCenter || lastDay !== today) {
        sessionStorage.removeItem(LOGIN_ALERT_FLAG);
        sessionStorage.removeItem(CLOSED_ALL_KEY);
        openCenterWithPopups(expiring);
        return;
      }

      if (wasDocked) {
        mountBottomStatic(expiring);
        return;
      }

      openCenterWithPopups(expiring);
    },
    [openCenterWithPopups, mountBottomStatic],
  );

  useEffect(() => {
    if (!ready || !user) {
      clearTimers();
      setMode("hidden");
      setItems([]);
      setHiddenIds([]);
      bootstrapped.current = false;
      return;
    }

    void (async () => {
      const data = await refreshBonds();
      await evaluate(false, data);
      bootstrapped.current = true;
    })();

    const interval = window.setInterval(() => {
      void (async () => {
        const data = await refreshBonds();
        await evaluate(false, data);
      })();
    }, 60 * 60 * 1000);

    const onFocus = () => {
      if (!bootstrapped.current) return;
      void (async () => {
        const data = await refreshBonds();
        await evaluate(false, data);
      })();
    };
    const onForce = () => {
      void (async () => {
        const data = await refreshBonds();
        await evaluate(true, data);
      })();
    };
    const onBondsUpdated = () => {
      void (async () => {
        const data = await refreshBonds();
        // Tras registrar/importar, mostrar alertas si aplica
        sessionStorage.setItem(LOGIN_ALERT_FLAG, "1");
        await evaluate(false, data);
      })();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener(FORCE_ALERT_EVENT, onForce);
    window.addEventListener("cfm-bonds-updated", onBondsUpdated);

    return () => {
      clearTimers();
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(FORCE_ALERT_EVENT, onForce);
      window.removeEventListener("cfm-bonds-updated", onBondsUpdated);
    };
  }, [ready, user?.id, refreshBonds, evaluate]);

  const dismissToDock = () => {
    playTopThenBottom(items);
  };

  const dismissOne = (id: number) => {
    setHiddenIds((prev) => [...prev, id]);
  };

  if (items.length === 0 || mode === "hidden") return null;

  const criticalCount = items.filter(
    (i) => i.status === "CRITICO" || i.status === "VENCIDA",
  ).length;
  const visibleStack = items.filter((i) => !hiddenIds.includes(i.id));

  if (mode === "dock") {
    const collapsed = visibleStack.length === 0;

    return (
      <aside
        className={`vigencia-stack ${collapsed ? "is-collapsed" : ""}`}
        aria-live="polite"
      >
        <div className="vigencia-stack-toolbar">
          <button
            type="button"
            className="vigencia-mini-btn"
            onClick={() => openCenterWithPopups(items)}
          >
            Ver Resumen
          </button>
          {!collapsed && (
            <button
              type="button"
              className="vigencia-mini-btn is-muted"
              onClick={() => {
                setHiddenIds(items.map((i) => i.id));
                sessionStorage.setItem(DOCKED_KEY, "1");
                sessionStorage.setItem(CLOSED_ALL_KEY, "1");
              }}
            >
              Cerrar todo
            </button>
          )}
        </div>

        {visibleStack.map((item, index) => (
          <article
            key={item.id}
            className={`vigencia-stack-card ${
              item.status === "CRITICO" || item.status === "VENCIDA"
                ? "is-critical"
                : "is-warning"
            } ${stackReady ? "is-in" : ""}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="vigencia-stack-top">
              <span className="vigencia-stack-tag">
                {item.status === "VENCIDA"
                  ? "Vencida"
                  : item.status === "CRITICO"
                    ? "Crítico"
                    : "Por vencer"}
              </span>
              <button
                type="button"
                className="vigencia-stack-close"
                aria-label="Cerrar aviso"
                onClick={() => dismissOne(item.id)}
              >
                <X size={12} />
              </button>
            </div>

            <button
              type="button"
              className="vigencia-stack-body"
              onClick={() => openCenterWithPopups(items)}
            >
              <p className="vigencia-stack-title">{item.razonSocial}</p>
              <p className="vigencia-stack-meta">
                {item.carta} · {daysLabel(item.daysLeft)}
              </p>
            </button>
          </article>
        ))}
      </aside>
    );
  }

  return (
    <div className="vigencia-overlay" role="dialog" aria-modal="true">
      <div className="vigencia-modal vigencia-modal-lg panel">
        <div className="vigencia-modal-banner">
          <AlertTriangle size={28} />
          <div>
            <p className="vigencia-banner-kicker">Atención inmediata</p>
            <h2 className="vigencia-banner-title">
              Documentos con alerta de vigencia
            </h2>
          </div>
        </div>

        <div className="vigencia-modal-head">
          <p className="page-sub m-0">
            Aviso automático · crítico ≤ {ALERT_CRITICAL_DAYS} días · aviso ≤{" "}
            {ALERT_WARNING_DAYS} días · incluye vencidas
          </p>
          <button
            type="button"
            className="icon-btn"
            aria-label="Continuar"
            onClick={dismissToDock}
          >
            <X size={18} />
          </button>
        </div>

        <div className="vigencia-summary">
          <div>
            <span>Total alertas</span>
            <strong>{items.length}</strong>
          </div>
          <div>
            <span>Críticos / vencidas</span>
            <strong className="text-orange-300">{criticalCount}</strong>
          </div>
          <div>
            <span>Por vencer</span>
            <strong className="text-amber-300">
              {items.length - criticalCount}
            </strong>
          </div>
        </div>

        <AlertList items={items} />

        <div className="vigencia-actions">
          <button type="button" className="logout-btn" onClick={dismissToDock}>
            Seguir
          </button>
          <button
            type="button"
            className="vigencia-primary"
            onClick={dismissToDock}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
