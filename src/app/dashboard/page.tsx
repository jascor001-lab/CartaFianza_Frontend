"use client";

import Layout from "@/components/layout/Layout";

import {
  Eye,
  Download,
  ShieldCheck,
  Calendar,
  Building2,
} from "lucide-react";

type Bond = {
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

const data: Bond[] = [
  {
    id: 1,
    fechaRecepcion: "22/02/2019",
    documento: "MEMO 098-2018-MDLM",
    razonSocial: "CONSORCIO RJV SAC",
    entidadFinanciera: "SECREX",
    carta: "E0291-01-2017",
    vigenciaDel: "26/02/2018",
    vigenciaAl: "25/02/2019",
    importe: "S/. 1,022,112",
    estado: "VENCIDA",
    concepto: "CONTRATO 009-2017",
  },

  {
    id: 2,
    fechaRecepcion: "23/01/2019",
    documento: "MEMO 030-2019-MDLM",
    razonSocial: "DITRANSERVA SAC",
    entidadFinanciera: "BANBIF",
    carta: "4410073297-04",
    vigenciaDel: "22/01/2019",
    vigenciaAl: "23/03/2019",
    importe: "S/. 59,430",
    estado: "VENCIDA",
    concepto: "LICITACION PUBLICA",
  },

  {
    id: 3,
    fechaRecepcion: "12/10/2018",
    documento: "MEMO 361-2018-MDLM",
    razonSocial: "LLONTOP PALOMINO",
    entidadFinanciera: "FOGAPI",
    carta: "0928005-2018IFG",
    vigenciaDel: "28/09/2018",
    vigenciaAl: "25/06/2019",
    importe: "S/. 35,400",
    estado: "VIGENTE",
    concepto: "CONCURSO PUBLICO",
  },
];

export default function DashboardPage() {

  return (
    <Layout>

      <div>

        <h1 className="text-2xl font-bold mb-2">
          Cartas Fianza
        </h1>

        <p className="text-gray-400 mb-6">
          Relación de cartas fianzas en custodia
        </p>

        <div
          className="
            bg-white/5
            backdrop-blur-xl
            border border-white/10
            rounded-2xl
            p-4
          "
        >

          {/* HEADER */}

          <div
            className="
              flex flex-col lg:flex-row
              lg:items-center
              lg:justify-between
              gap-4
              mb-6
            "
          >

            <div>

              <h2 className="text-xl font-bold">
                Cartas Fianza
              </h2>

              <p className="text-sm text-gray-400">
                Gestión de documentos financieros
              </p>

            </div>

            <input
              placeholder="Buscar empresa..."
              className="
                bg-white/10
                border border-white/10
                rounded-xl
                px-4 py-2.5
                text-sm
                outline-none
                w-full lg:w-72
              "
            />

          </div>

          {/* MOBILE */}

          <div className="flex flex-col gap-4 lg:hidden">

            {data.map((item) => (

              <div
                key={item.id}
                className="
                  bg-white/5
                  border border-white/10
                  rounded-2xl
                  p-4
                "
              >

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <h3 className="font-semibold leading-tight">
                      {item.razonSocial}
                    </h3>

                    <p className="text-xs text-gray-400 mt-1">
                      {item.documento}
                    </p>

                  </div>

                  <span
                    className={`
                      text-xs px-3 py-1 rounded-full font-medium
                      ${
                        item.estado === "VENCIDA"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                      }
                    `}
                  >
                    {item.estado}
                  </span>

                </div>

                <div className="mt-4 space-y-3">

                  <div className="flex items-center gap-2 text-sm">
                    <Building2 size={15}/>
                    {item.entidadFinanciera}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck size={15}/>
                    {item.carta}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={15}/>
                    {item.vigenciaDel} → {item.vigenciaAl}
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Importe
                    </p>

                    <p className="font-semibold">
                      {item.importe}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Concepto
                    </p>

                    <p className="text-sm leading-relaxed">
                      {item.concepto}
                    </p>
                  </div>

                </div>

                <div className="flex gap-2 mt-5">

                  <button
                    className="
                      flex-1
                      bg-green-500/20
                      text-green-400
                      py-2 rounded-xl
                      text-sm
                      flex items-center
                      justify-center
                      gap-2
                    "
                  >
                    <Eye size={16}/>
                    Ver
                  </button>

                  <button
                    className="
                      flex-1
                      bg-blue-500/20
                      text-blue-400
                      py-2 rounded-xl
                      text-sm
                      flex items-center
                      justify-center
                      gap-2
                    "
                  >
                    <Download size={16}/>
                    Descargar
                  </button>

                </div>

              </div>
            ))}
          </div>

          {/* DESKTOP */}

          <div className="hidden lg:block overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="text-left text-gray-400 border-b border-white/10">

                  <th className="py-4 pr-4">
                    Empresa
                  </th>

                  <th className="py-4 pr-4">
                    Entidad
                  </th>

                  <th className="py-4 pr-4">
                    Carta
                  </th>

                  <th className="py-4 pr-4">
                    Vigencia
                  </th>

                  <th className="py-4 pr-4">
                    Importe
                  </th>

                  <th className="py-4 pr-4">
                    Estado
                  </th>

                  <th className="py-4">
                    Acción
                  </th>

                </tr>

              </thead>

              <tbody>

                {data.map((item) => (

                  <tr
                    key={item.id}
                    className="
                      border-b border-white/5
                      hover:bg-white/5
                      transition
                    "
                  >

                    <td className="py-4 pr-4">

                      <div>

                        <p className="font-medium">
                          {item.razonSocial}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          {item.documento}
                        </p>

                      </div>

                    </td>

                    <td className="pr-4">
                      {item.entidadFinanciera}
                    </td>

                    <td className="pr-4">
                      {item.carta}
                    </td>

                    <td className="pr-4">
                      {item.vigenciaDel} - {item.vigenciaAl}
                    </td>

                    <td className="pr-4 font-medium">
                      {item.importe}
                    </td>

                    <td className="pr-4">

                      <span
                        className={`
                          text-xs px-3 py-1 rounded-full font-medium
                          ${
                            item.estado === "VENCIDA"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-green-500/20 text-green-400"
                          }
                        `}
                      >
                        {item.estado}
                      </span>

                    </td>

                    <td>

                      <button
                        className="
                          bg-green-500/20
                          text-green-400
                          px-4 py-2
                          rounded-xl
                          flex items-center gap-2
                        "
                      >
                        <Eye size={15}/>
                        Ver
                      </button>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </Layout>
  );
}