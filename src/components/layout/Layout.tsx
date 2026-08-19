"use client";

import { ReactNode } from "react";

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-br
        from-[#061915]
        via-[#0b2e26]
        to-[#061915]
        text-white
      "
    >

      <main className="p-4 md:p-6">
        {children}
      </main>

    </div>
  );
}