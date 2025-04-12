"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function UserProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">User Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.imageUrl} alt={user.fullName || ""} />
              <AvatarFallback>{user.firstName?.[0] || user.lastName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-xl font-medium">{user.fullName || user.username}</h3>
              <p className="text-sm text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => window.open("https://accounts.clerk.dev/user", "_blank")}>
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general">
              <TabsList className="mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Email Address</h4>
                  <p className="text-sm">{user.primaryEmailAddress?.emailAddress}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Username</h4>
                  <p className="text-sm">{user.username || "Not set"}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Created At</h4>
                  <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </TabsContent>
              <TabsContent value="security" className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Password</h4>
                  <p className="text-sm">••••••••</p>
                  <Button
                    variant="link"
                    className="px-0 text-sm"
                    onClick={() => window.open("https://accounts.clerk.dev/user", "_blank")}
                  >
                    Change password
                  </Button>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Two-Factor Authentication</h4>
                  <p className="text-sm">Not enabled</p>
                  <Button
                    variant="link"
                    className="px-0 text-sm"
                    onClick={() => window.open("https://accounts.clerk.dev/user", "_blank")}
                  >
                    Enable 2FA
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="notifications" className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Email Notifications</h4>
                  <p className="text-sm">You will receive email notifications for important updates.</p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">App Notifications</h4>
                  <p className="text-sm">In-app notifications are enabled.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

