"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MedicationEntriesTable } from "@/components/medication-entries-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MedicationFormModal } from "./medication-form-modal"

export default function MedicationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Medication Tracking</h1>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Medication
        </Button>
      </div>

      <Tabs defaultValue="entries" className="w-full">
        <TabsList>
          <TabsTrigger value="entries">All Entries</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
        </TabsList>
        <TabsContent value="entries" className="space-y-4">
          <MedicationEntriesTable />
        </TabsContent>
        <TabsContent value="prescriptions" className="space-y-4">
          <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">Prescription management coming soon</p>
          </div>
        </TabsContent>
      </Tabs>

      <MedicationFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}

