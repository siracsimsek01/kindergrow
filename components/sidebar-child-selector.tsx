"use client"

import { useState } from "react"
import { useChildContext } from "@/contexts/child-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { AddChildModal } from "./add-child-modal"

export function SidebarChildSelector() {
  const { children, selectedChild, setSelectedChild } = useChildContext()
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false)

  if (!children.length) {
    return (
      <Card className="border-none shadow-none bg-background/50">
        <CardContent className="p-2">
          <Button variant="outline" className="w-full justify-start" onClick={() => setIsAddChildModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add First Child
          </Button>
          <AddChildModal open={isAddChildModalOpen} onOpenChange={setIsAddChildModalOpen} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-none bg-background/50">
      <CardContent className="p-2 space-y-2">
        <Select
          value={selectedChild?.id}
          onValueChange={(value) => {
            const child = children.find((c) => c.id === value)
            if (child) setSelectedChild(child)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a child" />
          </SelectTrigger>
          <SelectContent>
            {children.map((child) => (
              <SelectItem key={child.id} value={child.id}>
                {child.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => setIsAddChildModalOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Child
        </Button>
        <AddChildModal open={isAddChildModalOpen} onOpenChange={setIsAddChildModalOpen} />
      </CardContent>
    </Card>
  )
}

