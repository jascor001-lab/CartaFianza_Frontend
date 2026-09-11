"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function parseIso(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(iso: string): string {
  const date = parseIso(iso);
  if (!date) return "";
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCells(month: Date) {
  const first = startOfMonth(month);
  // Monday-first: JS Sunday=0 → shift
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
  min?: string;
  id?: string;
};

export function DatePickerField({
  label,
  value,
  onChange,
  required,
  min,
  id,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseIso(value);
  const minDate = parseIso(min || "");
  const [view, setView] = useState<Date>(
    () => selected ?? minDate ?? new Date(),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setView(selected ?? minDate ?? new Date());
    }
  }, [open, selected, minDate]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cells = useMemo(() => buildCells(view), [view]);

  const isDisabled = (day: Date) => {
    if (!minDate) return false;
    const a = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const b = new Date(
      minDate.getFullYear(),
      minDate.getMonth(),
      minDate.getDate(),
    ).getTime();
    return a < b;
  };

  const pick = (day: Date) => {
    if (isDisabled(day)) return;
    onChange(toIso(day));
    setOpen(false);
  };

  return (
    <div className="block text-sm relative" ref={rootRef}>
      <span className="mb-1 block text-white/70">
        {label}
        {required ? " *" : ""}
      </span>

      <button
        type="button"
        id={id}
        className="date-picker-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value ? "text-[var(--text)]" : "text-white/40"}>
          {value ? formatDisplay(value) : "Elegir fecha"}
        </span>
        <Calendar size={16} className="text-emerald-300 shrink-0" />
      </button>

      {/* Valor real para validación HTML del form */}
      <input
        tabIndex={-1}
        className="sr-only"
        required={required}
        value={value}
        onChange={() => undefined}
        aria-hidden
      />

      {open && (
        <div className="date-picker-pop" role="dialog" aria-label={label}>
          <div className="date-picker-nav">
            <button
              type="button"
              className="date-picker-nav-btn"
              aria-label="Mes anterior"
              onClick={() =>
                setView(
                  new Date(view.getFullYear(), view.getMonth() - 1, 1),
                )
              }
            >
              <ChevronLeft size={16} />
            </button>
            <p className="date-picker-month">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </p>
            <button
              type="button"
              className="date-picker-nav-btn"
              aria-label="Mes siguiente"
              onClick={() =>
                setView(
                  new Date(view.getFullYear(), view.getMonth() + 1, 1),
                )
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="date-picker-weekdays">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="date-picker-grid">
            {cells.map((day, idx) => {
              if (!day) {
                return <span key={`e-${idx}`} className="date-picker-empty" />;
              }
              const iso = toIso(day);
              const active = value === iso;
              const disabled = isDisabled(day);
              const today = toIso(new Date()) === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  className={`date-picker-day${active ? " is-active" : ""}${today ? " is-today" : ""}`}
                  onClick={() => pick(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="date-picker-footer">
            <button
              type="button"
              className="date-picker-today"
              onClick={() => {
                const today = new Date();
                if (!isDisabled(today)) {
                  onChange(toIso(today));
                  setOpen(false);
                } else {
                  setView(today);
                }
              }}
            >
              Hoy
            </button>
            {!required && (
              <button
                type="button"
                className="date-picker-clear"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
