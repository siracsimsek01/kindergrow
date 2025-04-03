"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications, type Notification } from "@/lib/notification-service"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export function NotificationCenter() {
  const notificationService = useNotifications()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Initialize notification service
    notificationService.initialize()

    // Update notifications
    const updateNotifications = () => {
      setNotifications(notificationService.getNotifications())
      setUnreadCount(notificationService.getUnreadCount())
    }

    // Initial update
    updateNotifications()

    // Set up interval to check for new notifications
    const interval = setInterval(updateNotifications, 30000)

    return () => clearInterval(interval)
  }, [notificationService])

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead()
    setNotifications(notificationService.getNotifications())
    setUnreadCount(0)
  }

  const handleClearAll = () => {
    notificationService.clearNotifications()
    setNotifications([])
    setUnreadCount(0)
    setOpen(false)
  }

  const handleNotificationClick = (id: string) => {
    notificationService.markAsRead(id)
    setNotifications(notificationService.getNotifications())
    setUnreadCount(notificationService.getUnreadCount())
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
              Mark all as read
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearAll} disabled={notifications.length === 0}>
              Clear all
            </Button>
          </div>
        </div>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn("p-4 hover:bg-muted/50 cursor-pointer", !notification.read && "bg-muted/20")}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 mt-1.5 rounded-full",
                        notification.type === "info" && "bg-blue-500",
                        notification.type === "warning" && "bg-amber-500",
                        notification.type === "success" && "bg-green-500",
                        notification.type === "error" && "bg-red-500",
                      )}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {format(notification.timestamp, "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}

