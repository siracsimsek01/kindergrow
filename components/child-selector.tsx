"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
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
  const { selectedChild, setSelectedChild, children, isLoading, setIsAddChildModalOpen } = useChildContext()
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleAddChild = useCallback(() => {
    setOpen(false)
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      setIsAddChildModalOpen(true)
    })
  }, [setIsAddChildModalOpen])

  const handleChildSelect = useCallback((child: any) => {
    // Clear any existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Debounce the selection to prevent rapid changes
    debounceRef.current = setTimeout(() => {
      setSelectedChild(child)
      setOpen(false)
    }, 50) // Small debounce to prevent UI lag
  }, [setSelectedChild])

  // Memoize children list to prevent unnecessary re-renders
  const childrenList = useMemo(() => {
    return children.map((child) => (
      <CommandItem
        key={child.id}
        value={child.name}
        onSelect={() => handleChildSelect(child)}
        className="cursor-pointer hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4" />
          </div>
          <span>{child.name}</span>
        </div>
        <Check
          className={cn("ml-auto h-4 w-4 transition-opacity", selectedChild?.id === child.id ? "opacity-100" : "opacity-0")}
        />
      </CommandItem>
    ))
  }, [children, selectedChild?.id, handleChildSelect])

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
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search children..." className="h-9" />
          <CommandList>
            <CommandEmpty>No children found.</CommandEmpty>
            <CommandGroup>
              {childrenList}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={handleAddChild} className="cursor-pointer">
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
