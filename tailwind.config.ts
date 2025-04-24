import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light theme colors
        'light-bg': '#ffffff',
        'light-text': '#1a1a1a',
        'light-primary': '#0066cc',
        'light-secondary': '#4a5568',
        'light-accent': '#38a169',

        // Dark theme colors
        'dark-bg': '#1a1a1a',
        'dark-text': '#ffffff',
        'dark-primary': '#60a5fa',
        'dark-secondary': '#9ca3af',
        'dark-accent': '#4ade80',

        // Sepia theme colors
        'sepia-bg': '#f4f1ea',
        'sepia-text': '#433422',
        'sepia-primary': '#8b4513',
        'sepia-secondary': '#6b5b4c',
        'sepia-accent': '#d2691e',

        // High contrast theme colors
        'high-contrast-bg': '#000000',
        'high-contrast-text': '#ffffff',
        'high-contrast-primary': '#ffff00',
        'high-contrast-secondary': '#00ffff',
        'high-contrast-accent': '#ff00ff',
      },
    },
  },
  plugins: [],
}

export default config 