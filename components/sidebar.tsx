"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useChildContext } from "@/contexts/child-context"
import {
  Home,
  Moon,
  Utensils,
  Baby,
  Pill,
  LineChart,
  FileText,
  Plus,
  Database,
  Thermometer,
  Menu,
  ChevronDown,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserButton } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Sidebar() {
  const pathname = usePathname()
  const { children, selectedChild, setSelectedChild, setIsAddChildModalOpen, setIsAddEventModalOpen } =
    useChildContext()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Handle window resize for mobile menu
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 bg-sidebar-background border-b border-border z-30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src="/images/logo.png"
                alt="KinderGrow Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-semibold">KinderGrow</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsAddEventModalOpen(true)}
            disabled={!selectedChild}
            className="h-9 w-9"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen w-64 flex flex-col border-r bg-sidebar-background text-sidebar-foreground z-50 transition-transform duration-300",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="KinderGrow Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
            <span className="text-xl font-semibold">KinderGrow</span>
          </Link>

          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden h-9 w-9"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Child selector */}
        <div className="border-b border-border px-4 py-3">
          {selectedChild ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 h-auto px-2 py-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {selectedChild.name?.charAt(0) || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium flex-1 text-left">{selectedChild.name}</span>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch Child</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {children.map((child) => (
                  <DropdownMenuItem
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    className={cn("cursor-pointer", child.id === selectedChild.id && "bg-primary/10")}
                  >
                    <Avatar className="h-5 w-5 mr-2">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {child.name?.charAt(0) || "C"}
                      </AvatarFallback>
                    </Avatar>
                    {child.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsAddChildModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Child
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setIsAddChildModalOpen(true)}
              className="w-full justify-start text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <div className="px-2">
            <h3 className="mb-2 px-4 text-xs font-semibold uppercase opacity-70">Navigation</h3>
            <nav className="grid gap-1">
              <NavItem href="/dashboard" icon={<Home className="h-4 w-4" />} label="Dashboard" />
              <NavItem href="/dashboard/sleep" icon={<Moon className="h-4 w-4" />} label="Sleep Tracking" />
              <NavItem href="/dashboard/feeding" icon={<Utensils className="h-4 w-4" />} label="Feeding Tracking" />
              <NavItem href="/dashboard/diaper" icon={<Baby className="h-4 w-4" />} label="Diaper Tracking" />
              <NavItem href="/dashboard/medications" icon={<Pill className="h-4 w-4" />} label="Medications" />
              <NavItem href="/dashboard/temperature" icon={<Thermometer className="h-4 w-4" />} label="Temperature" />
              <NavItem href="/dashboard/growth" icon={<LineChart className="h-4 w-4" />} label="Growth Metrics" />
              <NavItem href="/dashboard/reports" icon={<FileText className="h-4 w-4" />} label="Reports" />
              <NavItem href="/seed" icon={<Database className="h-4 w-4" />} label="Seed Database" />
            </nav>
          </div>
        </ScrollArea>

        {/* Add Event Button */}
        <div className="border-t border-border p-4">
          <Button
            className="w-full"
            onClick={() => setIsAddEventModalOpen(true)}
            disabled={!selectedChild}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>

        {/* User section */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserButton afterSignOutUrl="/" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Account</span>
                <span className="text-xs opacity-70">Manage profile</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
}

function NavItem({ href, icon, label }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        isActive ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-primary/10"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
