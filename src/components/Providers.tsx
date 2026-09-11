"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { VigenciaAlerts } from "@/components/alerts/VigenciaAlerts";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import type { AuthUser } from "@/lib/api";

export function Providers({
  children,
  initialToken = null,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialToken?: string | null;
  initialUser?: AuthUser | null;
}) {
  return (
    <AuthProvider initialToken={initialToken} initialUser={initialUser}>
      {children}
      <VigenciaAlerts />
      <PwaInstallPrompt />
      <Toaster
        theme="dark"
        position="top-center"
        richColors
        closeButton
        expand
        visibleToasts={5}
        toastOptions={{
          classNames: {
            toast: "cfm-toast",
          },
        }}
      />
    </AuthProvider>
  );
}
