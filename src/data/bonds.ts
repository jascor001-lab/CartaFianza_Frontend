export type Bond = {
  id: number;
  fechaRecepcion: string;
  documento: string;
  razonSocial: string;
  entidadFinanciera: string;
  carta: string;
  vigenciaDel: string;
  vigenciaAl: string;
  importe: string;
  estado: string;
  concepto: string;
};

/** Datos de inventario (demo). Las vigencias se recalculan cada día. */
export const BONDS: Bond[] = [
  {
    id: 1,
    fechaRecepcion: "22/02/2025",
    documento: "MEMO 098-2025-MDLM",
    razonSocial: "CONSORCIO RJV SAC",
    entidadFinanciera: "SECREX",
    carta: "E0291-01-2025",
    vigenciaDel: "26/02/2025",
    vigenciaAl: "25/08/2026",
    importe: "S/. 1,022,112",
    estado: "VIGENTE",
    concepto: "CONTRATO 009-2025",
  },
  {
    id: 2,
    fechaRecepcion: "23/01/2025",
    documento: "MEMO 030-2025-MDLM",
    razonSocial: "DITRANSERVA SAC",
    entidadFinanciera: "BANBIF",
    carta: "4410073297-04",
    vigenciaDel: "22/01/2025",
    vigenciaAl: "28/08/2026",
    importe: "S/. 59,430",
    estado: "VIGENTE",
    concepto: "LICITACION PUBLICA",
  },
  {
    id: 3,
    fechaRecepcion: "12/10/2025",
    documento: "MEMO 361-2025-MDLM",
    razonSocial: "LLONTOP PALOMINO",
    entidadFinanciera: "FOGAPI",
    carta: "0928005-2025IFG",
    vigenciaDel: "28/09/2025",
    vigenciaAl: "15/09/2026",
    importe: "S/. 35,400",
    estado: "VIGENTE",
    concepto: "CONCURSO PUBLICO",
  },
  {
    id: 4,
    fechaRecepcion: "10/03/2024",
    documento: "MEMO 112-2024-MDLM",
    razonSocial: "SERVICIOS ANDES SAC",
    entidadFinanciera: "BBVA",
    carta: "BBVA-77821",
    vigenciaDel: "01/04/2024",
    vigenciaAl: "01/03/2026",
    importe: "S/. 120,000",
    estado: "VENCIDA",
    concepto: "OBRA PUBLICA",
  },
];

/** Umbral en días para aviso de vencimiento próximo */
export const EXPIRY_WARNING_DAYS = 30;
export const EXPIRY_CRITICAL_DAYS = 7;
