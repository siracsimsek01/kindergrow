"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect, useCallback, useRef, useMemo } from "react"
import { useUser } from "@clerk/nextjs"
import { useToast } from "@/components/ui/use-toast"
import { AddChildModal } from "@/components/add-child-modal"
import { AddEventModal } from "@/components/add-event-modal"
import { EventTypeSelectorModal } from "@/components/event-type-selector-modal"
import { getSafeTimestamp } from '@/lib/date-utils'

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
  isEventTypeSelectorOpen: boolean
  setIsEventTypeSelectorOpen: (isOpen: boolean) => void
  eventType: string | null
  lastUpdated: number
  triggerRefresh: () => void
  isRefreshing: boolean
  enableAutoRefresh: (enabled: boolean) => void
  autoRefreshEnabled: boolean
  addChildDirectly: (child: any) => void
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
  isEventTypeSelectorOpen: false,
  setIsEventTypeSelectorOpen: () => {},
  eventType: null,
  lastUpdated: getSafeTimestamp(),
  triggerRefresh: () => {},
  isRefreshing: false,
  enableAutoRefresh: () => {},
  autoRefreshEnabled: false,
  addChildDirectly: () => {},
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
  const [isEventTypeSelectorOpen, setIsEventTypeSelectorOpen] = useState(false)
  const [eventType, setEventType] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(getSafeTimestamp())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Use refs to prevent stale closures in event handlers
  const isAddChildModalOpenRef = useRef(isAddChildModalOpen)
  const isAddEventModalOpenRef = useRef(isAddEventModalOpen)
  const isEventTypeSelectorOpenRef = useRef(isEventTypeSelectorOpen)

  // Update refs when state changes
  useEffect(() => {
    isAddChildModalOpenRef.current = isAddChildModalOpen
  }, [isAddChildModalOpen])

  useEffect(() => {
    isAddEventModalOpenRef.current = isAddEventModalOpen
  }, [isAddEventModalOpen])

  useEffect(() => {
    isEventTypeSelectorOpenRef.current = isEventTypeSelectorOpen
  }, [isEventTypeSelectorOpen])

  // Function to handle opening/closing the add event modal
  const handleSetIsAddEventModalOpen = useCallback((isOpen: boolean, type?: string) => {
    if (isOpen && type) {
      setEventType(type)
      setIsAddEventModalOpen(true)
    } else if (isOpen && !type) {
      // If no type is provided, open the event type selector instead
      setIsEventTypeSelectorOpen(true)
    } else {
      setIsAddEventModalOpen(false)
      // Only clear event type when closing the modal
      setTimeout(() => setEventType(null), 300)
    }
  }, [])

  // Function to handle opening/closing the add child modal
  const handleSetIsAddChildModalOpen = useCallback((isOpen: boolean) => {
    setIsAddChildModalOpen(isOpen)
  }, [])

  // Function to handle opening/closing the event type selector
  const handleSetIsEventTypeSelectorOpen = useCallback((isOpen: boolean) => {
    setIsEventTypeSelectorOpen(isOpen)
  }, [])

  // Function to trigger a refresh of the data
  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true)
    setLastUpdated(getSafeTimestamp())
    setRefreshKey(prev => prev + 1)
    
    // Don't clear children and selected child immediately to prevent UI flash
    // They will be updated when new data loads
    
    // Preserve the current selected child during refresh
    // The loadChildren function will handle maintaining the selection appropriately
    
    // Reduce the timeout to make the refresh feel more responsive
    setTimeout(() => {
      setIsRefreshing(false)
    }, 300) // Reduced from 500ms to 300ms for better UX
  }, [])

  // Function to add a child directly to the context without full refresh
  const addChildDirectly = useCallback((newChild: any) => {
    // Normalize child object to always have both id and _id as strings
    const normalizedChild = {
      ...newChild,
      id: newChild.id || newChild._id?.toString(),
      _id: newChild._id?.toString() || newChild.id,
    }
    setChildren(prev => {
      const updated = [...prev, normalizedChild]
      // If this is the first child, select it
      if (prev.length === 0) {
        setSelectedChild(normalizedChild)
        localStorage.setItem("selectedChildId", normalizedChild._id)
      }
      return updated
    })
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

        // If there are children, try to restore the previously selected child first
        if (data.length > 0) {
          const storedChildId = localStorage.getItem("selectedChildId")
          const currentSelectedId = selectedChild?._id

          if (storedChildId) {
            const storedChild = data.find((child: any) => child._id === storedChildId)
            if (storedChild) {
              // Only set if it's different from current selection to prevent unnecessary re-renders
              if (!selectedChild || selectedChild._id !== storedChild._id) {
                setSelectedChild(storedChild)
              }
            } else {
              // Stored child not found, but if we have a current selection, try to keep it
              if (currentSelectedId) {
                const currentChild = data.find((child: any) => child._id === currentSelectedId)
                if (currentChild) {
                  // Current selection still exists in the data, keep it and update localStorage
                  setSelectedChild(currentChild)
                  localStorage.setItem("selectedChildId", currentChild._id)
                } else {
                  // Current selection doesn't exist, select first child
                  setSelectedChild(data[0])
                  localStorage.setItem("selectedChildId", data[0]._id)
                }
              } else {
                // No current selection, select first child
                setSelectedChild(data[0])
                localStorage.setItem("selectedChildId", data[0]._id)
              }
            }
          } else {
            // No stored child, but check if we have a current selection to preserve
            if (currentSelectedId) {
              const currentChild = data.find((child: any) => child._id === currentSelectedId)
              if (currentChild) {
                // Current selection exists, keep it and update localStorage
                setSelectedChild(currentChild)
                localStorage.setItem("selectedChildId", currentChild._id)
              } else {
                // Current selection doesn't exist, select first child
                setSelectedChild(data[0])
                localStorage.setItem("selectedChildId", data[0]._id)
              }
            } else {
              // No current selection, select first child
              setSelectedChild(data[0])
              localStorage.setItem("selectedChildId", data[0]._id)
            }
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

  // Update localStorage when selected child changes (with throttling)
  useEffect(() => {
    if (selectedChild) {
      // Use setTimeout to throttle localStorage updates
      const timeoutId = setTimeout(() => {
        localStorage.setItem("selectedChildId", selectedChild._id)
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [selectedChild?._id]) // Only depend on the ID to prevent unnecessary updates

  const contextValue = useMemo(() => ({
    selectedChild,
    setSelectedChild,
    children,
    isLoading,
    isAddEventModalOpen,
    setIsAddEventModalOpen: handleSetIsAddEventModalOpen,
    isAddChildModalOpen,
    setIsAddChildModalOpen: handleSetIsAddChildModalOpen,
    isEventTypeSelectorOpen,
    setIsEventTypeSelectorOpen: handleSetIsEventTypeSelectorOpen,
    eventType,
    lastUpdated,
    triggerRefresh,
    isRefreshing,
    enableAutoRefresh,
    autoRefreshEnabled,
    addChildDirectly,
  }), [
    selectedChild,
    children,
    isLoading,
    isAddEventModalOpen,
    handleSetIsAddEventModalOpen,
    isAddChildModalOpen,
    handleSetIsAddChildModalOpen,
    isEventTypeSelectorOpen,
    handleSetIsEventTypeSelectorOpen,
    eventType,
    lastUpdated,
    triggerRefresh,
    isRefreshing,
    enableAutoRefresh,
    autoRefreshEnabled,
    addChildDirectly,
  ])

  // Handle success callbacks from modals
  const handleChildAdded = useCallback(() => {
    // Child is now added directly via addChildDirectly, no need to refresh
    // The modal handles its own success toast
  }, [])

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
      {/* Use key to force re-render and prevent stale state */}
      <AddChildModal
        key={`child-modal-${isAddChildModalOpen}`}
        open={isAddChildModalOpen}
        onOpenChange={handleSetIsAddChildModalOpen}
        onSuccess={handleChildAdded}
      />
      <AddEventModal
        key={`event-modal-${isAddEventModalOpen}-${eventType}`}
        open={isAddEventModalOpen}
        onOpenChange={(isOpen) => handleSetIsAddEventModalOpen(isOpen)}
        eventType={eventType}
        onSuccess={handleEventAdded}
      />
      <EventTypeSelectorModal
        key={`event-selector-${isEventTypeSelectorOpen}`}
        open={isEventTypeSelectorOpen}
        onOpenChange={handleSetIsEventTypeSelectorOpen}
      />
    </ChildContext.Provider>
  )
}
