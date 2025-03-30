import { Inter, Roboto, Open_Sans } from 'next/font/google';

// Define font subsets to load
const interSubsets: ('latin' | 'cyrillic' | 'cyrillic-ext' | 'greek' | 'greek-ext' | 'latin-ext' | 'vietnamese')[] = ['latin'];
const robotoSubsets: ('latin' | 'cyrillic' | 'cyrillic-ext' | 'greek' | 'greek-ext' | 'latin-ext' | 'vietnamese' | 'math' | 'symbols')[] = ['latin'];
const openSansSubsets: ('latin' | 'cyrillic' | 'cyrillic-ext' | 'greek' | 'greek-ext' | 'latin-ext' | 'vietnamese' | 'math' | 'symbols' | 'hebrew')[] = ['latin'];

// Define font weights to load
const weights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// Initialize fonts with optimization options
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  adjustFontFallback: true,
});

export const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
  preload: true,
  adjustFontFallback: true,
});

export const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-opensans',
  preload: true,
  adjustFontFallback: true,
});

// Font utility functions
export function getFontClass(font: 'inter' | 'roboto' | 'opensans'): string {
  switch (font) {
    case 'inter':
      return inter.variable;
    case 'roboto':
      return roboto.variable;
    case 'opensans':
      return openSans.variable;
    default:
      return inter.variable;
  }
}

export function getFontFamily(font: 'inter' | 'roboto' | 'opensans'): string {
  switch (font) {
    case 'inter':
      return 'var(--font-inter)';
    case 'roboto':
      return 'var(--font-roboto)';
    case 'opensans':
      return 'var(--font-opensans)';
    default:
      return 'var(--font-inter)';
  }
}

// Font fallback utility
export function getFontFallback(font: 'inter' | 'roboto' | 'opensans'): string {
  switch (font) {
    case 'inter':
      return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    case 'roboto':
      return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif';
    case 'opensans':
      return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    default:
      return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  }
}

// Example usage:
/*
// In your layout.tsx:
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto.variable} ${openSans.variable}`}>
      <head>
        <style jsx global>{`
          :root {
            --font-sans: ${getFontFamily('inter')}, ${getFontFallback('inter')};
            --font-heading: ${getFontFamily('roboto')}, ${getFontFallback('roboto')};
            --font-body: ${getFontFamily('opensans')}, ${getFontFallback('opensans')};
          }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

// In your components:
const headingStyle = {
  fontFamily: 'var(--font-heading)',
  fontWeight: weights.bold,
};

const bodyStyle = {
  fontFamily: 'var(--font-body)',
  fontWeight: weights.regular,
};
*/ 