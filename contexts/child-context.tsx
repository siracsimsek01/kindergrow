"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@clerk/nextjs"

type Child = {
  id: string
  name: string
  birthDate: string // This will be compatible with dateOfBirth
  gender: string // This will be compatible with sex
  createdAt?: Date
  updatedAt?: Date
  userId?: string
}

type ChildContextType = {
  children: Child[]
  selectedChild: Child | null
  setSelectedChild: (child: Child | null) => void
  isLoading: boolean
  isAddChildModalOpen: boolean
  setIsAddChildModalOpen: (open: boolean) => void
  isAddEventModalOpen: boolean
  setIsAddEventModalOpen: (open: boolean, eventType?: string) => void
  eventType: string | null
  lastUpdated: number
  triggerRefresh: () => Promise<void>
  isRefreshing: boolean
  enableAutoRefresh?: (enable: boolean) => void
  autoRefreshEnabled?: boolean
  addChild: (child: { name: string; dateOfBirth: string; sex: string }) => Promise<void>
  getChildren: () => Promise<void>
}

const ChildContext = createContext<ChildContextType | undefined>(undefined)

export function ChildProvider({ children: reactChildren }: { children: ReactNode }) {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false)
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const [eventType, setEventType] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(Date.now())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const { toast } = useToast()
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth()

  const fetchChildren = useCallback(async () => {
    try {
      // Don't fetch if auth isn't loaded yet or user isn't signed in
      if (!isAuthLoaded) {
        console.log("Auth not loaded yet, waiting...")
        return
      }

      if (!isSignedIn) {
        console.log("User not signed in, can't fetch children")
        setChildren([])
        setSelectedChild(null)
        setIsLoading(false)
        return
      }

      setIsRefreshing(true)
      console.log("Fetching children...")

      const response = await fetch("/api/children", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include", // Important for auth cookies
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`Failed to fetch children: ${response.status} ${response.statusText}`, errorText)

        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please sign in to view your children's data.",
            variant: "destructive",
          })
          setChildren([])
          setSelectedChild(null)
        } else {
          toast({
            title: "Error",
            description: `Failed to fetch children: ${response.statusText}`,
            variant: "destructive",
          })
        }
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }

      const data = await response.json()
      console.log("Fetched children:", data)

      // Map the data to ensure compatibility
      const mappedChildren = data.map((child: any) => ({
        id: child.id,
        name: child.name,
        birthDate: child.birthDate || child.dateOfBirth,
        gender: child.gender || child.sex,
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
        userId: child.userId,
      }))

      setChildren(mappedChildren)

      // If we have children but no selected child, select the first one
      if (mappedChildren.length > 0 && !selectedChild) {
        setSelectedChild(mappedChildren[0])
      } else if (selectedChild) {
        // If we have a selected child, make sure it's still in the list
        const childStillExists = mappedChildren.some((child: Child) => child.id === selectedChild.id)
        if (!childStillExists && mappedChildren.length > 0) {
          setSelectedChild(mappedChildren[0])
        } else if (!childStillExists) {
          setSelectedChild(null)
        }
      }

      setLastUpdated(Date.now())
    } catch (error) {
      console.error("Error fetching children:", error)
      toast({
        title: "Error",
        description: "Failed to fetch children. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [isAuthLoaded, isSignedIn, selectedChild, toast])

  // Watch for auth state changes
  useEffect(() => {
    if (isAuthLoaded) {
      fetchChildren()
    }
  }, [isAuthLoaded, isSignedIn, fetchChildren])

  const handleAddEventModalOpen = (open: boolean, type?: string) => {
    setIsAddEventModalOpen(open)
    if (type) {
      setEventType(type)
    } else if (!open) {
      // Only clear event type when closing the modal
      setTimeout(() => setEventType(null), 300)
    }
  }

  const triggerRefresh = useCallback(async () => {
    await fetchChildren()
  }, [fetchChildren])

  const addChild = useCallback(
    async (childData: { name: string; dateOfBirth: string; sex: string }) => {
      try {
        console.log("Adding child:", childData)

        const response = await fetch("/api/children", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: childData.name,
            birthDate: childData.dateOfBirth,
            gender: childData.sex,
          }),
          credentials: "include", // Important for auth cookies
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(`Failed to add child: ${errorData.error || response.statusText}`)
        }

        const newChild = await response.json()
        console.log("Child added successfully:", newChild)

        await fetchChildren()

        // Close the modal after successful addition
        setIsAddChildModalOpen(false)

        toast({
          title: "Success",
          description: `${childData.name} has been added successfully.`,
        })
      } catch (error) {
        console.error("Error adding child:", error)
        toast({
          title: "Error",
          description: "Failed to add child. Please try again.",
          variant: "destructive",
        })
        throw error
      }
    },
    [fetchChildren, toast],
  )

  const enableAutoRefresh = useCallback((enable: boolean) => {
    setAutoRefreshEnabled(enable)
  }, [])

  return (
    <ChildContext.Provider
      value={{
        children,
        selectedChild,
        setSelectedChild,
        isLoading,
        isAddChildModalOpen,
        setIsAddChildModalOpen,
        isAddEventModalOpen,
        setIsAddEventModalOpen: handleAddEventModalOpen,
        eventType,
        lastUpdated,
        triggerRefresh,
        isRefreshing,
        enableAutoRefresh,
        autoRefreshEnabled,
        addChild,
        getChildren: fetchChildren,
      }}
    >
      {reactChildren}
    </ChildContext.Provider>
  )
}

export function useChildContext() {
  const context = useContext(ChildContext)
  if (context === undefined) {
    throw new Error("useChildContext must be used within a ChildProvider")
  }
  return context
}
