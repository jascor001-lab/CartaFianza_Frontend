"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  Bell,
  ClipboardPlus,
  FileStack,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { FORCE_ALERT_EVENT } from "@/lib/session-keys";

const navItems = [
  { href: "/dashboard", label: "Custodia", icon: FileStack, admin: false },
  { href: "/registro", label: "Registro", icon: ClipboardPlus, admin: false },
  { href: "/usuarios", label: "Accesos", icon: Users, admin: true },
] as const;

const monitorAdminItems = [
  { href: "/indicadores", label: "Indicadores", icon: LayoutDashboard },
] as const;

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visible = navItems.filter((item) => !item.admin || isAdmin);

  return (
    <div className="app-shell">
      <div className="app-grid-bg" aria-hidden />

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">M</div>
          <div>
            <p className="brand-kicker">Municipalidad de la Molina</p>
            <p className="brand-name">Portal de Carta Fianza / Custodia</p>
          </div>
          <button
            type="button"
            className="sidebar-close md-hidden"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section">Módulos</p>
          {visible.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                <span>{label}</span>
                {active && <span className="nav-active-dot" />}
              </Link>
            );
          })}
          <p className="nav-section">Monitoreo</p>
          {isAdmin &&
            monitorAdminItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-link ${active ? "nav-link-active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {active && <span className="nav-active-dot" />}
                </Link>
              );
            })}
          <button
            type="button"
            className="nav-link"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new Event(FORCE_ALERT_EVENT));
            }}
          >
            <Bell size={18} />
            <span>Alertas</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{user?.name?.charAt(0) ?? "?"}</div>
            <div className="user-meta">
              <p>{user?.name}</p>
              <span>{user?.role === "admin" ? "Admin" : "Operador"}</span>
            </div>
          </div>
          <button type="button" className="logout-btn" onClick={logout}>
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="sidebar-backdrop md-hidden"
          aria-label="Cerrar"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="content-area">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn md-hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </button>
        </header>
        <main className="page-main">{children}</main>
      </div>
    </div>
  );
}
