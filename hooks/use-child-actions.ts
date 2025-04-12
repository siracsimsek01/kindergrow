"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useChildContext } from "@/contexts/child-context"

interface AddChildParams {
  name: string
  birthDate: string
  gender: string
}

export function useChildActions() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { triggerRefresh } = useChildContext()

  const addChild = async (childData: AddChildParams) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/children", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(childData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to add child")
      }

      const data = await response.json()
      triggerRefresh()
      return data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add child",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getChildren = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/children")

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to fetch children")
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch children",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateChild = async (childId: string, childData: Partial<AddChildParams>) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(childData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update child")
      }

      const data = await response.json()
      triggerRefresh()
      return data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update child",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const deleteChild = async (childId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete child")
      }

      triggerRefresh()
      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete child",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    addChild,
    getChildren,
    updateChild,
    deleteChild,
    isLoading,
  }
}
