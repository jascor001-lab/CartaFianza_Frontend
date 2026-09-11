"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError, type AuthUser, getMe, login as apiLogin } from "@/lib/api";
import { TOKEN_KEY, USER_KEY, LOGIN_ALERT_FLAG } from "@/lib/session-keys";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`,
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function readStoredSession(): { token: string | null; user: AuthUser | null } {
  try {
    if (typeof window === "undefined") return { token: null, user: null };
    const token =
      localStorage.getItem(TOKEN_KEY) || readCookie(TOKEN_KEY) || null;
    const raw = localStorage.getItem(USER_KEY) || readCookie(USER_KEY);
    if (token && !localStorage.getItem(TOKEN_KEY)) {
      try {
        localStorage.setItem(TOKEN_KEY, token);
        if (raw) localStorage.setItem(USER_KEY, raw);
      } catch {
        /* ignore */
      }
    }
    if (!token) return { token: null, user: null };
    if (!raw) return { token, user: null };
    try {
      return { token, user: JSON.parse(raw) as AuthUser };
    } catch {
      try {
        return { token, user: JSON.parse(decodeURIComponent(raw)) as AuthUser };
      } catch {
        return { token, user: null };
      }
    }
  } catch {
    return { token: null, user: null };
  }
}

function clearStoredSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
  try {
    document.cookie = `${TOKEN_KEY}=; Max-Age=0; path=/`;
    document.cookie = `${USER_KEY}=; Max-Age=0; path=/`;
    document.cookie = `${LOGIN_ALERT_FLAG}=; Max-Age=0; path=/`;
  } catch {
    /* ignore */
  }
}

export function AuthProvider({
  children,
  initialToken = null,
  initialUser = null,
}: {
  children: ReactNode;
  initialToken?: string | null;
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [token, setToken] = useState<string | null>(initialToken);
  // No bloquear la UI: cookies del servidor ya traen sesión tras /api/web-login
  const [ready, setReady] = useState(true);
  const sessionId = useRef(0);

  useEffect(() => {
    let active = true;
    const stored = readStoredSession();
    const nextToken = stored.token || initialToken;
    const nextUser = stored.user || initialUser;

    if (!active) return;
    setToken(nextToken);
    setUser(nextUser);
    setReady(true);

    if (nextToken && readCookie(LOGIN_ALERT_FLAG) === "1") {
      try {
        sessionStorage.setItem(LOGIN_ALERT_FLAG, "1");
        document.cookie = `${LOGIN_ALERT_FLAG}=; Max-Age=0; path=/`;
      } catch {
        /* ignore */
      }
    }

    if (!nextToken) return;

    const id = ++sessionId.current;
    void getMe(nextToken)
      .then((me) => {
        if (!active || sessionId.current !== id) return;
        setUser(me);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(me));
        } catch {
          /* ignore */
        }
      })
      .catch((err) => {
        if (!active || sessionId.current !== id) return;
        if (
          err instanceof ApiError &&
          (err.status === 401 || err.status === 403)
        ) {
          clearStoredSession();
          setToken(null);
          setUser(null);
        }
      });

    return () => {
      active = false;
    };
  }, [initialToken, initialUser]);

  const login = useCallback(
    async (loginId: string, password: string) => {
      const data = await apiLogin(loginId, password);
      if (!data?.access_token || !data?.user) {
        throw new ApiError("Respuesta de login incompleta", 500);
      }
      sessionId.current += 1;
      try {
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        sessionStorage.setItem(LOGIN_ALERT_FLAG, "1");
      } catch {
        throw new ApiError(
          "No se pudo guardar la sesión en el navegador",
          500,
        );
      }
      setToken(data.access_token);
      setUser(data.user);
      setReady(true);
      window.location.assign("/dashboard");
    },
    [],
  );

  const logout = useCallback(() => {
    sessionId.current += 1;
    clearStoredSession();
    try {
      sessionStorage.removeItem(LOGIN_ALERT_FLAG);
      sessionStorage.removeItem("cfm_alert_docked");
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
    window.location.assign("/login");
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      login,
      logout,
      isAdmin: user?.role === "admin",
    }),
    [user, token, ready, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
