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
import { SleepForm } from "@/components/forms/sleep-form"

export function SleepEntries() {
  const entries = [
    {
      id: 1,
      child: "Michael",
      type: "Night",
      startTime: "March 2, 2025 - 8:00 PM",
      endTime: "March 3, 2025 - 6:30 AM",
      duration: "10h 30m",
      quality: "Good",
      avatar: "/placeholder.svg",
    },
    {
      id: 2,
      child: "Michael",
      type: "Nap",
      startTime: "March 2, 2025 - 1:15 PM",
      endTime: "March 2, 2025 - 2:45 PM",
      duration: "1h 30m",
      quality: "Excellent",
      avatar: "/placeholder.svg",
    },
    {
      id: 3,
      child: "Emma",
      type: "Nap",
      startTime: "March 2, 2025 - 10:00 AM",
      endTime: "March 2, 2025 - 11:15 AM",
      duration: "1h 15m",
      quality: "Fair",
      avatar: "/placeholder.svg",
    },
    {
      id: 4,
      child: "Michael",
      type: "Night",
      startTime: "March 1, 2025 - 7:30 PM",
      endTime: "March 2, 2025 - 6:00 AM",
      duration: "10h 30m",
      quality: "Good",
      avatar: "/placeholder.svg",
    },
    {
      id: 5,
      child: "Emma",
      type: "Nap",
      startTime: "March 1, 2025 - 1:00 PM",
      endTime: "March 1, 2025 - 3:00 PM",
      duration: "2h 00m",
      quality: "Good",
      avatar: "/placeholder.svg",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sleep Entries</CardTitle>
          <CardDescription>Recent sleep records for your children</CardDescription>
        </div>
        <SleepForm>
          <Button variant="outline" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </SleepForm>
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
                  <SleepForm entry={entry}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit Entry</DropdownMenuItem>
                  </SleepForm>
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

