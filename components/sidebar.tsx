"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSidebar } from "@/contexts/sidebar-context"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setAddChildModalOpen, setAddEventModalOpen } from "@/lib/redux/slices/uiSlice"
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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useUser } from "@clerk/clerk-react"

// Import the UserButton from Clerk
import { UserButton } from "@clerk/nextjs"

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()
  const dispatch = useAppDispatch()
  const { items: children, selectedChild } = useAppSelector((state) => state.children)
  const [mounted, setMounted] = useState(false)

  const { user } = useUser()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div
      className={cn(
        "fixed top-0 left-0 h-screen flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 z-40",
        isOpen ? "w-64" : "w-16",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        {isOpen ? (
          <Link href="/dashboard" className="flex items-center font-semibold">
            <div className="relative w-[55px] h-[55px]">
              <Image src="/logo.png" alt="KinderGrow Logo" fill className="object-contain" priority />
            </div>
            <span className="text-xl">KinderGrow</span>
          </Link>
        ) : (
          <Link href="/dashboard" className="flex w-full items-center justify-center">
            <div className="relative w-[40px] h-[40px]">
              <Image src="/logo.png" alt="KinderGrow Logo" fill className="object-contain" priority />
            </div>
            <Button variant="ghost" size="icon" onClick={toggle} className="absolute right-0 h-8 w-8">
              <Menu className="h-4 w-4" />
            </Button>
          </Link>
        )}

        <Button variant="ghost" size="icon" onClick={toggle} className="h-8 w-8">
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {isOpen && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            {selectedChild ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 py-1 h-auto">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                        {selectedChild.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{selectedChild.name}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 z-[100]">
                  <DropdownMenuLabel>Switch Child</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {children.map((child) => (
                    <DropdownMenuItem
                      key={child.id}
                      onClick={() => {
                        // Handle child selection
                      }}
                      className={cn("cursor-pointer", child.id === selectedChild.id && "bg-sidebar-accent/20")}
                    >
                      <Avatar className="h-5 w-5 mr-2">
                        <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                          {child.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {child.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => dispatch(setAddChildModalOpen(true))}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Child
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dispatch(setAddChildModalOpen(true))}
                className="text-sm text-muted-foreground"
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
          {isOpen && <h3 className="mb-2 px-4 text-xs font-semibold uppercase text-muted-foreground">Navigation</h3>}
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
          <Button className="w-full" onClick={() => dispatch(setAddEventModalOpen(true))}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        ) : (
          <div className="flex justify-center">
            <Button size="icon" variant="ghost" onClick={() => dispatch(setAddEventModalOpen(true))} title="Add Event">
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
                  <span className="text-sm font-medium">{user?.fullName || "User"}</span>
                  <span className="text-xs text-muted-foreground">Manage profile</span>
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
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/20",
        !isOpen && "justify-center px-2",
      )}
    >
      {icon}
      {isOpen && <span>{label}</span>}
    </Link>
  )
}

