"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  toggle: () => {},
  setOpen: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Check for saved state in localStorage
  useEffect(() => {
    setMounted(true)
    const savedState = localStorage.getItem("sidebarOpen")
    if (savedState !== null) {
      setIsOpen(savedState === "true")
    }
  }, [])

  const toggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    if (mounted) {
      localStorage.setItem("sidebarOpen", String(newState))
    }
  }

  const setOpen = (open: boolean) => {
    setIsOpen(open)
    if (mounted) {
      localStorage.setItem("sidebarOpen", String(open))
    }
  }

  return <SidebarContext.Provider value={{ isOpen, toggle, setOpen }}>{children}</SidebarContext.Provider>
}

export const useSidebar = () => useContext(SidebarContext)

