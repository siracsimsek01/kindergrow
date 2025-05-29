import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BedDouble, Moon, Sun, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { SleepFormModal } from "@/components/sleep-form-modal"
import { useEffect, useState } from "react"

export function SleepEntries() {

  const [entries, setEntries] = useState([])

  useEffect(() => {
    // Fetch sleep entries from the API or state management
    // This is just a placeholder for your actual data fetching logic
    const fetchSleepEntries = async () => {
      // Replace with your actual API call
      const response = await fetch("/api/sleep-entries")
      const data = await response.json()
      setEntries(data)
    }

    fetchSleepEntries()
  })


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sleep Entries</CardTitle>
          <CardDescription>Recent sleep records for your children</CardDescription>
        </div>
        <SleepFormModal>
          <Button variant="outline" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </SleepFormModal>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-4">
              <Avatar className="h-9 w-9">
                <AvatarImage src={entry.avatar} alt={entry.child} />
                <AvatarFallback>{entry.child[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{entry.child}</h4>
                  <Badge variant={entry.type === "Night" ? "default" : "secondary"} className="rounded-sm">
                    {entry.type === "Night" ? <Moon className="mr-1 h-3 w-3" /> : <Sun className="mr-1 h-3 w-3" />}
                    {entry.type}
                  </Badge>
                  <Badge variant="outline" className="rounded-sm">
                    {entry.quality}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <BedDouble className="mr-1 h-4 w-4" />
                  <span className="font-medium">{entry.duration}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {entry.startTime} to {entry.endTime}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <SleepFormModal>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit Entry</DropdownMenuItem>
                  </SleepFormModal>
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

