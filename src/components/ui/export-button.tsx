import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileDown, FileSpreadsheet, FileImage } from "lucide-react"

interface ExportButtonProps {
  onExportCSV?: () => void
  onExportExcel?: () => void
  onExportImage?: () => void
  className?: string
  disabled?: boolean
  data?: any[]
}

export function ExportButton({
  onExportCSV,
  onExportExcel,
  onExportImage,
  className,
  disabled,
  data,
}: ExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
          disabled={disabled || !data?.length}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onExportCSV && (
          <DropdownMenuItem onClick={onExportCSV}>
            <FileDown className="mr-2 h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
        )}
        {onExportExcel && (
          <DropdownMenuItem onClick={onExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export as Excel
          </DropdownMenuItem>
        )}
        {onExportImage && (
          <DropdownMenuItem onClick={onExportImage}>
            <FileImage className="mr-2 h-4 w-4" />
            Export as Image
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 