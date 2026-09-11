import { NextRequest, NextResponse } from "next/server";

const API =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3020";

function appOrigin(request: NextRequest) {
  const rawHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "localhost:3050";
  // Nunca redirigir a 0.0.0.0 (Next con -H 0.0.0.0)
  const host = rawHost.includes("0.0.0.0") ? "localhost:3050" : rawHost;
  const protoHeader = request.headers.get("x-forwarded-proto");
  const proto =
    protoHeader ||
    (request.nextUrl.protocol === "https:" ? "https" : "http");
  return `${proto}://${host}`;
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, appOrigin(request)));
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  let login = "";
  let password = "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        login?: string;
        password?: string;
      };
      login = String(body.login || "").trim();
      password = String(body.password || "");
    } else {
      const form = await request.formData();
      login = String(form.get("login") || "").trim();
      password = String(form.get("password") || "");
    }
  } catch {
    return redirectTo(request, "/login?error=auth");
  }

  if (!login || password.length < 6) {
    return redirectTo(request, "/login?error=auth");
  }

  let data: {
    access_token?: string;
    user?: unknown;
  };

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      return redirectTo(request, "/login?error=auth");
    }

    data = (await res.json()) as { access_token?: string; user?: unknown };
  } catch {
    return redirectTo(request, "/login?error=session");
  }

  if (!data.access_token || !data.user) {
    return redirectTo(request, "/login?error=auth");
  }

  const response = redirectTo(request, "/dashboard");
  const secure = appOrigin(request).startsWith("https://");

  response.cookies.set("cfm_token", data.access_token, {
    path: "/",
    sameSite: "lax",
    secure,
    httpOnly: false,
  });
  response.cookies.set("cfm_user", JSON.stringify(data.user), {
    path: "/",
    sameSite: "lax",
    secure,
    httpOnly: false,
  });
  response.cookies.set("cfm_show_alert_on_login", "1", {
    path: "/",
    sameSite: "lax",
    secure,
    httpOnly: false,
  });

  return response;
}
