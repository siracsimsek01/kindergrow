"use client"

import { useQueryChildren } from "@/hooks/use-query-children"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Plus, Edit, Trash } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export function ChildrenListWithQuery() {
  const { children, isLoading, error, addChild, updateChild, deleteChild } = useQueryChildren()
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDeleteChild = async (id: string) => {
    try {
      await deleteChild(id)
      toast({
        title: "Child deleted",
        description: "The child has been successfully deleted.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete child. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-4 text-destructive">
        <p>Error loading children: {error.message}</p>
        <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Children</h2>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Child
        </Button>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40 p-6">
            <p className="text-muted-foreground mb-4">No children added yet</p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Card key={child.id} className={selectedChildId === child.id ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <CardTitle>{child.name}</CardTitle>
                <CardDescription>
                  {format(new Date(child.dateOfBirth), "MMM d, yyyy")} • {child.sex}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteChild(child.id)}>
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

