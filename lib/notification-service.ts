"use client"

import { type SleepModel, predictNextDaySleep } from "./tensorflow/sleep-model"

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  timestamp: Date
  read: boolean
  link?: string
}

export class NotificationService {
  private static instance: NotificationService
  private notifications: Notification[] = []
  private permission: NotificationPermission = "default"
  private sleepModel: SleepModel | null = null

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  public async initialize() {
    // Request notification permission
    if ("Notification" in window) {
      this.permission = await Notification.requestPermission()
    }

    // Load notifications from localStorage
    this.loadNotifications()
  }

  public setSleepModel(model: SleepModel) {
    this.sleepModel = model
  }

  public async analyzeSleepData(sleepData: number[]) {
    if (!this.sleepModel) return

    try {
      // Predict next day's sleep
      const predictedSleep = await predictNextDaySleep(this.sleepModel, sleepData)

      // Calculate average sleep
      const recentAverage = sleepData.slice(-7).reduce((sum, val) => sum + val, 0) / 7

      // Generate notifications based on predictions
      if (predictedSleep < recentAverage * 0.8) {
        this.addNotification({
          title: "Sleep Pattern Alert",
          message: "Our AI predicts your child may sleep less than usual tomorrow. Consider adjusting bedtime routine.",
          type: "warning",
          link: "/dashboard/sleep",
        })
      }

      if (sleepData.slice(-3).every((val) => val < 6)) {
        this.addNotification({
          title: "Sleep Deficit Detected",
          message:
            "Your child has been sleeping less than recommended for 3 days. This may affect mood and development.",
          type: "warning",
          link: "/dashboard/sleep",
        })
      }
    } catch (error) {
      console.error("Error analyzing sleep data:", error)
    }
  }

  public getNotifications(): Notification[] {
    return this.notifications
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length
  }

  public markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id)
    if (notification) {
      notification.read = true
      this.saveNotifications()
    }
  }

  public markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true))
    this.saveNotifications()
  }

  public clearNotifications() {
    this.notifications = []
    this.saveNotifications()
  }

  public addNotification({
    title,
    message,
    type = "info",
    link,
  }: {
    title: string
    message: string
    type?: "info" | "warning" | "success" | "error"
    link?: string
  }) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
      link,
    }

    this.notifications.unshift(notification)
    this.saveNotifications()

    // Show browser notification if permission granted
    this.showBrowserNotification(notification)

    return notification
  }

  private showBrowserNotification(notification: Notification) {
    if (this.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/icons/logo.png",
      })
    }
  }

  private saveNotifications() {
    localStorage.setItem("notifications", JSON.stringify(this.notifications))
  }

  private loadNotifications() {
    const saved = localStorage.getItem("notifications")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }))
      } catch (error) {
        console.error("Error loading notifications:", error)
      }
    }
  }
}

// Create a hook for using notifications
export function useNotifications() {
  return NotificationService.getInstance()
}

