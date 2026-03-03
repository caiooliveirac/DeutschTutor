"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ProviderProvider } from "@/components/ProviderContext";
import type { ReactNode } from "react";

/**
 * App shell: wraps authenticated pages with Sidebar + ProviderProvider.
 * Login page gets a clean layout with no sidebar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login" || pathname === "/tutor/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <ProviderProvider>
      <Sidebar />
      <main className="pt-14 md:pt-0 md:ml-64 min-h-screen bg-background">
        {children}
      </main>
    </ProviderProvider>
  );
}
