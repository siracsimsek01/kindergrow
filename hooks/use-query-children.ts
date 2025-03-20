"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

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

export function useQueryChildren() {
  const queryClient = useQueryClient()

  // Fetch all children
  const {
    data: children = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: async () => {
      const response = await fetch("/api/children")
      if (!response.ok) {
        throw new Error(`Failed to fetch children: ${response.status} ${response.statusText}`)
      }
      return response.json()
    },
  })

  // Add a child
  const addChildMutation = useMutation({
    mutationFn: async (childData: { name: string; dateOfBirth: string; sex: "Male" | "Female" }) => {
      const response = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(childData),
      })

      if (!response.ok) {
        throw new Error(`Failed to add child: ${response.status} ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch the children query
      queryClient.invalidateQueries({ queryKey: ["children"] })
    },
  })

  // Update a child
  const updateChildMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Child> }) => {
      const response = await fetch(`/api/children/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to update child: ${response.status} ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch the children query
      queryClient.invalidateQueries({ queryKey: ["children"] })
    },
  })

  // Delete a child
  const deleteChildMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/children/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete child: ${response.status} ${response.statusText}`)
      }

      return id
    },
    onSuccess: () => {
      // Invalidate and refetch the children query
      queryClient.invalidateQueries({ queryKey: ["children"] })
    },
  })

  return {
    children,
    isLoading,
    error,
    refetch,
    addChild: addChildMutation.mutate,
    updateChild: updateChildMutation.mutate,
    deleteChild: deleteChildMutation.mutate,
    isAddingChild: addChildMutation.isPending,
    isUpdatingChild: updateChildMutation.isPending,
    isDeletingChild: deleteChildMutation.isPending,
  }
}

