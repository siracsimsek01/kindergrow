import { LayoutDashboard, Moon, Utensils, Baby, Pill, Thermometer, LineChart, FileText, Database } from "lucide-react"

export const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Sleep Tracking",
    href: "/dashboard/sleep",
    icon: Moon,
  },
  {
    label: "Feeding Tracking",
    href: "/dashboard/feeding",
    icon: Utensils,
  },
  {
    label: "Diaper Tracking",
    href: "/dashboard/diaper",
    icon: Baby,
  },
  {
    label: "Medications",
    href: "/dashboard/medications",
    icon: Pill,
  },
  {
    label: "Temperature",
    href: "/dashboard/temperature",
    icon: Thermometer,
  },
  {
    label: "Growth Metrics",
    href: "/dashboard/growth",
    icon: LineChart,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
  },
  {
    label: "Seed Database",
    href: "/seed",
    icon: Database,
  },
]

