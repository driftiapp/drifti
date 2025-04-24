'use client'

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const stored = localStorage.getItem('theme-storage');
              const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              
              if (stored) {
                try {
                  const { state } = JSON.parse(stored);
                  const theme = state.theme;
                  const resolved = theme === 'system' ? systemTheme : theme;
                  
                  // Add theme class and data attribute
                  document.documentElement.classList.add(resolved);
                  document.documentElement.setAttribute('data-theme', resolved);
                } catch (e) {
                  console.warn('Failed to parse stored theme, using system theme', e);
                  document.documentElement.classList.add(systemTheme);
                  document.documentElement.setAttribute('data-theme', systemTheme);
                }
              } else {
                document.documentElement.classList.add(systemTheme);
                document.documentElement.setAttribute('data-theme', systemTheme);
              }
            } catch (e) {
              console.warn('Failed to restore theme, using light theme', e);
              document.documentElement.classList.add('light');
              document.documentElement.setAttribute('data-theme', 'light');
            }
          })();
        `,
      }}
    />
  )
} 