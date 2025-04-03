"use client";

import { ClerkProvider } from "@clerk/nextjs";
import "@/app/globals.css";
import type React from "react";
import { useEffect } from "react";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { dark } from "@clerk/themes";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ChildProvider } from "@/contexts/child-context";
import { SidebarProvider } from "@/contexts/sidebar-context";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: RootLayoutProps) {
  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <ClerkProvider
        appearance={{
          baseTheme: dark,
          layout: {
            logoPlacement: "none",
            socialButtonsVariant: "iconButton",
            logoImageUrl: "/logo.png",
            showOptionalFields: true,
          },
          variables: {
            colorPrimary: "#2563eb",
            colorTextOnPrimaryBackground: "white",
            colorBackground: "#1e293b",
            colorInputBackground: "#334155",
            colorInputText: "#cbd5e1",
            colorText: "#cbd5e1",
            colorTextSecondary: "#94a3b8",
            fontFamily: "Inter, sans-serif",
            borderRadius: "0.5rem",
          },
          elements: {
            card: {
              backgroundColor: "#1e293b",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
              borderRadius: "0.5rem",
              border: "1px solid #334155",
            },
            formButtonPrimary: {
              backgroundColor: "#2563eb",
              fontSize: "14px",
              textTransform: "none",
              fontWeight: "500",
              "&:hover": {
                backgroundColor: "#1d4ed8",
              },
            },
            formFieldLabel: {
              color: "#cbd5e1",
              fontSize: "14px",
              fontWeight: "500",
            },
            formFieldInput: {
              backgroundColor: "#334155",
              borderColor: "#475569",
              color: "#cbd5e1",
              "&:focus": {
                borderColor: "#2563eb",
                boxShadow: "0 0 0 2px rgba(37, 99, 235, 0.25)",
              },
            },
            footerActionLink: {
              color: "#2563eb",
              "&:hover": {
                color: "#598EF3",
              },
            },
            footerActionText: {
              color: "#94a3b8",
            },
            headerTitle: {
              color: "#cbd5e1",
              fontSize: "24px",
              fontWeight: "600",
            },
            headerSubtitle: {
              color: "#94a3b8",
              fontSize: "16px",
            },
            identityPreviewEditButton: {
              color: "#2563eb",
            },
            identityPreviewText: {
              color: "#cbd5e1",
            },
            socialButtonsBlockButton: {
              backgroundColor: "#334155",
              borderColor: "#475569",
              color: "#cbd5e1",
              "&:hover": {
                backgroundColor: "#475569",
              },
            },
            alert: {
              backgroundColor: "#334155",
              borderColor: "#475569",
              color: "#cbd5e1",
            },
            dividerLine: {
              backgroundColor: "#475569",
            },
            dividerText: {
              color: "#94a3b8",
            },
            logoBox: {
              filter: "none",
            },
            logoImage: {
              height: "60px",
              width: "60px",
            },
          },
        }}
      >
        <body
          className={`${inter.variable} bg-background text-foreground font-sans`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            forcedTheme="dark"
            disableTransitionOnChange
          >
            <QueryProvider>
              <ChildProvider>
                <SidebarProvider>{children}</SidebarProvider>
              </ChildProvider>
            </QueryProvider>
            <Toaster />
          </ThemeProvider>
        </body>
      </ClerkProvider>
    </html>
  );
}
