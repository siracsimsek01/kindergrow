"use client"

import { useState, useEffect, useCallback } from "react"
import { Check, ChevronDown, Plus, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useChildContext } from "@/contexts/child-context"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export function ChildSelector() {
  const { selectedChild, setSelectedChild, children, isLoading, setIsAddChildModalOpen, triggerRefresh } =
    useChildContext()
  const [open, setOpen] = useState(false)

  // Refresh the child list when the component mounts
  useEffect(() => {
    triggerRefresh()
  }, [triggerRefresh])

  const handleAddChild = useCallback(() => {
    setOpen(false)
    // Add a small delay to prevent UI freezing
    setTimeout(() => {
      setIsAddChildModalOpen(true)
    }, 100)
  }, [setOpen, setIsAddChildModalOpen])

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a child"
          className="w-[200px] justify-between"
        >
          {selectedChild ? (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4" />
              </div>
              <span className="truncate">{selectedChild.name}</span>
            </div>
          ) : (
            <span>Select a child</span>
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search children..." />
          <CommandList>
            <CommandEmpty>No children found.</CommandEmpty>
            <CommandGroup>
              {children.map((child) => (
                <CommandItem
                  key={child.id}
                  value={child.name}
                  onSelect={() => {
                    setSelectedChild(child)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4" />
                    </div>
                    <span>{child.name}</span>
                  </div>
                  <Check
                    className={cn("ml-auto h-4 w-4", selectedChild?.id === child.id ? "opacity-100" : "opacity-0")}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={handleAddChild}>
                <Plus className="mr-2 h-4 w-4" />
                Add Child
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
