import { NextRequest, NextResponse } from "next/server";
import { TOKEN_KEY } from "@/lib/session-keys";

const API =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:4006";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = request.cookies.get(TOKEN_KEY)?.value;
  if (!token) {
    return NextResponse.json(
      { message: "No autenticado. Vuelve a iniciar sesión." },
      { status: 401 },
    );
  }

  try {
    const body = await request.text();
    const res = await fetch(`${API}/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });

    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text || "Error en el backend" };
    }

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "No hay conexión con el backend (:4006)" },
      { status: 502 },
    );
  }
}
