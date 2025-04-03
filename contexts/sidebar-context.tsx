"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  isMobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  toggle: () => {},
  isMobileOpen: false,
  setMobileOpen: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const [isMobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)

    // Check if there's a saved preference in localStorage
    const savedState = localStorage.getItem("sidebar-state")
    if (savedState) {
      setIsOpen(savedState === "open")
    }

    // Close mobile sidebar on window resize
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    // Save preference to localStorage
    localStorage.setItem("sidebar-state", newState ? "open" : "closed")
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, isMobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

