"use client";

import { useState, useEffect } from "react";
import { useChildContext } from "@/contexts/child-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  format,
  subDays,
  subMonths,
  subYears,
  addDays,
  isSameDay,
} from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Filter,
  ArrowUpDown,
  Search,
  CalendarIcon,
  BarChart3,
  Clock,
  Pill,
  AlertTriangle,
  Check,
  X,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MedicationCalendar } from "@/components/medication-calendar";
import { MedicationChart } from "@/components/charts/medication-chart";
import { MedicationSchedule } from "@/components/medication-schedule";
import { MedicationForm } from "@/components/forms/medication-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  ChartSkeleton,
  StatCardSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton-loader";
import { getSafeUniqueId } from "@/lib/date-utils";

interface MedicationEvent {
  id: string;
  timestamp: string;
  details: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  timeOfDay: string[];
  instructions: string;
  status: "active" | "completed" | "paused";
  notes: string;
  date: Date;
  administrations: MedicationAdministration[];
}

interface MedicationAdministration {
  id: string;
  medicationId: string;
  timestamp: string;
  takenAt: Date;
  takenBy: string;
  notes: string;
  sideEffects: string;
  skipped: boolean;
  date: Date;
}

export default function MedicationsPage() {
  const {
    selectedChild,
    isLoading: isChildLoading,
    setIsAddEventModalOpen,
  } = useChildContext();
  const [medications, setMedications] = useState<MedicationEvent[]>([]);
  const [administrations, setAdministrations] = useState<
    MedicationAdministration[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "completed" | "paused"
  >("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [timeFrame, setTimeFrame] = useState<
    "week" | "month" | "3months" | "year"
  >("week");
  const [chartView, setChartView] = useState<"bar" | "calendar" | "schedule">(
    "calendar"
  );
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);
  const [isEditMedicationOpen, setIsEditMedicationOpen] = useState(false);
  const [isLogDoseOpen, setIsLogDoseOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] =
    useState<MedicationEvent | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();

  // Fetch medications data
  useEffect(() => {
    const fetchMedications = async () => {
      if (!selectedChild) {
        setMedications([]);
        setAdministrations([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log(`Fetching medications for child ID: ${selectedChild.id}`);

        const response = await fetch(
          `/api/children/${selectedChild.id}/medication`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch medications: ${response.status}`);
        }

        const events = await response.json();
        console.log(`Received ${events.length} medication events`);

        // Process events
        const processedMedications: MedicationEvent[] = [];
        const processedAdministrations: MedicationAdministration[] = [];

        events.forEach((event) => {
          const details = event.details || "";

          // Extract medication details
          let medicationName = "Unknown";
          const nameMatch = details.match(/Medication: (.*?)(?:\n|$)/);
          if (nameMatch) {
            medicationName = nameMatch[1];
          }

          let dosage = "";
          const dosageMatch = details.match(/Dosage: (.*?)(?:\n|$)/);
          if (dosageMatch) {
            dosage = dosageMatch[1];
          }

          let frequency = "";
          const frequencyMatch = details.match(/Frequency: (.*?)(?:\n|$)/);
          if (frequencyMatch) {
            frequency = frequencyMatch[1];
          }

          let instructions = "";
          const instructionsMatch = details.match(
            /Instructions: (.*?)(?:\n|$)/
          );
          if (instructionsMatch) {
            instructions = instructionsMatch[1];
          }

          let notes = "";
          const notesMatch = details.match(/Notes: (.*?)(?:\n|$)/);
          if (notesMatch) {
            notes = notesMatch[1];
          }

          // Determine if this is a medication definition or an administration
          const isAdministration = details.includes("Administration");

          if (isAdministration) {
            // Process as an administration
            let takenBy = "";
            const takenByMatch = details.match(/Taken By: (.*?)(?:\n|$)/);
            if (takenByMatch) {
              takenBy = takenByMatch[1];
            }

            let sideEffects = "";
            const sideEffectsMatch = details.match(
              /Side Effects: (.*?)(?:\n|$)/
            );
            if (sideEffectsMatch) {
              sideEffects = sideEffectsMatch[1];
            }

            let skipped = false;
            const skippedMatch = details.match(/Skipped: (.*?)(?:\n|$)/);
            if (skippedMatch) {
              skipped = skippedMatch[1].toLowerCase() === "true";
            }

            let medicationId = "";
            const medicationIdMatch = details.match(
              /Medication ID: (.*?)(?:\n|$)/
            );
            if (medicationIdMatch) {
              medicationId = medicationIdMatch[1];
            }

            processedAdministrations.push({
              id: event.id,
              medicationId,
              timestamp: event.timestamp,
              takenAt: new Date(event.timestamp),
              takenBy,
              notes,
              sideEffects,
              skipped,
              date: new Date(event.timestamp),
            });
          } else {
            // Process as a medication definition
            let startDate = new Date(event.timestamp);
            const startDateMatch = details.match(/Start Date: (.*?)(?:\n|$)/);
            if (startDateMatch) {
              startDate = new Date(startDateMatch[1]);
            }

            let endDate: Date | undefined = undefined;
            const endDateMatch = details.match(/End Date: (.*?)(?:\n|$)/);
            if (endDateMatch && endDateMatch[1] !== "Ongoing") {
              endDate = new Date(endDateMatch[1]);
            }

            let timeOfDay: string[] = [];
            const timeOfDayMatch = details.match(/Time of Day: (.*?)(?:\n|$)/);
            if (timeOfDayMatch) {
              timeOfDay = timeOfDayMatch[1].split(",").map((t) => t.trim());
            }

            let status: "active" | "completed" | "paused" = "active";
            const statusMatch = details.match(/Status: (.*?)(?:\n|$)/);
            if (statusMatch) {
              status = statusMatch[1].toLowerCase() as
                | "active"
                | "completed"
                | "paused";
            }

            processedMedications.push({
              id: event.id,
              timestamp: event.timestamp,
              details,
              medicationName,
              dosage,
              frequency,
              startDate,
              endDate,
              timeOfDay,
              instructions,
              status,
              notes,
              date: new Date(event.timestamp),
              administrations: [], // Will be populated later
            });
          }
        });

        // Link administrations to medications
        processedMedications.forEach((medication) => {
          medication.administrations = processedAdministrations.filter(
            (admin) => admin.medicationId === medication.id
          );
        });

        setMedications(processedMedications);
        setAdministrations(processedAdministrations);
      } catch (error) {
        console.error("Error fetching medications:", error);
        setError("Failed to fetch medications");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedications();
  }, [selectedChild]);

  // Generate sample data if no data exists
  useEffect(() => {
    if (medications.length === 0 && !isLoading && !error && selectedChild) {
      // Create sample data for demonstration
      const sampleMedications: MedicationEvent[] = [];
      const sampleAdministrations: MedicationAdministration[] = [];
      const today = new Date();

      // Sample medications
      const med1Id = "sample-med-1";
      const med2Id = "sample-med-2";
      const med3Id = "sample-med-3";

      // Medication 1: Active, twice daily
      sampleMedications.push({
        id: med1Id,
        timestamp: subDays(today, 10).toISOString(),
        details: "Sample medication 1",
        medicationName: "Amoxicillin",
        dosage: "250mg",
        frequency: "Twice daily",
        startDate: subDays(today, 10),
        endDate: addDays(today, 4),
        timeOfDay: ["Morning", "Evening"],
        instructions: "Take with food",
        status: "active",
        notes: "For ear infection",
        date: subDays(today, 10),
        administrations: [],
      });

      // Medication 2: Completed
      sampleMedications.push({
        id: med2Id,
        timestamp: subDays(today, 20).toISOString(),
        details: "Sample medication 2",
        medicationName: "Ibuprofen",
        dosage: "5ml",
        frequency: "Every 6 hours as needed",
        startDate: subDays(today, 20),
        endDate: subDays(today, 15),
        timeOfDay: ["As needed"],
        instructions: "For fever or pain",
        status: "completed",
        notes: "For fever",
        date: subDays(today, 20),
        administrations: [],
      });

      // Medication 3: Ongoing
      sampleMedications.push({
        id: med3Id,
        timestamp: subDays(today, 30).toISOString(),
        details: "Sample medication 3",
        medicationName: "Vitamin D",
        dosage: "400 IU",
        frequency: "Once daily",
        startDate: subDays(today, 30),
        timeOfDay: ["Morning"],
        instructions: "With breakfast",
        status: "active",
        notes: "Daily supplement",
        date: subDays(today, 30),
        administrations: [],
      });

      // Generate administrations for the past 14 days
      for (let i = 14; i >= 0; i--) {
        const date = subDays(today, i);

        // Amoxicillin administrations (twice daily)
        if (i <= 10 && i >= 0) {
          // Started 10 days ago
          // Morning dose
          sampleAdministrations.push({
            id: `admin-med1-morning-${i}`,
            medicationId: med1Id,
            timestamp: new Date(date.setHours(8, 0, 0, 0)).toISOString(),
            takenAt: new Date(date.setHours(8, 0, 0, 0)),
            takenBy: "Parent",
            notes: i % 5 === 0 ? "Didn't want to take it" : "",
            sideEffects: i === 3 ? "Slight rash" : "",
            skipped: i === 7,
            date: new Date(date),
          });

          // Evening dose
          sampleAdministrations.push({
            id: `admin-med1-evening-${i}`,
            medicationId: med1Id,
            timestamp: new Date(date.setHours(20, 0, 0, 0)).toISOString(),
            takenAt: new Date(date.setHours(20, 0, 0, 0)),
            takenBy: "Parent",
            notes: "",
            sideEffects: "",
            skipped: i === 5,
            date: new Date(date),
          });
        }

        // Vitamin D administrations (once daily)
        if (i <= 30) {
          // Started 30 days ago
          sampleAdministrations.push({
            id: `admin-med3-${i}`,
            medicationId: med3Id,
            timestamp: new Date(date.setHours(9, 0, 0, 0)).toISOString(),
            takenAt: new Date(date.setHours(9, 0, 0, 0)),
            takenBy: "Parent",
            notes: "",
            sideEffects: "",
            skipped: i % 10 === 0, // Occasionally skipped
            date: new Date(date),
          });
        }

        // Ibuprofen administrations (as needed, completed)
        if (i >= 15 && i <= 20) {
          // Between 15 and 20 days ago
          if (i % 2 === 0) {
            // Every other day
            sampleAdministrations.push({
              id: `admin-med2-${i}`,
              medicationId: med2Id,
              timestamp: new Date(date.setHours(14, 0, 0, 0)).toISOString(),
              takenAt: new Date(date.setHours(14, 0, 0, 0)),
              takenBy: "Parent",
              notes: "For fever",
              sideEffects: "",
              skipped: false,
              date: new Date(date),
            });
          }
        }
      }

      // Link administrations to medications
      sampleMedications.forEach((medication) => {
        medication.administrations = sampleAdministrations.filter(
          (admin) => admin.medicationId === medication.id
        );
      });

      setMedications(sampleMedications);
      setAdministrations(sampleAdministrations);
      console.log("Generated sample medications:", sampleMedications.length);
      console.log(
        "Generated sample administrations:",
        sampleAdministrations.length
      );
    }
  }, [medications.length, isLoading, error, selectedChild]);

  const getDayEvents = (day: Date) => {
    return administrations.filter((event) => isSameDay(event.date, day));
  };

  const selectedDateEvents = date ? getDayEvents(date) : [];

  const getFilteredMedications = () => {
    return medications
      .filter((medication) => {
        // Apply search filter
        const matchesSearch =
          medication.medicationName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          medication.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medication.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medication.frequency.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply status filter
        const matchesStatus =
          filterStatus === "all" || medication.status === filterStatus;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        // Apply sort order
        return sortOrder === "asc"
          ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  };

  const getTimeFrameLabel = () => {
    switch (timeFrame) {
      case "week":
        return "Past Week";
      case "month":
        return "Past Month";
      case "3months":
        return "Past 3 Months";
      case "year":
        return "Past Year";
      default:
        return "Past Week";
    }
  };

  const getStartDate = () => {
    const today = new Date();
    switch (timeFrame) {
      case "week":
        return subDays(today, 6);
      case "month":
        return subMonths(today, 1);
      case "3months":
        return subMonths(today, 3);
      case "year":
        return subYears(today, 1);
      default:
        return subDays(today, 6);
    }
  };

  const handleAddMedication = (medication: Partial<MedicationEvent>) => {
    // In a real app, this would send data to the API
    const newMedication: MedicationEvent = {
      id: getSafeUniqueId("medication"),
      timestamp: new Date().toISOString(),
      details: `Medication: ${medication.medicationName}
Dosage: ${medication.dosage}
Frequency: ${medication.frequency}
Start Date: ${medication.startDate?.toISOString()}
End Date: ${medication.endDate?.toISOString() || "Ongoing"}
Time of Day: ${medication.timeOfDay?.join(", ")}
Instructions: ${medication.instructions}
Status: ${medication.status}
Notes: ${medication.notes}`,
      medicationName: medication.medicationName || "",
      dosage: medication.dosage || "",
      frequency: medication.frequency || "",
      startDate: medication.startDate || new Date(),
      endDate: medication.endDate,
      timeOfDay: medication.timeOfDay || [],
      instructions: medication.instructions || "",
      status: medication.status || "active",
      notes: medication.notes || "",
      date: new Date(),
      administrations: [],
    };

    setMedications([newMedication, ...medications]);
    setIsAddMedicationOpen(false);
    toast({
      title: "Medication added",
      description: `${newMedication.medicationName} has been added successfully.`,
    });
  };

  const handleEditMedication = (medication: Partial<MedicationEvent>) => {
    if (!selectedMedication) return;

    // In a real app, this would send data to the API
    const updatedMedication: MedicationEvent = {
      ...selectedMedication,
      medicationName:
        medication.medicationName || selectedMedication.medicationName,
      dosage: medication.dosage || selectedMedication.dosage,
      frequency: medication.frequency || selectedMedication.frequency,
      startDate: medication.startDate || selectedMedication.startDate,
      endDate: medication.endDate,
      timeOfDay: medication.timeOfDay || selectedMedication.timeOfDay,
      instructions: medication.instructions || selectedMedication.instructions,
      status: medication.status || selectedMedication.status,
      notes: medication.notes || selectedMedication.notes,
      details: `Medication: ${
        medication.medicationName || selectedMedication.medicationName
      }
Dosage: ${medication.dosage || selectedMedication.dosage}
Frequency: ${medication.frequency || selectedMedication.frequency}
Start Date: ${(
        medication.startDate || selectedMedication.startDate
      ).toISOString()}
End Date: ${
        (medication.endDate || selectedMedication.endDate)?.toISOString() ||
        "Ongoing"
      }
Time of Day: ${(medication.timeOfDay || selectedMedication.timeOfDay).join(
        ", "
      )}
Instructions: ${medication.instructions || selectedMedication.instructions}
Status: ${medication.status || selectedMedication.status}
Notes: ${medication.notes || selectedMedication.notes}`,
    };

    setMedications(
      medications.map((med) =>
        med.id === selectedMedication.id ? updatedMedication : med
      )
    );
    setIsEditMedicationOpen(false);
    setSelectedMedication(null);
    toast({
      title: "Medication updated",
      description: `${updatedMedication.medicationName} has been updated successfully.`,
    });
  };

  const handleDeleteMedication = () => {
    if (!selectedMedication) return;

    // In a real app, this would send a delete request to the API
    setMedications(
      medications.filter((med) => med.id !== selectedMedication.id)
    );
    setAdministrations(
      administrations.filter(
        (admin) => admin.medicationId !== selectedMedication.id
      )
    );
    setIsDeleteConfirmOpen(false);
    setSelectedMedication(null);
    toast({
      title: "Medication deleted",
      description: `${selectedMedication.medicationName} has been deleted successfully.`,
      variant: "destructive",
    });
  };

  const handleLogDose = (medicationId: string, data: any) => {
    // In a real app, this would send data to the API
    const medication = medications.find((med) => med.id === medicationId);
    if (!medication) return;

    const newAdministration: MedicationAdministration = {
      id: getSafeUniqueId("admin"),
      medicationId,
      timestamp: new Date().toISOString(),
      takenAt: data.takenAt || new Date(),
      takenBy: data.takenBy || "Parent",
      notes: data.notes || "",
      sideEffects: data.sideEffects || "",
      skipped: data.skipped || false,
      date: data.takenAt || new Date(),
    };

    // Update administrations
    setAdministrations([newAdministration, ...administrations]);

    // Update the medication's administrations array
    const updatedMedications = medications.map((med) => {
      if (med.id === medicationId) {
        return {
          ...med,
          administrations: [newAdministration, ...med.administrations],
        };
      }
      return med;
    });

    setMedications(updatedMedications);
    setIsLogDoseOpen(false);
    toast({
      title: data.skipped ? "Dose skipped" : "Dose logged",
      description: `${medication.medicationName} dose has been ${
        data.skipped ? "marked as skipped" : "logged"
      }.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Completed
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Paused
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isLoaded = !isChildLoading && !isLoading;

  const activeMedications = medications.filter(
    (med) => med.status === "active"
  ).length;
  const completedMedications = medications.filter(
    (med) => med.status === "completed"
  ).length;
  const pausedMedications = medications.filter(
    (med) => med.status === "paused"
  ).length;
  const totalAdministrations = administrations.length;
  const missedDoses = administrations.filter((admin) => admin.skipped).length;

  const filteredMedications = getFilteredMedications();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Medication Tracking
          </h1>
          <p className="text-muted-foreground">
            Monitor your child's medications and dosing schedule
          </p>
        </div>
        <Button
          onClick={() => setIsAddMedicationOpen(true)}
          disabled={!selectedChild}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Medication
        </Button>
      </div>

      {!isLoaded ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <StatCardSkeleton isLoading={true}>
                  {/* Content will never render */}
                  <div></div>
                </StatCardSkeleton>
              </Card>
            ))}
          </div>

          <Card>
            <ChartSkeleton isLoading={true} height="h-[350px]">
              <div></div>
            </ChartSkeleton>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <ChartSkeleton isLoading={true}>
                <div></div>
              </ChartSkeleton>
            </Card>

            <Card>
              <TableSkeleton isLoading={true}>
                <div></div>
              </TableSkeleton>
            </Card>
          </div>
        </>
      ) : !selectedChild ? (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">
              Select a child to view medication data
            </p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Medications
                </CardTitle>
                <Pill className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeMedications}</div>
                <p className="text-xs text-muted-foreground">
                  Current medications
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Check className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedMedications}</div>
                <p className="text-xs text-muted-foreground">
                  Completed medications
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paused</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pausedMedications}</div>
                <p className="text-xs text-muted-foreground">
                  Temporarily paused
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Doses
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAdministrations}</div>
                <p className="text-xs text-muted-foreground">
                  Doses administered
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Missed Doses
                </CardTitle>
                <X className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{missedDoses}</div>
                <p className="text-xs text-muted-foreground">
                  {totalAdministrations > 0
                    ? `${((missedDoses / totalAdministrations) * 100).toFixed(
                        1
                      )}% of total`
                    : "No doses recorded"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle>Medication Schedule</CardTitle>
                      <CardDescription>
                        {getTimeFrameLabel()} ({format(getStartDate(), "MMM d")}{" "}
                        - {format(new Date(), "MMM d")})
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex space-x-1">
                        <Button
                          variant={timeFrame === "week" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTimeFrame("week")}
                          className="text-xs h-7 px-2"
                        >
                          Week
                        </Button>
                        <Button
                          variant={
                            timeFrame === "month" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setTimeFrame("month")}
                          className="text-xs h-7 px-2"
                        >
                          Month
                        </Button>
                        <Button
                          variant={
                            timeFrame === "3months" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setTimeFrame("3months")}
                          className="text-xs h-7 px-2"
                        >
                          3 Months
                        </Button>
                        <Button
                          variant={timeFrame === "year" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTimeFrame("year")}
                          className="text-xs h-7 px-2"
                        >
                          Year
                        </Button>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant={
                            chartView === "calendar" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setChartView("calendar")}
                          className="text-xs h-7 w-7 px-0"
                          title="Calendar View"
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={chartView === "bar" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setChartView("bar")}
                          className="text-xs h-7 w-7 px-0"
                          title="Bar Chart"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={
                            chartView === "schedule" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setChartView("schedule")}
                          className="text-xs h-7 w-7 px-0"
                          title="Schedule View"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-[350px]">
                    {chartView === "calendar" && (
                      <MedicationCalendar
                        medications={medications}
                        administrations={administrations}
                        timeFrame={timeFrame}
                        onLogDose={(medId) => {
                          setSelectedMedication(
                            medications.find((m) => m.id === medId) || null
                          );
                          setIsLogDoseOpen(true);
                        }}
                      />
                    )}
                    {chartView === "bar" && (
                      <MedicationChart
                        medications={medications}
                        administrations={administrations}
                        timeFrame={timeFrame}
                      />
                    )}
                    {chartView === "schedule" && (
                      <MedicationSchedule
                        medications={medications.filter(
                          (m) => m.status === "active"
                        )}
                        administrations={administrations}
                        timeFrame={timeFrame}
                        onLogDose={(medId) => {
                          setSelectedMedication(
                            medications.find((m) => m.id === medId) || null
                          );
                          setIsLogDoseOpen(true);
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Medications</CardTitle>
                    <CardDescription>
                      Currently active medications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {medications.filter((m) => m.status === "active").length ===
                    0 ? (
                      <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                        <p className="text-sm text-muted-foreground">
                          No active medications
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
                        {medications
                          .filter((m) => m.status === "active")
                          .map((medication) => (
                            <div
                              key={medication.id}
                              className="flex items-start space-x-4 py-3 border-b last:border-0"
                            >
                              <div className="text-3xl">💊</div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <p className="text-sm font-medium">
                                      {medication.medicationName}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-xs"
                                    >
                                      {medication.dosage}
                                    </Badge>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>
                                        Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedMedication(medication);
                                          setIsLogDoseOpen(true);
                                        }}
                                      >
                                        Log Dose
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedMedication(medication);
                                          setIsEditMedicationOpen(true);
                                        }}
                                      >
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                          setSelectedMedication(medication);
                                          setIsDeleteConfirmOpen(true);
                                        }}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {medication.frequency}
                                </p>
                                <div className="flex items-center mt-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      setSelectedMedication(medication);
                                      setIsLogDoseOpen(true);
                                    }}
                                  >
                                    Log Dose
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Doses</CardTitle>
                    <CardDescription>
                      Latest medication administrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {administrations.length === 0 ? (
                      <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                        <p className="text-sm text-muted-foreground">
                          No doses recorded yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
                        {administrations
                          .sort(
                            (a, b) =>
                              new Date(b.timestamp).getTime() -
                              new Date(a.timestamp).getTime()
                          )
                          .slice(0, 5)
                          .map((admin) => {
                            const medication = medications.find(
                              (m) => m.id === admin.medicationId
                            );
                            return (
                              <div
                                key={admin.id}
                                className="flex items-start space-x-4 py-3 border-b last:border-0"
                              >
                                <div className="text-3xl">
                                  {admin.skipped ? "❌" : "✅"}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center">
                                    <p className="text-sm font-medium">
                                      {medication?.medicationName ||
                                        "Unknown Medication"}
                                    </p>
                                    <Badge
                                      variant={
                                        admin.skipped
                                          ? "destructive"
                                          : "outline"
                                      }
                                      className="ml-2 text-xs"
                                    >
                                      {admin.skipped ? "Skipped" : "Taken"}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {format(
                                      new Date(admin.timestamp),
                                      "MMM d, h:mm a"
                                    )}
                                  </p>
                                  {admin.notes && (
                                    <p className="text-xs">{admin.notes}</p>
                                  )}
                                  {admin.sideEffects && (
                                    <p className="text-xs flex items-center text-amber-500">
                                      <AlertTriangle className="h-3 w-3 mr-1" />{" "}
                                      {admin.sideEffects}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="medications" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <CardTitle>All Medications</CardTitle>
                      <CardDescription>
                        Complete list of medications
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search medications..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 w-full sm:w-[200px]"
                        />
                      </div>
                      <Select
                        value={filterStatus}
                        onValueChange={(value) => setFilterStatus(value as any)}
                      >
                        <SelectTrigger className="w-full sm:w-[130px]">
                          <Filter className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active Only</SelectItem>
                          <SelectItem value="completed">
                            Completed Only
                          </SelectItem>
                          <SelectItem value="paused">Paused Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                        }
                        title={
                          sortOrder === "asc"
                            ? "Sort Descending"
                            : "Sort Ascending"
                        }
                      >
                        <ArrowUpDown
                          className={`h-4 w-4 ${
                            sortOrder === "asc" ? "rotate-180" : ""
                          } transition-transform`}
                        />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredMedications.length === 0 ? (
                    <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                      <p className="text-sm text-muted-foreground">
                        No medications found matching your criteria
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-md border">
                        <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b text-sm">
                          <div className="col-span-3 sm:col-span-2">
                            Medication
                          </div>
                          <div className="col-span-2 sm:col-span-1">Dosage</div>
                          <div className="hidden sm:block sm:col-span-2">
                            Frequency
                          </div>
                          <div className="col-span-3 sm:col-span-2">
                            Start Date
                          </div>
                          <div className="hidden sm:block sm:col-span-2">
                            End Date
                          </div>
                          <div className="col-span-2 sm:col-span-1">Status</div>
                          <div className="col-span-2 sm:col-span-2">
                            Actions
                          </div>
                        </div>

                        <div className="divide-y max-h-[500px] overflow-auto">
                          {filteredMedications.map((medication) => (
                            <div
                              key={medication.id}
                              className="grid grid-cols-12 gap-2 p-4 text-sm items-center"
                            >
                              <div className="col-span-3 sm:col-span-2 font-medium">
                                {medication.medicationName}
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                {medication.dosage}
                              </div>
                              <div className="hidden sm:block sm:col-span-2">
                                {medication.frequency}
                              </div>
                              <div className="col-span-3 sm:col-span-2">
                                {format(
                                  new Date(medication.startDate),
                                  "MMM d, yyyy"
                                )}
                              </div>
                              <div className="hidden sm:block sm:col-span-2">
                                {medication.endDate
                                  ? format(
                                      new Date(medication.endDate),
                                      "MMM d, yyyy"
                                    )
                                  : "Ongoing"}
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                {getStatusBadge(medication.status)}
                              </div>
                              <div className="col-span-2 sm:col-span-2 flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedMedication(medication);
                                    setIsEditMedicationOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedMedication(medication);
                                    setIsLogDoseOpen(true);
                                  }}
                                >
                                  <Pill className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setSelectedMedication(medication);
                                    setIsDeleteConfirmOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Showing {filteredMedications.length} of{" "}
                        {medications.length} medications
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Medication Schedule</CardTitle>
                  <CardDescription>Daily medication schedule</CardDescription>
                </CardHeader>
                <CardContent className="h-[500px]">
                  <MedicationSchedule
                    medications={medications.filter(
                      (m) => m.status === "active"
                    )}
                    administrations={administrations}
                    timeFrame={timeFrame}
                    onLogDose={(medId) => {
                      setSelectedMedication(
                        medications.find((m) => m.id === medId) || null
                      );
                      setIsLogDoseOpen(true);
                    }}
                    expanded={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Medication Calendar</CardTitle>
                    <CardDescription>
                      View medication doses by date
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md border"
                      modifiers={{
                        hasDose: administrations.map((admin) => admin.date),
                      }}
                      modifiersStyles={{
                        hasDose: {
                          backgroundColor: "hsl(var(--primary) / 0.1)",
                          fontWeight: "bold",
                          borderBottom: "2px solid hsl(var(--primary))",
                        },
                      }}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      {date ? format(date, "MMMM d, yyyy") : "Select a date"}
                    </CardTitle>
                    <CardDescription>
                      {selectedDateEvents.length} dose
                      {selectedDateEvents.length === 1 ? "" : "s"} recorded
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!date ? (
                      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                        <p className="text-sm text-muted-foreground">
                          Select a date to view doses
                        </p>
                      </div>
                    ) : selectedDateEvents.length === 0 ? (
                      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                        <p className="text-sm text-muted-foreground">
                          No doses recorded for this date
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-md border p-4 text-center">
                            <h3 className="mb-2 font-medium">Total Doses</h3>
                            <p className="text-2xl font-bold">
                              {selectedDateEvents.length}
                            </p>
                          </div>
                          <div className="rounded-md border p-4 text-center">
                            <h3 className="mb-2 font-medium">Skipped</h3>
                            <p className="text-2xl font-bold">
                              {
                                selectedDateEvents.filter((e) => e.skipped)
                                  .length
                              }
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
                          {selectedDateEvents
                            .sort(
                              (a, b) =>
                                new Date(b.timestamp).getTime() -
                                new Date(a.timestamp).getTime()
                            )
                            .map((admin) => {
                              const medication = medications.find(
                                (m) => m.id === admin.medicationId
                              );
                              return (
                                <div
                                  key={admin.id}
                                  className="flex items-start space-x-4 py-3 border-b last:border-0"
                                >
                                  <div className="text-3xl">
                                    {admin.skipped ? "❌" : "✅"}
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center">
                                      <p className="text-sm font-medium">
                                        {medication?.medicationName ||
                                          "Unknown Medication"}
                                      </p>
                                      <Badge
                                        variant={
                                          admin.skipped
                                            ? "destructive"
                                            : "outline"
                                        }
                                        className="ml-2 text-xs"
                                      >
                                        {admin.skipped ? "Skipped" : "Taken"}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {format(
                                        new Date(admin.timestamp),
                                        "h:mm a"
                                      )}{" "}
                                      • {medication?.dosage}
                                    </p>
                                    {admin.notes && (
                                      <p className="text-xs">{admin.notes}</p>
                                    )}
                                    {admin.sideEffects && (
                                      <p className="text-xs flex items-center text-amber-500">
                                        <AlertTriangle className="h-3 w-3 mr-1" />{" "}
                                        {admin.sideEffects}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Add Medication Dialog */}
      <Dialog open={isAddMedicationOpen} onOpenChange={setIsAddMedicationOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Medication</DialogTitle>
            <DialogDescription>
              Enter the details of the medication for {selectedChild?.name}
            </DialogDescription>
          </DialogHeader>
          <MedicationForm onSubmit={handleAddMedication} />
        </DialogContent>
      </Dialog>

      {/* Edit Medication Dialog */}
      <Dialog
        open={isEditMedicationOpen}
        onOpenChange={setIsEditMedicationOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Medication</DialogTitle>
            <DialogDescription>
              Update the details of {selectedMedication?.medicationName}
            </DialogDescription>
          </DialogHeader>
          <MedicationForm
            medication={selectedMedication}
            onSubmit={handleEditMedication}
          />
        </DialogContent>
      </Dialog>

      {/* Log Dose Dialog */}
      <Dialog open={isLogDoseOpen} onOpenChange={setIsLogDoseOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Medication Dose</DialogTitle>
            <DialogDescription>
              Record a dose of {selectedMedication?.medicationName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Medication</h3>
                <p>{selectedMedication?.medicationName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">Dosage</h3>
                <p>{selectedMedication?.dosage}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date and Time</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(), "PPP HH:mm")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={new Date()} initialFocus />
                  <div className="p-3 border-t border-border">
                    <Input
                      type="time"
                      defaultValue={format(new Date(), "HH:mm")}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Taken By</label>
              <Input defaultValue="Parent" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input placeholder="Any notes about this dose" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Side Effects</label>
              <Input placeholder="Any side effects observed" />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="skipped"
                className="rounded border-gray-300"
              />
              <label htmlFor="skipped" className="text-sm font-medium">
                Mark as skipped
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogDoseOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleLogDose(selectedMedication?.id || "", {
                  takenAt: new Date(),
                  takenBy: "Parent",
                  notes: "",
                  sideEffects: "",
                  skipped: false,
                });
              }}
            >
              Log Dose
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Medication</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              {selectedMedication?.medicationName}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMedication}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
