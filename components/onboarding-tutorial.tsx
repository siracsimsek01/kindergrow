"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TutorialStep {
  title: string
  description: string
  image: string
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to KinderGrow",
    description:
      "KinderGrow helps you track your child's development, sleep patterns, feeding schedules, and more. Let's get started with a quick tour!",
    image: "/images/tutorial/welcome.jpg",
  },
  {
    title: "Getting Started with Sample Data",
    description:
      "To help you explore all features, we can populate your account with sample data including 4 children and a year's worth of realistic tracking events. You can remove this data anytime from the dashboard.",
    image: "/images/tutorial/seed-data.jpg",
  },
  {
    title: "Dashboard Overview",
    description:
      "The dashboard gives you a quick overview of your child's activities and important metrics. You can see recent events and access all tracking features.",
    image: "/images/tutorial/dashboard.jpg",
  },
  {
    title: "Sleep Tracking",
    description:
      "Track your child's sleep patterns, including duration, quality, and trends over time. Get insights to help establish healthy sleep routines.",
    image: "/images/tutorial/sleep.jpg",
  },
  {
    title: "Feeding Tracking",
    description:
      "Log feeding times, amounts, and types. Monitor your child's nutrition and establish regular feeding schedules.",
    image: "/images/tutorial/feeding.jpg",
  },
  {
    title: "Diaper Tracking",
    description:
      "Keep track of diaper changes, including type and frequency. Identify patterns and ensure your child's health and comfort.",
    image: "/images/tutorial/diaper.png",
  },
  {
    title: "Growth Metrics",
    description:
      "Record and visualize your child's growth over time, including height, weight, and head circumference.",
    image: "/images/tutorial/growth.jpg",
  },

]

export function OnboardingTutorial() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showSeedOption, setShowSeedOption] = useState(false)
  const router = useRouter()
  const { user, isLoaded } = useUser()

  useEffect(() => {
    // Check if user has completed the tutorial AND if they are a new user
    const tutorialCompleted = localStorage.getItem("tutorial-completed")
    const userFirstLogin = localStorage.getItem(`user-${user?.id}-first-login`)

    // Only show tutorial if:
    // 1. User hasn't completed tutorial
    // 2. User is signed in 
    // 3. It's their first login (or first login flag doesn't exist)
    if (!tutorialCompleted && isLoaded && user && !userFirstLogin) {
      // Mark that this user has had their first login
      localStorage.setItem(`user-${user.id}-first-login`, "true")
      
      // Show tutorial after a short delay
      const timer = setTimeout(() => {
        setOpen(true)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [isLoaded, user])

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // On last step, show seed data option
      setShowSeedOption(true)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem("tutorial-completed", "true")
    setOpen(false)
    
    // Redirect to dashboard
    router.push("/dashboard")
  }

  const handleCompleteWithSeed = () => {
    localStorage.setItem("tutorial-completed", "true")
    setOpen(false)
    
    // Redirect to seed page
    router.push("/seed")
  }

  const handleSkip = () => {
    localStorage.setItem("tutorial-completed", "true")
    setOpen(false)
  }

  // Render seed data option dialog
  if (showSeedOption) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Get Started with Sample Data</DialogTitle>
            <DialogDescription>
              Would you like us to populate your account with sample data to explore all features?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">Sample data includes:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 4 children with different ages</li>
                <li>• A full year of realistic tracking data</li>
                <li>• Sleep, feeding, diaper, growth, and medication events</li>
                <li>• Charts and insights to explore</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              You can remove this sample data anytime from the dashboard settings.
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleComplete}>
              Start with Empty Account
            </Button>
            <Button onClick={handleCompleteWithSeed}>
              Add Sample Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <div className="relative overflow-hidden rounded-t-lg h-[300px]">
          <img
            src={tutorialSteps[currentStep].image || ""}
            alt={tutorialSteps[currentStep].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent h-20" />
        </div>

        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl">{tutorialSteps[currentStep].title}</DialogTitle>
          <DialogDescription className="text-base">{tutorialSteps[currentStep].description}</DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-2">
          <div className="flex items-center justify-center gap-1 mb-4">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full ${index === currentStep ? "w-6 bg-primary" : "w-1.5 bg-muted"}`}
              />
            ))}
          </div>

          <DialogFooter className="flex sm:justify-between gap-2">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>            <Button onClick={handleNext}>
              {currentStep < tutorialSteps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              ) : (
                "Continue"
              )}
            </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

