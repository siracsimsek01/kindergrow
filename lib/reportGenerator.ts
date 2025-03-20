import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"

interface ReportData {
  date: string
  startTime: string
  endTime: string
  type: string
  childId: string
  value: number | null
  notes: string
}

export async function generateReport(
  reportType: string,
  data: ReportData[],
  startDate: string,
  endDate: string,
  childName = "Child",
): Promise<Buffer> {
  // Create a new PDF document
  const doc = new jsPDF()

  // Add title
  const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`
  doc.setFontSize(20)
  doc.text(title, 105, 15, { align: "center" })

  // Add report details
  doc.setFontSize(12)
  doc.text(`Child: ${childName}`, 14, 30)
  doc.text(
    `Period: ${format(new Date(startDate), "MMM d, yyyy")} - ${format(new Date(endDate), "MMM d, yyyy")}`,
    14,
    40,
  )
  doc.text(`Generated on: ${format(new Date(), "MMM d, yyyy, h:mm a")}`, 14, 50)

  // Add summary statistics
  doc.setFontSize(16)
  doc.text("Summary", 14, 65)

  doc.setFontSize(12)
  doc.text(`Total entries: ${data.length}`, 14, 75)

  // Add specific summary stats based on report type
  if (reportType === "feeding") {
    const totalAmount = data.reduce((sum, item) => sum + (item.value || 0), 0)
    const avgAmount = data.length > 0 ? totalAmount / data.length : 0

    doc.text(`Total amount: ${totalAmount.toFixed(2)} oz/ml`, 14, 85)
    doc.text(`Average amount per feeding: ${avgAmount.toFixed(2)} oz/ml`, 14, 95)
  } else if (reportType === "sleeping") {
    // Calculate total sleep duration in minutes
    const totalMinutes = data.reduce((sum, item) => {
      const start = new Date(item.startTime)
      const end = new Date(item.endTime)
      return sum + (end.getTime() - start.getTime()) / (1000 * 60)
    }, 0)

    const totalHours = totalMinutes / 60
    const avgHoursPerDay =
      totalHours / ((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))

    doc.text(`Total sleep: ${totalHours.toFixed(1)} hours`, 14, 85)
    doc.text(`Average sleep per day: ${avgHoursPerDay.toFixed(1)} hours`, 14, 95)
  } else if (reportType === "growth") {
    if (data.length > 0) {
      const firstEntry = data[0]
      const lastEntry = data[data.length - 1]

      const firstWeight = firstEntry.value || 0
      const lastWeight = lastEntry.value || 0
      const weightGain = lastWeight - firstWeight

      doc.text(`Starting weight: ${firstWeight.toFixed(2)} kg/lbs`, 14, 85)
      doc.text(`Current weight: ${lastWeight.toFixed(2)} kg/lbs`, 14, 95)
      doc.text(`Weight gain: ${weightGain.toFixed(2)} kg/lbs`, 14, 105)
    }
  } else if (reportType === "temperature") {
    const temps = data.map((item) => item.value || 0).filter((v) => v > 0)
    const avgTemp = temps.length > 0 ? temps.reduce((sum, temp) => sum + temp, 0) / temps.length : 0
    const maxTemp = temps.length > 0 ? Math.max(...temps) : 0
    const minTemp = temps.length > 0 ? Math.min(...temps) : 0

    doc.text(`Average temperature: ${avgTemp.toFixed(1)}°C`, 14, 85)
    doc.text(`Highest temperature: ${maxTemp.toFixed(1)}°C`, 14, 95)
    doc.text(`Lowest temperature: ${minTemp.toFixed(1)}°C`, 14, 105)
  }

  // Add detailed data table
  doc.setFontSize(16)
  doc.text("Detailed Data", 14, 120)

  // Prepare table data
  const tableData = data.map((item) => {
    const date = format(new Date(item.date), "MMM d, yyyy")
    const startTime = format(new Date(item.startTime), "h:mm a")
    let endTime = ""
    if (item.endTime) {
      endTime = format(new Date(item.endTime), "h:mm a")
    }

    let valueStr = ""
    if (reportType === "feeding") {
      valueStr = item.value ? `${item.value.toFixed(1)} oz/ml` : ""
    } else if (reportType === "sleeping") {
      const start = new Date(item.startTime)
      const end = new Date(item.endTime)
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
      const hours = Math.floor(durationMinutes / 60)
      const minutes = Math.floor(durationMinutes % 60)
      valueStr = `${hours}h ${minutes}m`
    } else if (reportType === "growth") {
      valueStr = item.value ? `${item.value.toFixed(2)} kg/lbs` : ""
    } else if (reportType === "temperature") {
      valueStr = item.value ? `${item.value.toFixed(1)}°C` : ""
    } else {
      valueStr = item.value ? item.value.toString() : ""
    }

    return [date, startTime, endTime, valueStr, item.notes]
  })

  // Define table headers based on report type
  const headers = ["Date", "Time", "End Time", "Value", "Notes"]
  if (reportType === "feeding") {
    headers[3] = "Amount"
  } else if (reportType === "sleeping") {
    headers[3] = "Duration"
  } else if (reportType === "growth") {
    headers[3] = "Weight"
  } else if (reportType === "temperature") {
    headers[3] = "Temperature"
  }
  // Add the table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 125,
    margin: { top: 15 },
    styles: { overflow: "linebreak" },
    columnStyles: { 4: { cellWidth: "auto" } },
  })

  // Convert the PDF to a buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
  return pdfBuffer
}
