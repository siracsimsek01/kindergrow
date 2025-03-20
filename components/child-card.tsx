"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CalendarIcon, SproutIcon as GrowthIcon, MilkIcon, BabyIcon } from "lucide-react"
import Link from "next/link"
import { useChildContext } from "@/contexts/child-context"

interface ChildCardProps {
  id: string
  name: string
  birthDate: string
  sex: string
  imageUrl?: string
}

export function ChildCard({ id, name, birthDate, sex, imageUrl }: ChildCardProps) {
  const { setSelectedChild, children } = useChildContext()

  // Calculate age in months or years
  const calculateAge = () => {
    const birthDateObj = new Date(birthDate)
    const today = new Date()
    const monthDiff =
      today.getMonth() - birthDateObj.getMonth() + 12 * (today.getFullYear() - birthDateObj.getFullYear())

    if (monthDiff < 24) {
      return `${monthDiff} months`
    } else {
      const years = Math.floor(monthDiff / 12)
      return `${years} ${years === 1 ? "year" : "years"}`
    }
  }

  const handleSelectChild = () => {
    const child = children.find((c) => c.id === id)
    if (child) {
      setSelectedChild(child)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/5 pb-0">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={imageUrl} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground">
              {calculateAge()} • {sex}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4">
          <Link href={`/dashboard/feeding?childId=${id}`} onClick={handleSelectChild}>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <MilkIcon className="mr-2 h-4 w-4" />
              Feeding
            </Button>
          </Link>
          <Link href={`/dashboard/sleep?childId=${id}`} onClick={handleSelectChild}>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Sleep
            </Button>
          </Link>
          <Link href={`/dashboard/growth?childId=${id}`} onClick={handleSelectChild}>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <GrowthIcon className="mr-2 h-4 w-4" />
              Growth
            </Button>
          </Link>
          <Link href={`/dashboard/diapers?childId=${id}`} onClick={handleSelectChild}>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <BabyIcon className="mr-2 h-4 w-4" />
              Diapers
            </Button>
          </Link>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-3">
        <Link href={`/dashboard/child/${id}`} onClick={handleSelectChild}>
          <Button variant="ghost" size="sm">
            View Profile
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

