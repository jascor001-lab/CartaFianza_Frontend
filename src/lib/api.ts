/**
 * En el navegador prioriza `/api` (proxy same-origin).
 * Si entras por IP en HTTP, también puede hablar directo con Nest :4006.
 */
function getApiBases(): string[] {
  if (!globalThis.window) {
    return [
      process.env.API_PROXY_TARGET?.replace(/\/$/, "") ||
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
        "http://127.0.0.1:4006",
    ];
  }

  const { protocol, hostname } = window.location;
  const bases = ["/api"];

  // Evita mixed-content: solo fallback HTTP→HTTP cuando la página no es https
  if (
    protocol === "http:" &&
    hostname !== "localhost" &&
    hostname !== "127.0.0.1"
  ) {
    bases.push(`http://${hostname}:4006`);
  }

  return bases;
}

function getApiUrl(): string {
  return getApiBases()[0];
}

export type UserRole = "admin" | "user";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  dni: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

export type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  timeoutMs?: number;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, token, timeoutMs = 8000 }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const bases = getApiBases();
  let lastError: unknown;

  for (let i = 0; i < bases.length; i++) {
    const base = bases[i];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${base}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        let message = "Error en la solicitud";
        try {
          const data = (await res.json()) as { message?: string | string[] };
          if (Array.isArray(data.message)) message = data.message.join(", ");
          else if (data.message) message = data.message;
        } catch {
          /* ignore */
        }
        throw new ApiError(message, res.status);
      }

      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      // Reintentar con el siguiente base solo si fue fallo de red / timeout
      const isApi = err instanceof ApiError;
      const canRetry =
        !isApi ||
        err.status === 0 ||
        err.status === 408 ||
        err.status >= 500;
      if (!canRetry || i === bases.length - 1) {
        if (isApi) throw err;
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new ApiError("Tiempo de espera agotado con el servidor", 408);
        }
        throw new ApiError("No hay conexión con el servidor", 0);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError("No hay conexión con el servidor", 0);
}

export function login(loginId: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: { login: loginId, password },
  });
}

export function getMe(token: string) {
  return apiRequest<AuthUser>("/auth/me", { token, timeoutMs: 5000 });
}

export function listUsers(token?: string | null) {
  // Preferir BFF con cookie; el token se manda si está disponible
  return apiRequest<AuthUser[]>("/web-users", { token, timeoutMs: 12000 });
}

export function createUser(
  token: string | null | undefined,
  payload: {
    name: string;
    email: string;
    dni: string;
    password: string;
    role?: UserRole;
  },
) {
  return apiRequest<AuthUser>("/web-users", {
    method: "POST",
    token,
    body: payload,
    timeoutMs: 12000,
  });
}

export function updateUser(
  token: string | null | undefined,
  id: string,
  payload: {
    name?: string;
    email?: string;
    dni?: string;
    password?: string;
    role?: UserRole;
    active?: boolean;
  },
) {
  return apiRequest<AuthUser>(`/web-users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    token,
    body: payload,
    timeoutMs: 12000,
  });
}

export type BondRecord = {
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

export function listBonds(token?: string | null) {
  return apiRequest<BondRecord[]>("/web-bonds", { token, timeoutMs: 12000 });
}

export function createBond(
  token: string | null | undefined,
  payload: Omit<BondRecord, "id" | "ownerUserId" | "ownerName">,
) {
  return apiRequest<BondRecord>("/web-bonds/create", {
    method: "POST",
    token,
    body: payload,
    timeoutMs: 12000,
  });
}

export function importBonds(
  token: string | null | undefined,
  rows: Omit<BondRecord, "id" | "ownerUserId" | "ownerName">[],
) {
  return apiRequest<{ imported: number; bonds: BondRecord[] }>(
    "/web-bonds",
    {
      method: "POST",
      token,
      body: { rows },
      timeoutMs: 20000,
    },
  );
}

export function getPublicApiBase() {
  return getApiUrl();
}

export { getApiUrl };
