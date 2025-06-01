"use client"

import type React from "react"

import { useState } from "react"
import { useChildContext } from "@/contexts/child-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, FileText, Trash2, Edit, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { getSafeUniqueId } from "@/lib/date-utils"

// Sample prescription data
const samplePrescriptions = [
  {
    id: "1",
    name: "Amoxicillin",
    doctor: "Dr. Smith",
    date: new Date(2025, 2, 15),
    dosage: "250mg",
    frequency: "3 times daily",
    duration: "7 days",
    notes: "Take with food. Complete the full course.",
    status: "active",
  },
  {
    id: "2",
    name: "Ibuprofen",
    doctor: "Dr. Johnson",
    date: new Date(2025, 2, 10),
    dosage: "100mg",
    frequency: "As needed",
    duration: "5 days",
    notes: "For fever and pain relief.",
    status: "completed",
  },
]

export function PrescriptionManagement() {
  const { selectedChild } = useChildContext()
  const [prescriptions, setPrescriptions] = useState(samplePrescriptions)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const [newPrescription, setNewPrescription] = useState({
    name: "",
    doctor: "",
    date: new Date(),
    dosage: "",
    frequency: "",
    duration: "",
    notes: "",
    status: "active",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewPrescription((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewPrescription((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddPrescription = () => {
    const prescription = {
      ...newPrescription,
      id: getSafeUniqueId("prescription"),
      date: selectedDate || new Date(),
    }

    setPrescriptions((prev) => [prescription, ...prev])
    setIsAddDialogOpen(false)

    // Reset form
    setNewPrescription({
      name: "",
      doctor: "",
      date: new Date(),
      dosage: "",
      frequency: "",
      duration: "",
      notes: "",
      status: "active",
    })
    setSelectedDate(new Date())
  }

  const handleDeletePrescription = (id: string) => {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "completed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "expired":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  if (!selectedChild) {
    return (
      <Card>
        <CardContent className="flex h-[400px] items-center justify-center">
          <p className="text-muted-foreground">Select a child to view prescriptions</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Prescriptions</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Prescription</DialogTitle>
              <DialogDescription>Enter the details of the prescription for {selectedChild.name}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Medication Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newPrescription.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Amoxicillin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctor">Prescribing Doctor</Label>
                  <Input
                    id="doctor"
                    name="doctor"
                    value={newPrescription.doctor}
                    onChange={handleInputChange}
                    placeholder="e.g., Dr. Smith"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prescription Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    name="dosage"
                    value={newPrescription.dosage}
                    onChange={handleInputChange}
                    placeholder="e.g., 250mg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Input
                    id="frequency"
                    name="frequency"
                    value={newPrescription.frequency}
                    onChange={handleInputChange}
                    placeholder="e.g., 3 times daily"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    name="duration"
                    value={newPrescription.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 7 days"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select onValueChange={(value) => handleSelectChange("status", value)} defaultValue="active">
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={newPrescription.notes}
                  onChange={handleInputChange}
                  placeholder="Additional instructions or notes"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPrescription}>Add Prescription</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {prescriptions.length === 0 ? (
        <Card>
          <CardContent className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No prescriptions found</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Prescription
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{prescription.name}</CardTitle>
                    <CardDescription>
                      {prescription.doctor} • {format(prescription.date, "MMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Badge className={cn("ml-2", getStatusColor(prescription.status))}>
                    {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Dosage</p>
                      <p className="font-medium">{prescription.dosage}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Frequency</p>
                      <p className="font-medium">{prescription.frequency}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{prescription.duration}</p>
                    </div>
                  </div>
                  {prescription.notes && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-muted-foreground text-xs">Notes</p>
                      <p className="text-sm">{prescription.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4 pb-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" /> Export
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeletePrescription(prescription.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

