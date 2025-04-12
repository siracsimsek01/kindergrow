"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useChildContext } from "@/contexts/child-context"
import { useSidebar } from "@/contexts/sidebar-context"
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

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()
  const { children, selectedChild, setSelectedChild, setIsAddChildModalOpen, setIsAddEventModalOpen } =
    useChildContext()

  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Handle window resize for mobile menu
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile header */}
      <div className={`md:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-3 bg-sidebar-background border-b border-border z-30`}>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="mr-2 h-10 w-10 rounded-full hover:bg-primary/10 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/dashboard" className="flex items-center">
            <div className="relative w-[40px] h-[40px]">
              <Image src="/logo.png" alt="KinderGrow Logo" fill className="object-contain" priority />
            </div>
            <span className="text-xl font-semibold">KinderGrow</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAddEventModalOpen(true)}
            disabled={!selectedChild}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Sidebar for desktop and mobile */}
      <div
        data-sidebar={isMobileMenuOpen ? "mobile" : ""}
        className={cn(
          "fixed top-0 left-0 h-screen flex flex-col border-r bg-sidebar-background text-sidebar-foreground z-50 sidebar-transition",
          isOpen ? "w-64" : "w-16",
          isMobileMenuOpen ? "sidebar-mobile-open" : "sidebar-mobile-closed md:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          {isOpen ? (
            <Link href="/dashboard" className="flex items-center font-semibold">
              <div className="relative">
                <Image src="/logo.png" alt="KinderGrow Logo" width={50} height={50}  className="object-contain" priority />
              </div>
              <span className="text-xl ml-2">KinderGrow</span>
            </Link>
          ) : (
            <Link href="/dashboard" className="flex w-full items-center justify-center">
              <div className="relative w-[32px] h-[32px]">
                <Image src="/logo.png" alt="KinderGrow Logo" fill className="object-contain" priority />
              </div>
            </Link>
          )}

          <div className="flex items-center">
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden h-10 w-10 rounded-full hover:bg-primary/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Toggle button for desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="hidden md:flex h-10 w-10 rounded-full hover:bg-primary/10 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              {selectedChild ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2 py-1 h-auto">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {selectedChild.name?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{selectedChild.name}</span>
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
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
                  size="sm"
                  onClick={() => setIsAddChildModalOpen(true)}
                  className="text-sm opacity-70"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Child
                </Button>
              )}
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 py-2">
          <div className="px-2 py-2">
            {isOpen && <h3 className="mb-2 px-4 text-xs font-semibold uppercase opacity-70">Navigation</h3>}
            <nav className="grid gap-1">
              <NavItem href="/dashboard" icon={<Home className="h-4 w-4" />} label="Dashboard" isOpen={isOpen} />
              <NavItem
                href="/dashboard/sleep"
                icon={<Moon className="h-4 w-4" />}
                label="Sleep Tracking"
                isOpen={isOpen}
              />
              <NavItem
                href="/dashboard/feeding"
                icon={<Utensils className="h-4 w-4" />}
                label="Feeding Tracking"
                isOpen={isOpen}
              />
              <NavItem
                href="/dashboard/diaper"
                icon={<Baby className="h-4 w-4" />}
                label="Diaper Tracking"
                isOpen={isOpen}
              />
              <NavItem
                href="/dashboard/medications"
                icon={<Pill className="h-4 w-4" />}
                label="Medications"
                isOpen={isOpen}
              />
              <NavItem
                href="/dashboard/temperature"
                icon={<Thermometer className="h-4 w-4" />}
                label="Temperature"
                isOpen={isOpen}
              />
              <NavItem
                href="/dashboard/growth"
                icon={<LineChart className="h-4 w-4" />}
                label="Growth Metrics"
                isOpen={isOpen}
              />
              <NavItem
                href="/dashboard/reports"
                icon={<FileText className="h-4 w-4" />}
                label="Reports"
                isOpen={isOpen}
              />
              <NavItem href="/seed" icon={<Database className="h-4 w-4" />} label="Seed Database" isOpen={isOpen} />
            </nav>
          </div>
        </ScrollArea>

        <div className="mt-auto border-t border-border p-4">
          {isOpen ? (
            <Button className="w-full" onClick={() => setIsAddEventModalOpen(true)} disabled={!selectedChild}>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          ) : (
            <div className="flex justify-center">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsAddEventModalOpen(true)}
                title="Add Event"
                disabled={!selectedChild}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            {isOpen ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <UserButton afterSignOutUrl="/" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Account</span>
                    <span className="text-xs opacity-70">Manage profile</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center w-full">
                <UserButton afterSignOutUrl="/" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isOpen: boolean
}

function NavItem({ href, icon, label, isOpen }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        isActive ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-primary/10",
        !isOpen && "justify-center px-2",
      )}
    >
      {icon}
      {isOpen && <span>{label}</span>}
    </Link>
  )
}

