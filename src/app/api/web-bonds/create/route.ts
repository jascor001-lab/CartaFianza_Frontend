import { NextRequest, NextResponse } from "next/server";
import { TOKEN_KEY } from "@/lib/session-keys";

const API =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3020";

function bearer(request: NextRequest) {
  const cookie = request.cookies.get(TOKEN_KEY)?.value;
  if (cookie) return cookie;
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}

export async function POST(request: NextRequest) {
  const token = bearer(request);
  if (!token) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await request.text();
    const res = await fetch(`${API}/bonds`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "No hay conexión con el backend (:3020)" },
      { status: 502 },
    );
  }
}
