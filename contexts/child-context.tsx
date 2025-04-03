"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { useToast } from "@/components/ui/use-toast"
import { AddChildModal } from "@/components/add-child-modal"
import { AddEventModal } from "@/components/add-event-modal"

// Define the context type with expanded functionality
interface ChildContextType {
  selectedChild: any | null
  setSelectedChild: (child: any | null) => void
  children: any[]
  isLoading: boolean
  isAddEventModalOpen: boolean
  setIsAddEventModalOpen: (isOpen: boolean, eventType?: string) => void
  isAddChildModalOpen: boolean
  setIsAddChildModalOpen: (isOpen: boolean) => void
  eventType: string | null
  lastUpdated: number
  triggerRefresh: () => void
  isRefreshing: boolean
  enableAutoRefresh: (enabled: boolean) => void
  autoRefreshEnabled: boolean
}

// Create the context with default values
const ChildContext = createContext<ChildContextType>({
  selectedChild: null,
  setSelectedChild: () => {},
  children: [],
  isLoading: true,
  isAddEventModalOpen: false,
  setIsAddEventModalOpen: () => {},
  isAddChildModalOpen: false,
  setIsAddChildModalOpen: () => {},
  eventType: null,
  lastUpdated: Date.now(),
  triggerRefresh: () => {},
  isRefreshing: false,
  enableAutoRefresh: () => {},
  autoRefreshEnabled: false,
})

// Custom hook to use the child context
export const useChildContext = () => useContext(ChildContext)

// Provider component
export const ChildProvider = ({ children: reactChildren }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser()
  const { toast } = useToast()
  const [selectedChild, setSelectedChild] = useState<any | null>(null)
  const [children, setChildren] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false)
  const [eventType, setEventType] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(Date.now())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Function to handle opening/closing the add event modal
  const handleSetIsAddEventModalOpen = useCallback((isOpen: boolean, type?: string) => {
    if (isOpen && type) {
      setEventType(type)
    }

    setIsAddEventModalOpen(isOpen)

    if (!isOpen) {
      // Only clear event type when closing the modal
      setTimeout(() => setEventType(null), 300)
    }
  }, [])

  // Function to handle opening/closing the add child modal
  const handleSetIsAddChildModalOpen = useCallback((isOpen: boolean) => {
    setIsAddChildModalOpen(isOpen)
  }, [])

  // Function to trigger a refresh of the data
  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true)
    setLastUpdated(Date.now())

    // Set a timeout to reset the refreshing state after a short delay
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }, [])

  // Function to enable/disable auto-refresh
  const enableAutoRefresh = useCallback(
    (enabled: boolean) => {
      setAutoRefreshEnabled(enabled)

      // Clear existing interval if any
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }

      // Set up new interval if enabled
      if (enabled) {
        const interval = setInterval(() => {
          triggerRefresh()
        }, 60000) // Refresh every minute

        setRefreshInterval(interval)
      }
    },
    [refreshInterval, triggerRefresh],
  )

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [refreshInterval])

  // Load children when user is loaded or lastUpdated changes
  useEffect(() => {
    const loadChildren = async () => {
      if (!isLoaded || !user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await fetch("/api/children")

        if (!response.ok) {
          throw new Error("Failed to fetch children")
        }

        const data = await response.json()
        setChildren(data)

        // If there are children, select the first one by default
        // or restore the previously selected child if it exists
        if (data.length > 0) {
          const storedChildId = localStorage.getItem("selectedChildId")

          if (storedChildId) {
            const storedChild = data.find((child: any) => child._id === storedChildId)
            if (storedChild) {
              setSelectedChild(storedChild)
            } else {
              setSelectedChild(data[0])
              localStorage.setItem("selectedChildId", data[0]._id)
            }
          } else {
            setSelectedChild(data[0])
            localStorage.setItem("selectedChildId", data[0]._id)
          }
        } else {
          // No children found, clear selected child
          setSelectedChild(null)
          localStorage.removeItem("selectedChildId")
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error loading children:", error)
        toast({
          title: "Error",
          description: "Failed to load children. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    loadChildren()
  }, [isLoaded, user, toast, lastUpdated])

  // Update localStorage when selected child changes
  useEffect(() => {
    if (selectedChild) {
      localStorage.setItem("selectedChildId", selectedChild._id)
    }
  }, [selectedChild])

  const contextValue = {
    selectedChild,
    setSelectedChild,
    children,
    isLoading,
    isAddEventModalOpen,
    setIsAddEventModalOpen: handleSetIsAddEventModalOpen,
    isAddChildModalOpen,
    setIsAddChildModalOpen: handleSetIsAddChildModalOpen,
    eventType,
    lastUpdated,
    triggerRefresh,
    isRefreshing,
    enableAutoRefresh,
    autoRefreshEnabled,
  }

  // Handle success callbacks from modals
  const handleChildAdded = useCallback(() => {
    triggerRefresh()
    toast({
      title: "Success",
      description: "Child added successfully",
    })
  }, [triggerRefresh, toast])

  const handleEventAdded = useCallback(() => {
    triggerRefresh()
    toast({
      title: "Success",
      description: "Event added successfully",
    })
  }, [triggerRefresh, toast])

  return (
    <ChildContext.Provider value={contextValue}>
      {reactChildren}
      <AddChildModal
        open={isAddChildModalOpen}
        onOpenChange={handleSetIsAddChildModalOpen}
        onSuccess={handleChildAdded}
      />
      <AddEventModal
        open={isAddEventModalOpen}
        onOpenChange={(isOpen) => handleSetIsAddEventModalOpen(isOpen)}
        eventType={eventType}
        onSuccess={handleEventAdded}
      />
    </ChildContext.Provider>
  )
}

