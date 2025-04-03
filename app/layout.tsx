import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { CookieConsent } from "@/components/cookie-consent"
import { OnboardingTutorial } from "@/components/onboarding-tutorial"
import { ClerkProvider } from "@clerk/nextjs"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "KinderGrow - Child Development Tracking App",
  description:
    "Track your child's development, sleep patterns, feeding schedules, and more with KinderGrow. Get AI-powered insights and recommendations.",
  keywords: [
    "child development",
    "baby tracking",
    "sleep tracking",
    "feeding schedule",
    "diaper tracking",
    "growth metrics",
    "parenting app",
    "baby milestones",
    "child health",
    "AI parenting assistant",
  ],
  authors: [{ name: "KinderGrow Team" }],
  creator: "KinderGrow",
  publisher: "KinderGrow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kindergrow.app",
    title: "KinderGrow - Child Development Tracking App",
    description:
      "Track your child's development, sleep patterns, feeding schedules, and more with KinderGrow. Get AI-powered insights and recommendations.",
    siteName: "KinderGrow",
    images: [
      {
        url: "https://kindergrow.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "KinderGrow - Child Development Tracking App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KinderGrow - Child Development Tracking App",
    description:
      "Track your child's development, sleep patterns, feeding schedules, and more with KinderGrow. Get AI-powered insights and recommendations.",
    images: ["https://kindergrow.app/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <CookieConsent />
            <OnboardingTutorial />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}

