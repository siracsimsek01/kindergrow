"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function CookieConsent() {
  const [open, setOpen] = useState(false)
  const [essentialChecked, setEssentialChecked] = useState(true)
  const [analyticsChecked, setAnalyticsChecked] = useState(false)
  const [marketingChecked, setMarketingChecked] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      // Show consent dialog after a short delay
      const timer = setTimeout(() => {
        setOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem(
      "cookie-consent",
      JSON.stringify({
        essential: true,
        analytics: true,
        marketing: true,
        timestamp: new Date().toISOString(),
      }),
    )
    setOpen(false)
  }

  const handleSavePreferences = () => {
    localStorage.setItem(
      "cookie-consent",
      JSON.stringify({
        essential: essentialChecked,
        analytics: analyticsChecked,
        marketing: marketingChecked,
        timestamp: new Date().toISOString(),
      }),
    )
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our
            traffic. By clicking "Accept All", you consent to our use of cookies.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="essential"
              checked={essentialChecked}
              onCheckedChange={(checked) => setEssentialChecked(!!checked)}
              disabled
            />
            <div className="space-y-1">
              <Label htmlFor="essential" className="font-medium">
                Essential Cookies
              </Label>
              <p className="text-sm text-muted-foreground">
                These cookies are necessary for the website to function and cannot be switched off.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Checkbox
              id="analytics"
              checked={analyticsChecked}
              onCheckedChange={(checked) => setAnalyticsChecked(!!checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="analytics" className="font-medium">
                Analytics Cookies
              </Label>
              <p className="text-sm text-muted-foreground">
                These cookies allow us to count visits and traffic sources so we can measure and improve the performance
                of our site.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Checkbox
              id="marketing"
              checked={marketingChecked}
              onCheckedChange={(checked) => setMarketingChecked(!!checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="marketing" className="font-medium">
                Marketing Cookies
              </Label>
              <p className="text-sm text-muted-foreground">
                These cookies may be set through our site by our advertising partners to build a profile of your
                interests.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleSavePreferences}>
            Save Preferences
          </Button>
          <Button onClick={handleAcceptAll}>Accept All</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

