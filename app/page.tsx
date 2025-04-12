import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Seo } from "@/components/seo"
import Image from "next/image"

export default function LandingPage() {
  return (
    <>
      <Seo />
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="flex items-center gap-1 font-bold">
              <Image src={"/logo.png"} alt="Logo" width={50} height={50} className="rounded-full" />
              <span className="text-lg">KinderGrow</span>
            </div>
            <div className="flex flex-1 items-center justify-end space-x-4">
              <nav className="flex items-center space-x-2">
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm">Sign up</Button>
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
            <div className="container px-4 md:px-6">
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                      Track Your Child's Growth and Development
                    </h1>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl">
                      KinderGrow helps you monitor sleep patterns, feeding schedules, diaper changes, and more. Get
                      AI-powered insights for your child's optimal development.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row">
                    <Link href="/sign-up">
                      <Button size="lg" className="w-full min-[400px]:w-auto">
                        Get Started
                      </Button>
                    </Link>
                    <Link href="/sign-in">
                      <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
                        Try Demo
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <Image
                    src={"/header.png"}
                    alt="Header Image"
                    width={500}
                    height={500}
                    className="w-full max-w-[400px] rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                    Features Designed for Parents
                  </h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Everything you need to track your child's development in one place
                  </p>
                </div>
              </div>
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M18 8a6 6 0 0 0-6-6 6 6 0 0 0-6 6c0 7 6 13 6 13s6-6 6-13Z" />
                      <circle cx="12" cy="8" r="2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Sleep Tracking</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Monitor sleep patterns, duration, and quality to establish healthy routines.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
                      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                      <path d="M12 2v2" />
                      <path d="M12 22v-2" />
                      <path d="m17 20.66-1-1.73" />
                      <path d="M11 10.27 7 3.34" />
                      <path d="m20.66 17-1.73-1" />
                      <path d="m3.34 7 1.73 1" />
                      <path d="M14 12h8" />
                      <path d="M2 12h2" />
                      <path d="m20.66 7-1.73 1" />
                      <path d="m3.34 17 1.73-1" />
                      <path d="m17 3.34-1 1.73" />
                      <path d="m7 20.66 1-1.73" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Feeding Tracking</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Log feeding times, amounts, and types to ensure proper nutrition.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7H2Z" />
                      <path d="M6 11V7c0-1.1.9-2 2-2h3" />
                      <path d="M18 11V7c0-1.1-.9-2-2-2h-3" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Diaper Tracking</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Keep track of diaper changes to ensure your child's health and comfort.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M2 12h20" />
                      <path d="M2 12a10 10 0 0 1 20 0" />
                      <path d="M2 12a10 10 0 0 0 20 0" />
                      <path d="M12 2v20" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Growth Metrics</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Track height, weight, and head circumference to monitor physical development.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <path d="M3.29 7 12 12l8.71-5" />
                      <path d="M12 22V12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">AI Insights</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Get personalized recommendations and predictions based on your child's data.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Customizable</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Tailor the app to your needs with customizable tracking options and notifications.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                    Trusted by Parents Worldwide
                  </h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Join thousands of parents who use KinderGrow to track their child's development
                  </p>
                </div>
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-5 w-5 text-yellow-500"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-muted-foreground">
                      "KinderGrow has been a game-changer for our family. The sleep tracking features helped us
                      establish a consistent routine for our twins."
                    </p>
                    <p className="font-semibold">- Sarah M., Mother of twins</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-5 w-5 text-yellow-500"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-muted-foreground">
                      "The AI insights are incredibly helpful. I was amazed when the app predicted my son's growth spurt
                      a week before it happened!"
                    </p>
                    <p className="font-semibold">- David L., Father of one</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-5 w-5 text-yellow-500"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-muted-foreground">
                      "As a pediatrician, I recommend KinderGrow to all my patients. The detailed tracking helps parents
                      stay informed about their child's development."
                    </p>
                    <p className="font-semibold">- Dr. Emily R., Pediatrician</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Ready to Start Tracking?</h2>
                  <p className="max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Sign up today and get access to all features. No credit card required.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/sign-up">
                    <Button size="lg" variant="secondary" className="w-full min-[400px]:w-auto">
                      Get Started for Free
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
        <footer className="w-full py-6 md:py-12 border-t">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-4">
                <div className="flex items-center gap-1 font-bold">
                  <Image src={"/logo.png"} alt="Logo" width={50} height={50} className="rounded-full" />
                  <span className="text-lg">KinderGrow</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Track your child's development with ease. Get insights and recommendations for optimal growth.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Product</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/features" className="text-muted-foreground hover:text-foreground">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Company</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/about" className="text-muted-foreground hover:text-foreground">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-muted-foreground hover:text-foreground">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/cookies" className="text-muted-foreground hover:text-foreground">
                      Cookie Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-xs text-muted-foreground">© 2025 KinderGrow. All rights reserved.</p>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                  <span className="sr-only">Facebook</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                  </svg>
                  <span className="sr-only">Instagram</span>
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

