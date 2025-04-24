import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'sepia-bg': '#f4ecd8',
                'sepia-text': '#5b4636',
                'sepia-primary': '#8b7355',
                'sepia-secondary': '#d4c4a8',
                'sepia-accent': '#a67c52',
                'high-contrast-bg': '#000000',
                'high-contrast-text': '#ffffff',
                'high-contrast-primary': '#ffff00',
                'high-contrast-secondary': '#00ffff',
                'high-contrast-accent': '#ff00ff',
            },
        },
    },
    plugins: [forms, typography],
} 