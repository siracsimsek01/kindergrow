export interface Child {
  id: string;
  name: string;
  dateOfBirth: string;
  sex: string;
  imageUrl?: string;
}

export interface Event {
  id: string;
  childId: string;
  eventType: string;
  startTime: string;
  endTime?: string;
  details?: string;
  createdAt: string;
  timestamp?: string;
  notes?: string;
}

export interface FeedingEntry extends Event {
  feedingType: "breast" | "bottle" | "solid";
  amount?: number;
  unit?: "ml" | "oz" | "g";
  notes?: string;
}

export interface DiaperEntry extends Event {
  diaperType: "wet" | "dirty" | "both";
  notes?: string;
}

export interface MedicationEntry extends Event {
  medication: string;
  dosage: string;
  reason?: string;
  notes?: string;
}

export interface GrowthEntry extends Event {
  weight?: number;
  height?: number;
  headCircumference?: number;
  notes?: string;
}

export interface TemperatureEntry extends Event {
  temperature: number;
  unit: "celsius" | "fahrenheit";
  method?: "oral" | "rectal" | "armpit" | "ear" | "forehead";
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type SleepQuality = "poor" | "fair" | "good" | "excellent";

export interface SleepEntry {
  id: string;
  childId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  quality: SleepQuality;
  notes?: string;
  location?: string; // e.g., 'crib', 'parent's bed', etc.
  createdAt: Date;
  updatedAt: Date;
}

export interface SleepStats {
  totalSleepTime: number; // in minutes
  averageSleepDuration: number; // in minutes
  longestSleep: number; // in minutes
  shortestSleep: number; // in minutes
  qualityDistribution: Record<SleepQuality, number>;
  sleepCountByDay: Record<string, number>;
  sleepDurationByDay: Record<string, number>;
}

export interface SleepFilters {
  startDate?: Date;
  endDate?: Date;
  quality?: SleepQuality;
  minDuration?: number;
  maxDuration?: number;
}
