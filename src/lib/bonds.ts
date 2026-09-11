export type Bond = {
  id: number;
  ownerUserId?: string;
  ownerName?: string;
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

export type BondStatus = "VIGENTE" | "POR_VENCER" | "CRITICO" | "VENCIDA";

export type BondAlert = Bond & {
  daysLeft: number;
  status: BondStatus;
};

/** Umbrales en días para avisos (ajustables). */
export const ALERT_WARNING_DAYS = 30;
export const ALERT_CRITICAL_DAYS = 7;

/** Parsea DD/MM/YYYY a Date local (fin del día). */
export function parseDateDMY(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function daysUntil(date: Date, from = startOfToday()): number {
  const end = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const start = from.getTime();
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

export function resolveBondStatus(daysLeft: number): BondStatus {
  if (daysLeft < 0) return "VENCIDA";
  if (daysLeft <= ALERT_CRITICAL_DAYS) return "CRITICO";
  if (daysLeft <= ALERT_WARNING_DAYS) return "POR_VENCER";
  return "VIGENTE";
}

export function enrichBond(bond: Bond): BondAlert {
  const end = parseDateDMY(bond.vigenciaAl);
  const daysLeft = end ? daysUntil(end) : -9999;
  return {
    ...bond,
    daysLeft,
    status: resolveBondStatus(daysLeft),
  };
}

export function getExpiringBonds(bonds: Bond[]): BondAlert[] {
  return bonds
    .map(enrichBond)
    .filter(
      (b) =>
        b.status === "POR_VENCER" ||
        b.status === "CRITICO" ||
        b.status === "VENCIDA",
    )
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Datos demo con vigencias relativas a la fecha actual del sistema,
 * para que los avisos se vean al entrar.
 */
export function buildDemoBonds(from = startOfToday()): Bond[] {
  const fmt = (offsetDays: number) => {
    const d = new Date(from);
    d.setDate(d.getDate() + offsetDays);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  return [
    {
      id: 1,
      fechaRecepcion: fmt(-400),
      documento: "MEMO 098-2018-MDLM",
      razonSocial: "CONSORCIO RJV SAC",
      entidadFinanciera: "SECREX",
      carta: "E0291-01-2017",
      vigenciaDel: fmt(-800),
      vigenciaAl: fmt(-30),
      importe: "S/. 1,022,112",
      concepto: "CONTRATO 009-2017",
    },
    {
      id: 2,
      fechaRecepcion: fmt(-90),
      documento: "MEMO 030-2019-MDLM",
      razonSocial: "DITRANSERVA SAC",
      entidadFinanciera: "BANBIF",
      carta: "4410073297-04",
      vigenciaDel: fmt(-120),
      vigenciaAl: fmt(5),
      importe: "S/. 59,430",
      concepto: "LICITACION PUBLICA",
    },
    {
      id: 3,
      fechaRecepcion: fmt(-60),
      documento: "MEMO 361-2018-MDLM",
      razonSocial: "LLONTOP PALOMINO",
      entidadFinanciera: "FOGAPI",
      carta: "0928005-2018IFG",
      vigenciaDel: fmt(-200),
      vigenciaAl: fmt(18),
      importe: "S/. 35,400",
      concepto: "CONCURSO PUBLICO",
    },
    {
      id: 4,
      fechaRecepcion: fmt(-20),
      documento: "MEMO 112-2025-MDLM",
      razonSocial: "CONSTRUCTORA ANDES SAC",
      entidadFinanciera: "BBVA",
      carta: "BBVA-77821-01",
      vigenciaDel: fmt(-40),
      vigenciaAl: fmt(120),
      importe: "S/. 180,000",
      concepto: "OBRA PUBLICA",
    },
  ];
}
