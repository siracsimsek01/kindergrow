"use client"

import type React from "react"

import { useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { AddChildModal } from "@/components/add-child-modal"
import { AddEventModal } from "@/components/add-event-modal"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setInitialLoading, setAddChildModalOpen, setAddEventModalOpen } from "@/lib/redux/slices/uiSlice"
import { fetchChildrenAsync } from "@/lib/redux/slices/childrenSlice"
import { SidebarProvider } from "@/contexts/sidebar-context"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const { isAddChildModalOpen, isAddEventModalOpen, initialLoading } = useAppSelector((state) => state.ui)

  // Show loading screen only on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setInitialLoading(false))
    }, 1000)

    // Fetch children data on initial load
    dispatch(fetchChildrenAsync())

    return () => clearTimeout(timer)
  }, [dispatch])

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        {initialLoading && <LoadingScreen message="Loading KinderGrow..." />}

        <Sidebar />

        <div className="flex-1 p-6 ml-16 transition-all duration-300 md:ml-64">{children}</div>

        {isAddChildModalOpen && (
          <AddChildModal open={isAddChildModalOpen} onOpenChange={(open) => dispatch(setAddChildModalOpen(open))} />
        )}
        {isAddEventModalOpen && (
          <AddEventModal open={isAddEventModalOpen} onOpenChange={(open) => dispatch(setAddEventModalOpen(open))} />
        )}
      </div>
    </SidebarProvider>
  )
}

