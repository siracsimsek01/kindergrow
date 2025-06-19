"use client"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  date?: DateRange | undefined
  setDate?: (date: DateRange | undefined) => void
  dateRange?: DateRange | undefined
  onDateRangeChange?: (date: DateRange | undefined) => void
  className?: string
  align?: "start" | "center" | "end"
}

export function DateRangePicker({
  date,
  setDate,
  dateRange,
  onDateRangeChange,
  className,
  align = "center",
}: DateRangePickerProps) {
  // Support both naming conventions
  const currentDate = date || dateRange
  const handleDateChange = (newDate: DateRange | undefined) => {
    if (setDate) setDate(newDate)
    if (onDateRangeChange) onDateRangeChange(newDate)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal cursor-pointer",
              !currentDate && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {currentDate?.from ? (
              currentDate.to ? (
                <>
                  {format(currentDate.from, "LLL dd, y")} - {format(currentDate.to, "LLL dd, y")}
                </>
              ) : (
                format(currentDate.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[99999]" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={currentDate?.from}
            selected={currentDate}
            onSelect={handleDateChange}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function DatePickerWithRange({
  date,
  setDate,
  dateRange,
  onDateRangeChange,
  className,
  align,
}: DateRangePickerProps) {
  return (
    <DateRangePicker
      date={date}
      setDate={setDate}
      dateRange={dateRange}
      onDateRangeChange={onDateRangeChange}
      className={className}
      align={align}
    />
  )
}

