"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { TenantBrandingProvider } from "@/components/providers/TenantBrandingProvider";
import { usePathname } from "next/navigation";

export function Providers({ children, tenantDomain }: { children: React.ReactNode, tenantDomain?: string | null }) {
  const pathname = usePathname();
  const isForcedLight = pathname === "/" || 
    pathname?.startsWith("/login") || 
    pathname?.startsWith("/register") || 
    pathname?.startsWith("/forgot-password") || 
    pathname?.startsWith("/reset-password") || 
    pathname?.startsWith("/verify-email") || 
    pathname?.startsWith("/invite") || 
    pathname?.startsWith("/onboarding");

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: 0 },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange forcedTheme={isForcedLight ? "light" : undefined}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <TenantBrandingProvider tenantDomain={tenantDomain}>
              {children}
            </TenantBrandingProvider>
          </AuthProvider>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
