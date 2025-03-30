'use client';

import { useEffect } from 'react';

// Define critical CSS styles
const criticalStyles = `
  /* Reset and base styles */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    -webkit-text-size-adjust: 100%;
  }

  body {
    font-family: var(--font-sans);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Critical layout styles */
  #__next {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  main {
    flex: 1;
  }

  /* Critical typography */
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    line-height: 1.2;
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 1rem;
  }

  /* Critical components */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
    cursor: pointer;
  }

  .btn-primary {
    background-color: #0070f3;
    color: white;
  }

  .btn-primary:hover {
    background-color: #0051b3;
  }

  /* Critical loading states */
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }

  .loading::after {
    content: '';
    width: 2rem;
    height: 2rem;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #0070f3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  :root {
    --font-sans: var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --font-heading: var(--font-roboto), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    --font-body: var(--font-opensans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
`;

// Hook to inject critical CSS
export function useCriticalCSS() {
  useEffect(() => {
    // Create style element
    const style = document.createElement('style');
    style.textContent = criticalStyles;

    // Add to head
    document.head.appendChild(style);

    // Cleanup
    return () => {
      document.head.removeChild(style);
    };
  }, []);
}

// Component to inject critical CSS
export function CriticalCSS() {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = criticalStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
}

// Utility to extract critical CSS from a component
export function extractCriticalCSS(component: React.ReactElement): string {
  // This is a placeholder for the actual critical CSS extraction logic
  // In a real implementation, you would use a tool like critical or penthouse
  // to extract the critical CSS from the rendered component
  return criticalStyles;
}

// Example usage:
/*
// In your layout.tsx:
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto.variable} ${openSans.variable}`}>
      <head>
        <style jsx global>{`
          ${criticalStyles}
        `}</style>
      </head>
      <body>
        <CriticalCSS />
        {children}
      </body>
    </html>
  );
}

// In your components:
export default function MyComponent() {
  useCriticalCSS();
  
  return (
    <div>
      <h1>My Component</h1>
      <p>This component has critical CSS injected.</p>
    </div>
  );
}
*/ 