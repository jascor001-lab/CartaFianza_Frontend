"use client";

import { FormEvent, useRef, useState } from "react";
import Layout from "@/components/layout/Layout";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { ApiError, createBond, importBonds } from "@/lib/api";
import {
  buildBondsTemplate,
  parseBondsExcel,
} from "@/lib/excel-bonds";
import { Download, FileUp, ClipboardPlus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { DatePickerField } from "@/components/ui/DatePickerField";

type FormState = {
  fechaRecepcion: string;
  documento: string;
  razonSocial: string;
  entidadFinanciera: string;
  carta: string;
  vigenciaDel: string;
  vigenciaAl: string;
  importe: string;
  concepto: string;
};

const emptyForm: FormState = {
  fechaRecepcion: "",
  documento: "",
  razonSocial: "",
  entidadFinanciera: "",
  carta: "",
  vigenciaDel: "",
  vigenciaAl: "",
  importe: "",
  concepto: "",
};

/** YYYY-MM-DD (input date) → DD/MM/YYYY (API / inventario) */
function isoToDmy(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

function RegistroContent() {
  const { token } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setField = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const notifyUpdated = () => {
    window.dispatchEvent(new Event("cfm-bonds-updated"));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.vigenciaAl && form.vigenciaDel && form.vigenciaAl < form.vigenciaDel) {
      toast.error("La vigencia al no puede ser anterior a la vigencia del");
      return;
    }
    setSubmitting(true);
    try {
      const vigenciaDel = isoToDmy(form.vigenciaDel);
      const vigenciaAl = isoToDmy(form.vigenciaAl);
      const fechaRecepcion = isoToDmy(form.fechaRecepcion) || vigenciaDel;
      await createBond(token, {
        ...form,
        fechaRecepcion,
        vigenciaDel,
        vigenciaAl,
      });
      toast.success("Carta fianza registrada. Ya aparece en Custodia.");
      setForm(emptyForm);
      notifyUpdated();
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "No se pudo registrar la carta fianza",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = buildBondsTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-inventario-cartas-fianza.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const { rows: parsed, errors } = parseBondsExcel(buffer);

      if (errors.length && parsed.length === 0) {
        toast.error(errors[0] ?? "Excel inválido");
        return;
      }
      if (errors.length) {
        toast.warning(
          `${errors.length} fila(s) omitidas. Se registrarán ${parsed.length}.`,
        );
      }

      const result = await importBonds(token, parsed);
      toast.success(
        `Excel importado: ${result.imported} carta(s) agregadas al inventario`,
      );
      notifyUpdated();
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "No se pudo importar el Excel",
      );
    } finally {
      setImporting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 outline-none focus:border-emerald-400/40";

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <h1 className="page-title">Registro</h1>
          <p className="page-sub m-0">
            Alta manual o por Excel · queda asociado a tu usuario y alimenta tus
            recordatorios en{" "}
            <Link href="/dashboard" className="text-emerald-300 hover:underline">
              Custodia
            </Link>
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <form onSubmit={onSubmit} className="panel p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardPlus size={18} className="text-emerald-300" />
              <h2 className="text-lg font-semibold m-0">Registro manual</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-white/70">Razón social *</span>
                <input
                  required
                  value={form.razonSocial}
                  onChange={(e) => setField("razonSocial", e.target.value)}
                  className={inputClass}
                  placeholder="Empresa o consorcio"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-white/70">
                  Entidad financiera *
                </span>
                <input
                  required
                  value={form.entidadFinanciera}
                  onChange={(e) =>
                    setField("entidadFinanciera", e.target.value)
                  }
                  className={inputClass}
                  placeholder="BBVA, FOGAPI, etc."
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-white/70">N° carta *</span>
                <input
                  required
                  value={form.carta}
                  onChange={(e) => setField("carta", e.target.value)}
                  className={inputClass}
                  placeholder="Número de carta fianza"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-white/70">Documento / Memo</span>
                <input
                  value={form.documento}
                  onChange={(e) => setField("documento", e.target.value)}
                  className={inputClass}
                  placeholder="MEMO 001-2025-MDLM"
                />
              </label>

              <DatePickerField
                label="Vigencia del"
                required
                value={form.vigenciaDel}
                onChange={(v) => setField("vigenciaDel", v)}
              />

              <DatePickerField
                label="Vigencia al"
                required
                value={form.vigenciaAl}
                min={form.vigenciaDel || undefined}
                onChange={(v) => setField("vigenciaAl", v)}
              />

              <label className="block text-sm">
                <span className="mb-1 block text-white/70">Importe *</span>
                <input
                  required
                  value={form.importe}
                  onChange={(e) => setField("importe", e.target.value)}
                  className={inputClass}
                  placeholder="S/. 100,000"
                />
              </label>

              <DatePickerField
                label="Fecha recepción"
                value={form.fechaRecepcion}
                onChange={(v) => setField("fechaRecepcion", v)}
              />

              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-white/70">Concepto</span>
                <input
                  value={form.concepto}
                  onChange={(e) => setField("concepto", e.target.value)}
                  className={inputClass}
                  placeholder="Contrato, licitación u obra"
                />
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="vigencia-primary disabled:opacity-60"
              >
                {submitting ? "Guardando…" : "Registrar en el sistema"}
              </button>
              <button
                type="button"
                className="logout-btn"
                onClick={() => setForm(emptyForm)}
                disabled={submitting}
              >
                Limpiar
              </button>
            </div>
          </form>

          <div className="panel p-5 space-y-4 h-fit">
            <h2 className="text-lg font-semibold m-0">Importar Excel</h2>
            <p className="text-sm text-[var(--muted)] m-0">
              Las filas válidas se agregan a tu inventario (no borra lo ya
              registrado por ti).
            </p>

            <button
              type="button"
              className="logout-btn w-full"
              onClick={downloadTemplate}
            >
              <Download size={16} />
              Descargar plantilla
            </button>

            <button
              type="button"
              className="vigencia-primary w-full"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
            >
              <FileUp size={16} />
              {importing ? "Importando…" : "Seleccionar Excel"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onFileChange}
            />

            <p className="text-xs text-[var(--muted)] m-0 leading-relaxed">
              Columnas: Fecha recepción, Documento, Razón social, Entidad
              financiera, N° carta, Vigencia del, Vigencia al, Importe,
              Concepto.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function RegistroPage() {
  return (
    <RequireAuth>
      <RegistroContent />
    </RequireAuth>
  );
}
