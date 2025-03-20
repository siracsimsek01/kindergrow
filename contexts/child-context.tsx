"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Child = {
  _id?: string
  id?: string
  name: string
  dateOfBirth: string
  sex: "Male" | "Female"
  photoUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

type ChildContextType = {
  children: Child[]
  selectedChild: Child | null
  isLoading: boolean
  error: string | null
  lastUpdated: number
  isAddChildModalOpen: boolean
  isAddEventModalOpen: boolean
  setIsAddChildModalOpen: (open: boolean) => void
  setIsAddEventModalOpen: (open: boolean) => void
  setSelectedChild: (child: Child) => void
  addChild: (childData: Omit<Child, "_id" | "id" | "createdAt" | "updatedAt">) => Promise<Child>
  updateChild: (id: string, data: Partial<Child>) => Promise<void>
  deleteChild: (id: string) => Promise<void>
  refreshChildren: () => Promise<void>
  triggerRefresh: () => void
}

const ChildContext = createContext<ChildContextType | undefined>(undefined)

export function ChildProvider({ children }: { children: ReactNode }) {
  const [childrenData, setChildrenData] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(Date.now())
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false)
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)

  const triggerRefresh = () => {
    setLastUpdated(Date.now())
  }

  const fetchChildren = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/children")

      if (!response.ok) {
        throw new Error(`Failed to fetch children: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched children:", data)

      setChildrenData(data)

      // Select the first child if none is selected
      if (data.length > 0 && !selectedChild) {
        setSelectedChild(data[0])
      } else if (selectedChild && !data.find(child => child.id === selectedChild.id)) {
        // If the currently selected child no longer exists in the data, reset selection
        setSelectedChild(data.length > 0 ? data[0] : null)
      }
    } catch (err) {
      console.error("Error fetching children:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch children")
    } finally {
      setIsLoading(false)
    }
  }

  const addChild = async (childData: Omit<Child, "_id" | "id" | "createdAt" | "updatedAt">) => {
    try {
      console.log("Adding child:", childData)
      const response = await fetch("/api/children", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(childData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to add child")
      }

      const result = await response.json()
      console.log("Child added successfully:", result)

      // Refresh the children list
      await fetchChildren()
      
      return result
    } catch (err) {
      console.error("Error adding child:", err)
      throw err
    }
  }

  const updateChild = async (id: string, data: Partial<Child>) => {
    try {
      const response = await fetch(`/api/children/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to update child")
      }

      // Refresh the children list
      await fetchChildren()
    } catch (err) {
      console.error("Error updating child:", err)
      throw err
    }
  }

  const deleteChild = async (id: string) => {
    try {
      const response = await fetch(`/api/children/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete child")
      }

      // Refresh the children list
      await fetchChildren()

      // If the deleted child was selected, select another one
      if (selectedChild && (selectedChild._id === id || selectedChild.id === id)) {
        setSelectedChild(childrenData.length > 1 ? childrenData.find((c) => c._id !== id && c.id !== id) || null : null)
      }
    } catch (err) {
      console.error("Error deleting child:", err)
      throw err
    }
  }

  useEffect(() => {
    fetchChildren()
  }, [])

  return (
    <ChildContext.Provider
      value={{
        children: childrenData,
        selectedChild,
        isLoading,
        error,
        lastUpdated,
        isAddChildModalOpen,
        isAddEventModalOpen,
        setIsAddChildModalOpen,
        setIsAddEventModalOpen,
        setSelectedChild,
        addChild,
        updateChild,
        deleteChild,
        refreshChildren: fetchChildren,
        triggerRefresh,
      }}
    >
      {children}
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
