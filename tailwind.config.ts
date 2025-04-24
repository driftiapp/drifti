import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './frontend/src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0070f3",
          foreground: "#ffffff",
        },
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
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      fontSize: {
        'xxs': '0.625rem',
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'hard': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config 