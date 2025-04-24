import { NextResponse } from 'next/server'

const themePresets = [
  {
    name: 'Minimalist',
    description: 'Clean and simple design with subtle colors',
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      background: '#ffffff',
      text: '#1f2937',
      border: '#e5e7eb',
    },
  },
  {
    name: 'Dark Mode',
    description: 'Dark theme with high contrast',
    colors: {
      primary: '#60a5fa',
      secondary: '#4b5563',
      background: '#111827',
      text: '#f3f4f6',
      border: '#374151',
    },
  },
  {
    name: 'Vibrant',
    description: 'Bold and energetic color scheme',
    colors: {
      primary: '#f43f5e',
      secondary: '#f97316',
      background: '#f8fafc',
      text: '#0f172a',
      border: '#e2e8f0',
    },
  },
  {
    name: 'Pastel',
    description: 'Soft and calming colors',
    colors: {
      primary: '#a5b4fc',
      secondary: '#f9a8d4',
      background: '#fafafa',
      text: '#4b5563',
      border: '#e5e7eb',
    },
  },
  {
    name: 'Professional',
    description: 'Corporate and business-like theme',
    colors: {
      primary: '#2563eb',
      secondary: '#475569',
      background: '#f8fafc',
      text: '#1e293b',
      border: '#cbd5e1',
    },
  },
]

export async function GET() {
  return NextResponse.json(themePresets)
} 