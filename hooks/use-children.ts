"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"

interface Child {
  _id: string
  id: string
  parentId: string
  name: string
  dateOfBirth: string
  sex: "Male" | "Female"
  photoUrl: string | null
  createdAt?: string
  updatedAt?: string
}

export function useChildren() {
  const { userId, isLoaded } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)

  const fetchChildren = useCallback(async () => {
    if (!isLoaded || !userId) return

    try {
      setIsLoading(true)
      
      const response = await fetch("/api/children")

      if (!response.ok) {
        throw new Error(`Failed to fetch children: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setChildren(data)

      // Set the first child as selected if none is selected
      if (!selectedChild && data.length > 0) {
        setSelectedChild(data[0])
      } else if (selectedChild && !data.find((child) => child.id === selectedChild.id)) {
        // If the currently selected child no longer exists in the data, reset selection
        setSelectedChild(data.length > 0 ? data[0] : null)
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoaded, userId, selectedChild])

  useEffect(() => {
    if (isLoaded && userId) {
      fetchChildren()
    } else if (isLoaded && !userId) {
      
      setChildren([])
      setSelectedChild(null)
    }
  }, [isLoaded, userId, fetchChildren])

  const addChild = useCallback(
    async (childData: { name: string; dateOfBirth: string; sex: "Male" | "Female" }) => {
      if (!userId) {
        throw new Error("You must be logged in to add a child")
      }

      try {
        console.log("Adding child:", childData)
        const response = await fetch("/api/children", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(childData),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to add child: ${response.status} ${response.statusText} - ${errorText}`)
        }

        const newChild = await response.json()
        console.log("New child added:", newChild)

        setChildren((prev) => [...prev, newChild])

        
        if (children.length === 0) {
          setSelectedChild(newChild)
        }

        return newChild
      } catch (err) {
        console.error("Error in addChild:", err)
        setError(err as Error)
        throw err
      }
    },
    [children.length, userId],
  )

  return {
    children,
    selectedChild,
    setSelectedChild,
    isLoading,
    error,
    addChild,
    refreshChildren: fetchChildren,
  }
}

