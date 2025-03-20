"use client"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setSelectedChild } from "@/lib/redux/slices/childrenSlice"
import { setAddChildModalOpen } from "@/lib/redux/slices/uiSlice"
import { Button } from "@/components/ui/button"
import { Plus, User } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ChildSelector() {
  const dispatch = useAppDispatch()
  const { items: children, selectedChild } = useAppSelector((state) => state.children)

  const handleAddChild = () => {
    dispatch(setAddChildModalOpen(true))
  }

  return (
    <div className="flex items-center justify-between px-2 py-2 border-t border-b">
      <div className="flex items-center gap-2 flex-1">
        {children.length > 0 ? (
          <Select
            value={selectedChild?.id}
            onValueChange={(value) => {
              const child = children.find((c) => c.id === value)
              if (child) dispatch(setSelectedChild(child))
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  <div className="flex items-center gap-2">
                    {child.imageUrl ? (
                      <div className="h-6 w-6 rounded-full overflow-hidden">
                        <img
                          src={child.imageUrl || "/placeholder.svg"}
                          alt={child.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{child.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-muted-foreground px-3">No children added</span>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={handleAddChild} className="h-8 w-8" title="Add Child">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}

