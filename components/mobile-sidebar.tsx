"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChildContext } from "@/contexts/child-context"
import { navigationItems } from "@/config/navigation"
import { ChildSelector } from "@/components/child-selector"
import { ThemeToggle } from "@/components/theme-toggle"

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { selectedChild } = useChildContext()

  // Close sidebar when path changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Handle resize to close sidebar on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="lg:hidden">
        <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[280px]">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <span className="text-primary-foreground text-lg font-bold">K</span>
              </div>
              <span className="text-xl font-bold">KinderGrow</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          <div className="p-4">
            <ChildSelector />
          </div>

          <div className="flex-1 overflow-auto py-2">
            <nav className="grid gap-1 px-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-4 border-t flex items-center justify-between">
            <Button variant="outline" size="sm" asChild onClick={() => setOpen(false)}>
              <Link href="/settings">Settings</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

