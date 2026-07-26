"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

/** Re-hydrates /auth/me on every cold start if a token exists. */
function AuthInitializer() {
  const token = useAuthStore((s) => s.token);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!token) return;
    // Sync to localStorage so Axios interceptor picks it up
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
    // Silently refresh profile; 401 → Axios interceptor will redirect to /login
    fetchMe().catch(() => logout());
    // Run once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthInitializer />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
