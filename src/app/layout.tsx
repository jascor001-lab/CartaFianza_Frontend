import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import type { AuthUser } from "@/lib/api";
import { TOKEN_KEY, USER_KEY } from "@/lib/session-keys";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Portal de Carta Fianza / Custodia",
    template: "%s · Custodia Molina",
  },
  description:
    "Portal de Carta Fianza / Custodia — Municipalidad de la Molina. Alertas de vigencia y gestión de accesos.",
  applicationName: "Custodia Molina",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Custodia Molina",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/icons/icon-192.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b2e26" },
    { media: "(prefers-color-scheme: light)", color: "#0b2e26" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();
  const initialToken = jar.get(TOKEN_KEY)?.value ?? null;
  let initialUser: AuthUser | null = null;
  const rawUser = jar.get(USER_KEY)?.value;
  if (rawUser) {
    try {
      initialUser = JSON.parse(rawUser) as AuthUser;
    } catch {
      try {
        initialUser = JSON.parse(decodeURIComponent(rawUser)) as AuthUser;
      } catch {
        initialUser = null;
      }
    }
  }

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(x){x.unregister()})})}var t=document.cookie.match(/(?:^|; )cfm_token=([^;]*)/);var u=document.cookie.match(/(?:^|; )cfm_user=([^;]*)/);if(t)localStorage.setItem('cfm_token',decodeURIComponent(t[1]));if(u)localStorage.setItem('cfm_user',decodeURIComponent(u[1]));var a=document.cookie.match(/(?:^|; )cfm_show_alert_on_login=([^;]*)/);if(a&&a[1]==='1'){sessionStorage.setItem('cfm_show_alert_on_login','1');document.cookie='cfm_show_alert_on_login=; Max-Age=0; path=/';}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers initialToken={initialToken} initialUser={initialUser}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
