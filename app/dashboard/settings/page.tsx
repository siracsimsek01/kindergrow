"use client"

import type React from "react"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const { user } = useUser()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [accountSettings, setAccountSettings] = useState({
    email: user?.primaryEmailAddress?.emailAddress || "",
    password: "",
    confirmPassword: "",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    dailySummary: true,
    weeklyReport: true,
  })

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "friends",
    dataSharing: false,
  })

  const [appSettings, setAppSettings] = useState({
    language: "en",
    timezone: "UTC",
    theme: "system",
  })

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountSettings({
      ...accountSettings,
      [e.target.name]: e.target.value,
    })
  }

  const handleNotificationChange = (setting: string) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting as keyof typeof notificationSettings],
    })
  }

  const handlePrivacyChange = (setting: string, value: any) => {
    setPrivacySettings({
      ...privacySettings,
      [setting]: value,
    })
  }

  const handleAppSettingChange = (setting: string, value: string) => {
    setAppSettings({
      ...appSettings,
      [setting]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Here you would typically update the user's settings
    // For now, we'll just simulate an API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    toast({
      title: "Settings Updated",
      description: "Your settings have been successfully updated.",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <Tabs defaultValue="account">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="app">App Settings</TabsTrigger>
        </TabsList>
        <form onSubmit={handleSubmit}>
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={accountSettings.email}
                    onChange={handleAccountChange}
                  />
                </div>
                <div>
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={accountSettings.password}
                    onChange={handleAccountChange}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={accountSettings.confirmPassword}
                    onChange={handleAccountChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <Switch
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={() => handleNotificationChange("emailNotifications")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                  <Switch
                    id="pushNotifications"
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={() => handleNotificationChange("pushNotifications")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="dailySummary">Daily Summary</Label>
                  <Switch
                    id="dailySummary"
                    checked={notificationSettings.dailySummary}
                    onCheckedChange={() => handleNotificationChange("dailySummary")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="weeklyReport">Weekly Report</Label>
                  <Switch
                    id="weeklyReport"
                    checked={notificationSettings.weeklyReport}
                    onCheckedChange={() => handleNotificationChange("weeklyReport")}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your privacy and data sharing preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="profileVisibility">Profile Visibility</Label>
                  <Select
                    value={privacySettings.profileVisibility}
                    onValueChange={(value) => handlePrivacyChange("profileVisibility", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="dataSharing">Data Sharing for Research</Label>
                  <Switch
                    id="dataSharing"
                    checked={privacySettings.dataSharing}
                    onCheckedChange={(checked) => handlePrivacyChange("dataSharing", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="app">
            <Card>
              <CardHeader>
                <CardTitle>App Settings</CardTitle>
                <CardDescription>Customize your app experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={appSettings.language}
                    onValueChange={(value) => handleAppSettingChange("language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={appSettings.timezone}
                    onValueChange={(value) => handleAppSettingChange("timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={appSettings.theme} onValueChange={(value) => handleAppSettingChange("theme", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  )
}

