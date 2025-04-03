import Head from "next/head"

interface SeoProps {
  title?: string
  description?: string
  canonical?: string
  ogImage?: string
}

export function Seo({
  title = "KinderGrow - Child Development Tracking App",
  description = "Track your child's development, sleep patterns, feeding schedules, and more with KinderGrow. Get AI-powered insights and recommendations.",
  canonical = "https://kindergrow.app",
  ogImage = "https://kindergrow.app/og-image.jpg",
}: SeoProps) {
  const siteTitle = title.includes("KinderGrow") ? title : `${title} | KinderGrow`

  return (
    <Head>
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#ffffff" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="KinderGrow" />
      <meta name="application-name" content="KinderGrow" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta name="msapplication-tap-highlight" content="no" />
    </Head>
  )
}

