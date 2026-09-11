import type { Bond } from "@/lib/bonds";
import * as XLSX from "xlsx";

function norm(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cell(row: Record<string, unknown>, keys: string[]): string {
  const entries = Object.entries(row);
  for (const key of keys) {
    const found = entries.find(([k]) => norm(k) === norm(key));
    if (found && found[1] != null && String(found[1]).trim() !== "") {
      return String(found[1]).trim();
    }
  }
  return "";
}

/** Excel serial date → DD/MM/YYYY */
function excelDateToDMY(value: string): string {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < 20000) return value;
  const utc = Date.UTC(1899, 11, 30) + n * 86400000;
  const d = new Date(utc);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export type ExcelParseResult = {
  rows: Omit<Bond, "id">[];
  errors: string[];
};

export function parseBondsExcel(buffer: ArrayBuffer): ExcelParseResult {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], errors: ["El Excel no tiene hojas"] };
  }

  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  const errors: string[] = [];
  const rows: Omit<Bond, "id">[] = [];

  raw.forEach((row, index) => {
    const line = index + 2;
    const razonSocial = cell(row, [
      "razon social",
      "razonsocial",
      "empresa",
      "razon_social",
    ]);
    const entidadFinanciera = cell(row, [
      "entidad financiera",
      "entidadfinanciera",
      "entidad",
      "banco",
    ]);
    const carta = cell(row, [
      "n carta",
      "n° carta",
      "nº carta",
      "carta",
      "numero",
      "n°",
      "nº",
    ]);
    let vigenciaDel = cell(row, [
      "vigencia del",
      "vigenciadel",
      "desde",
      "inicio",
    ]);
    let vigenciaAl = cell(row, [
      "vigencia al",
      "vigenciaal",
      "hasta",
      "fin",
      "vencimiento",
    ]);
    const importe = cell(row, ["importe", "monto", "monto s/", "valor"]);
    const documento = cell(row, [
      "documento",
      "memo",
      "documento memo",
      "referencia",
    ]);
    let fechaRecepcion = cell(row, [
      "fecha recepcion",
      "fecharecepcion",
      "recepcion",
    ]);
    const concepto = cell(row, ["concepto", "contrato", "detalle"]);

    vigenciaDel = excelDateToDMY(vigenciaDel);
    vigenciaAl = excelDateToDMY(vigenciaAl);
    fechaRecepcion = fechaRecepcion
      ? excelDateToDMY(fechaRecepcion)
      : vigenciaDel;

    if (!razonSocial && !carta && !vigenciaAl) return;

    if (!razonSocial || !entidadFinanciera || !carta || !vigenciaDel || !vigenciaAl || !importe) {
      errors.push(
        `Fila ${line}: faltan campos obligatorios (Empresa, Entidad, N° carta, Vigencia del/al, Importe)`,
      );
      return;
    }

    rows.push({
      fechaRecepcion,
      documento,
      razonSocial,
      entidadFinanciera,
      carta,
      vigenciaDel,
      vigenciaAl,
      importe,
      concepto,
    });
  });

  if (rows.length === 0 && errors.length === 0) {
    errors.push("No se encontraron filas válidas en el Excel");
  }

  return { rows, errors };
}

/** Genera plantilla Excel descargable */
export function buildBondsTemplate(): Blob {
  const data = [
    {
      "Fecha recepción": "01/01/2025",
      Documento: "MEMO 001-2025-MDLM",
      "Razón social": "EMPRESA EJEMPLO SAC",
      "Entidad financiera": "BBVA",
      "N° carta": "CF-0001-2025",
      "Vigencia del": "01/01/2025",
      "Vigencia al": "31/12/2025",
      Importe: "S/. 100,000",
      Concepto: "CONTRATO 001-2025",
    },
  ];
  const sheet = XLSX.utils.json_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Inventario");
  const out = XLSX.write(book, { type: "array", bookType: "xlsx" }) as Uint8Array;
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
