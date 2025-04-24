import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import { ChartRef, ExportData, ExportOptions, ExportResult } from "./export-types";
import { toast } from 'sonner';
import JSZip from 'jszip';
import { format } from 'date-fns';

export function formatDataForExport<T>(data: T[], headers?: string[]): ExportData<T> {
  return {
    rows: data,
    headers: headers || (data.length > 0 ? Object.keys(data[0] as object) : []),
  };
}

export function createExportOptions(filename: string): ExportOptions {
  return {
    filename,
    includeHeaders: true,
  };
}

export function exportToCSV<T>(data: ExportData<T>, options: ExportOptions): ExportResult {
  const { filename, dateFormat = 'yyyy-MM-dd' } = options;

  if (!data.rows.length) {
    return {
      success: false,
      content: '',
      filename: `${filename}.csv`,
      type: 'csv',
      error: 'No data to export',
    };
  }

  const headers = data.headers || Object.keys(data.rows[0] as object);
  const csvContent = [
    headers.join(','),
    ...data.rows.map(row =>
      headers.map(header => {
        const value = (row as any)[header];
        if (value instanceof Date) {
          return format(value, dateFormat);
        }
        return typeof value === 'string' ? `"${value}"` : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${format(new Date(), dateFormat)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    content: csvContent,
    filename: `${filename}-${format(new Date(), dateFormat)}.csv`,
    type: 'csv',
  };
}

export async function exportToExcel<T>(data: ExportData<T>, options: ExportOptions): Promise<ExportResult> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(options.sheetName || "Data");

  // Add headers
  if (data.headers && data.headers.length > 0) {
    worksheet.addRow(data.headers);
  }

  // Add data rows
  data.rows.forEach(row => {
    const values = data.headers.map(header => (row as any)[header]);
    worksheet.addRow(values);
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `${options.filename}.xlsx`;
  saveAs(blob, filename);

  return {
    success: true,
    content: blob,
    filename,
    type: 'excel'
  };
}

export async function exportChartAsImage(chartRef: ChartRef, options: ExportOptions): Promise<ExportResult> {
  if (!chartRef.current) {
    return {
      success: false,
      content: new Blob(),
      filename: `${options.filename}.png`,
      type: 'image',
      error: 'Chart reference not found',
    };
  }

  const svg = chartRef.current.querySelector('svg');
  if (!svg) {
    return {
      success: false,
      content: new Blob(),
      filename: `${options.filename}.png`,
      type: 'image',
      error: 'SVG element not found',
    };
  }

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      success: false,
      content: new Blob(),
      filename: `${options.filename}.png`,
      type: 'image',
      error: 'Failed to get canvas context',
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${options.filename}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          resolve({
            success: true,
            content: blob,
            filename: `${options.filename}.png`,
            type: 'image',
          });
        } else {
          resolve({
            success: false,
            content: new Blob(),
            filename: `${options.filename}.png`,
            type: 'image',
            error: 'Failed to create image blob',
          });
        }
      });
    };
    img.onerror = () => {
      resolve({
        success: false,
        content: new Blob(),
        filename: `${options.filename}.png`,
        type: 'image',
        error: 'Failed to load image',
      });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  });
}

function convertToCSV<T>(data: ExportData<T>): string {
  if (data.rows.length === 0) return "";

  const headers = data.headers || Object.keys(data.rows[0] as object);
  const csvRows = [headers.join(",")];

  for (const row of data.rows) {
    const values = headers.map((header) => {
      const value = (row as any)[header];
      return typeof value === "string" ? `"${value}"` : value;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

export interface ExportData {
  filename: string;
  content: string;
  type: string;
}

export interface ExportOptions {
  filename: string;
  headers?: string[];
}

export async function createZipAndShare(
  data: ExportData[],
  options: { filename?: string; shareExpiresIn?: number } = {}
): Promise<{ shareUrl: string; expiresAt: Date } | null> {
  try {
    // Create zip file
    const zip = new JSZip();

    // Add each file to the zip
    data.forEach(({ filename, content, type }) => {
      zip.file(filename, content, { binary: type !== 'text/csv' });
    });

    // Generate zip content
    const zipContent = await zip.generateAsync({ type: 'blob' });
    const zipBlob = new Blob([zipContent], { type: 'application/zip' });

    // Convert blob to base64
    const reader = new FileReader();
    const base64Content = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(zipBlob);
    });

    // Remove the data URL prefix
    const content = base64Content.split(',')[1];

    // Create share link
    const response = await fetch('/api/exports/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `${options.filename || 'export'}.zip`,
        content,
        expiresIn: options.shareExpiresIn || 86400, // Default 24 hours
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create share link');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating zip and share:', error);
    toast.error('Failed to create share link');
    return null;
  }
}

export function exportToJSON<T>(data: ExportData<T>, options: ExportOptions): ExportResult {
  const { filename, dateFormat = 'yyyy-MM-dd' } = options;

  const jsonContent = JSON.stringify(data.rows, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${format(new Date(), dateFormat)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    content: jsonContent,
    filename: `${filename}-${format(new Date(), dateFormat)}.json`,
    type: 'json',
  };
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
} 