import { NextRequest, NextResponse } from "next/server";
import { TOKEN_KEY } from "@/lib/session-keys";

const API =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3020";

function getToken(request: NextRequest) {
  return request.cookies.get(TOKEN_KEY)?.value || null;
}

async function proxyJson(
  request: NextRequest,
  path: string,
  init: RequestInit = {},
) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json(
      { message: "No autenticado. Vuelve a iniciar sesión." },
      { status: 401 },
    );
  }

  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
      },
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
      { message: "No hay conexión con el backend (:3020)" },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyJson(request, "/users");
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyJson(request, "/users", { method: "POST", body });
}
