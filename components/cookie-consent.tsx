"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Settings } from "lucide-react"
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
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [essentialChecked, setEssentialChecked] = useState(true)
  const [analyticsChecked, setAnalyticsChecked] = useState(false)
  const [marketingChecked, setMarketingChecked] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      // Show consent banner after a short delay
      const timer = setTimeout(() => {
        setShowBanner(true)
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
    setShowBanner(false)
  }

  const handleRejectAll = () => {
    localStorage.setItem(
      "cookie-consent",
      JSON.stringify({
        essential: true,
        analytics: false,
        marketing: false,
        timestamp: new Date().toISOString(),
      }),
    )
    setShowBanner(false)
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
    setShowSettings(false)
    setShowBanner(false)
  }

  const handleCustomize = () => {
    setShowSettings(true)
  }

  if (!showBanner) {
    return null
  }

  return (
    <>
      {/* Bottom notification banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-1">We value your privacy</h3>
                  <p className="text-xs text-muted-foreground">
                    We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                    By clicking "Accept All", you consent to our use of cookies.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBanner(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleRejectAll} className="text-xs">
                Reject All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCustomize}
                className="text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Customize
              </Button>
              <Button size="sm" onClick={handleAcceptAll} className="text-xs">
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Choose which cookies you want to allow. You can change these settings at any time.
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
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferences}>Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

