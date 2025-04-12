import type React from "react"
import { cn } from "@/lib/utils"

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: "none" | "sm" | "md" | "lg" | "full"
}

export function Shimmer({ className, width, height, rounded = "md", ...props }: ShimmerProps) {
  const roundedMap = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/40 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        roundedMap[rounded],
        className,
      )}
      style={{
        width: width,
        height: height,
      }}
      {...props}
    />
  )
}

export function ShimmerAvatar() {
  return <Shimmer width={40} height={40} rounded="full" />
}

export function ShimmerText({ width = "100%" }: { width?: string | number }) {
  return <Shimmer width={width} height={16} />
}

export function ShimmerButton() {
  return <Shimmer width={100} height={36} rounded="md" />
}

export function ShimmerCard() {
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <ShimmerText width="60%" />
      <div className="space-y-2">
        <ShimmerText />
        <ShimmerText />
        <ShimmerText width="80%" />
      </div>
    </div>
  )
}

export function ShimmerListItem() {
  return (
    <div className="flex items-center space-x-4 p-3 border-b">
      <ShimmerAvatar />
      <div className="space-y-2 flex-1">
        <ShimmerText width="60%" />
        <ShimmerText width="40%" />
      </div>
    </div>
  )
}

export function ShimmerPostCard() {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center space-x-3">
        <ShimmerAvatar />
        <ShimmerText width="40%" />
      </div>
      <Shimmer className="w-full h-48" />
      <div className="space-y-2">
        <ShimmerText />
        <ShimmerText width="90%" />
        <ShimmerText width="80%" />
      </div>
    </div>
  )
}

export function ShimmerFeedItem() {
  return (
    <div className="flex items-start space-x-4">
      <ShimmerAvatar />
      <div className="space-y-2 flex-1">
        <ShimmerText width="30%" />
        <ShimmerText width="100%" />
        <ShimmerText width="90%" />
      </div>
    </div>
  )
}

