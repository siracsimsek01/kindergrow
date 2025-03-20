export interface Child {
  id: string
  name: string
  dateOfBirth: string
  sex: string
  imageUrl?: string
}

export interface Event {
  id: string
  childId: string
  eventType: string
  startTime: string
  endTime?: string
  details?: string
  createdAt: string
}

export interface SleepEntry extends Event {
  quality?: "good" | "fair" | "poor"
  notes?: string
}

export interface FeedingEntry extends Event {
  feedingType: "breast" | "bottle" | "solid"
  amount?: number
  unit?: "ml" | "oz" | "g"
  notes?: string
}

export interface DiaperEntry extends Event {
  diaperType: "wet" | "dirty" | "both"
  notes?: string
}

export interface MedicationEntry extends Event {
  medication: string
  dosage: string
  reason?: string
  notes?: string
}

export interface GrowthEntry extends Event {
  weight?: number
  height?: number
  headCircumference?: number
  notes?: string
}

export interface TemperatureEntry extends Event {
  temperature: number
  unit: "celsius" | "fahrenheit"
  method?: "oral" | "rectal" | "armpit" | "ear" | "forehead"
  notes?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

