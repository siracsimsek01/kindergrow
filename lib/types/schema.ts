export interface User {
    _id: string
    clerkId: string
    email: string
    name: string
    createdAt: Date
    updatedAt: Date
  }
  
  export interface Child {
    _id: string
    userId: string
    name: string
    dateOfBirth: Date
    sex: "male" | "female" | "other"
    createdAt: Date
    updatedAt: Date
  }
  
  export interface Event {
    _id: string
    childId: string
    userId: string
    eventType: "sleep" | "feeding" | "diaper" | "medication" | "growth"
    startTime: Date
    endTime?: Date
    data: any // Specific data for each event type
    notes?: string
    createdAt: Date
    updatedAt: Date
  }
  
  export interface SleepEvent {
    duration?: number // in minutes
    type: "nap" | "night"
    quality?: "good" | "fair" | "poor"
  }
  
  export interface FeedingEvent {
    type: "formula" | "breast_milk" | "solid" | "cow_milk"
    amount?: number
    unit?: "ml" | "oz"
    foodDescription?: string
    portionConsumed?: "none" | "some" | "half" | "most" | "all"
  }
  
  export interface DiaperEvent {
    type: "wet" | "dirty" | "mixed"
    consistency?: "normal" | "loose" | "hard"
    color?: string
  }
  
  export interface MedicationEvent {
    name: string
    dosage: string
    unit: string
    frequency: string
    duration?: string
    withFood?: boolean
    reminder?: boolean
  }
  
  export interface GrowthEvent {
    weight?: number
    weightUnit: "kg" | "lb"
    height?: number
    heightUnit: "cm" | "in"
    headCircumference?: number
    percentileWeight?: number
    percentileHeight?: number
    percentileHeadCircumference?: number
  }
  