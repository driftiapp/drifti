import { RefObject } from 'react';

export interface ExportData<T> {
  rows: T[];
  headers?: string[];
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  dateFormat?: string;
}

export interface ExportResult {
  success: boolean;
  content: Blob | string;
  filename: string;
  type: 'csv' | 'excel' | 'image' | 'json';
  error?: string;
}

export interface ChartRef {
  current: HTMLElement | null;
}

export interface Metadata {
  exportedAt: string;
  userId: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
  files: Array<{
    filename: string;
    type: 'csv' | 'excel' | 'image';
  }>;
} 