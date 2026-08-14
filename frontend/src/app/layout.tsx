import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "Data Insight — AI-Powered Business Intelligence",
    template: "%s | Data Insight",
  },
  description:
    "Transform raw data into intelligent business decisions. AI-powered dashboards, forecasting, and executive reports.",
  keywords: [
    "business intelligence",
    "AI analytics",
    "data visualization",
    "forecasting",
    "dashboard builder",
  ],
  authors: [{ name: "Data Insight" }],
  creator: "Data Insight",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Data Insight — AI-Powered Business Intelligence",
    description:
      "Transform raw data into intelligent business decisions.",
    siteName: "Data Insight",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const tenantDomain = headersList.get("x-tenant-domain");

  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers tenantDomain={tenantDomain}>{children}</Providers>
      </body>
    </html>
  );
}
