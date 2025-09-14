"use client";

import { SessionProvider } from "next-auth/react";
import { SettingsProvider } from "../contexts/SettingsContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </SessionProvider>
  );
}