"use client"

import type React from "react"

import { ClerkProvider, SignedIn, SignedOut, SignIn } from "@clerk/nextjs"
import "@/app/globals.css"
import { useEffect } from "react"
import { Inter } from "next/font/google"
import { Providers } from "@/components/providers"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
})

interface RootLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: RootLayoutProps) {
  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <ClerkProvider
        appearance={{
          layout: {
            logoImageUrl: "/logo.png",
            socialButtonsVariant: "iconButton",
          },
          variables: {
            colorText: "#fff", // Updated for dark theme
            colorPrimary: "#10b981", // Green tone
            colorBackground: "#1e293b", // Dark background
            colorInputBackground: "#0f172a", // Darker input background
            colorInputText: "#fff", // White text for inputs
          },
        }}
      >
        <body className={`${inter.variable} bg-background text-foreground font-sans`}>
          <SignedIn>
         
            <Providers>{children}</Providers>
          </SignedIn>
          <SignedOut>
            <SignIn />
          </SignedOut>
        </body>
      </ClerkProvider>
    </html>
  )
}

