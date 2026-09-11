"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "cfm_pwa_install_dismissed";
const HINT_KEY = "cfm_pwa_https_hint_dismissed";

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);
  const [httpsHint, setHttpsHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    const insecureLan =
      window.location.protocol === "http:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    if (insecureLan && sessionStorage.getItem(HINT_KEY) !== "1") {
      setHttpsHint(true);
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
      setHttpsHint(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (httpsHint && !visible) {
    const httpsUrl = `https://${window.location.host}/login`;
    return (
      <div className="pwa-install-banner" role="status">
        <div className="pwa-install-copy">
          <strong>PWA por IP requiere HTTPS</strong>
          <span>
            Abre {httpsUrl} para instalar la app (en HTTP el navegador bloquea el
            service worker).
          </span>
        </div>
        <div className="pwa-install-actions">
          <a className="pwa-install-btn" href={httpsUrl}>
            Abrir HTTPS
          </a>
          <button
            type="button"
            className="pwa-install-dismiss"
            aria-label="Cerrar"
            onClick={() => {
              sessionStorage.setItem(HINT_KEY, "1");
              setHttpsHint(false);
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  if (!visible || !deferred) return null;

  return (
    <div className="pwa-install-banner" role="dialog" aria-label="Instalar app">
      <div className="pwa-install-copy">
        <strong>Instalar Custodia Molina</strong>
        <span>Acceso rápido como aplicación en este dispositivo</span>
      </div>
      <div className="pwa-install-actions">
        <button
          type="button"
          className="pwa-install-btn"
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            setVisible(false);
            setDeferred(null);
          }}
        >
          <Download size={15} />
          Instalar
        </button>
        <button
          type="button"
          className="pwa-install-dismiss"
          aria-label="Cerrar"
          onClick={() => {
            sessionStorage.setItem(DISMISS_KEY, "1");
            setVisible(false);
          }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
