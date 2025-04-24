import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'sepia' | 'high-contrast' | 'rider' | 'driver' | 'owner' | 'system'

interface ThemeState {
    theme: Theme
    setTheme: (theme: Theme) => void
}

export const useTheme = create<ThemeState>((set) => ({
    theme: 'system',
    setTheme: (theme) => set({ theme }),
}))

export async function loadUserTheme(): Promise<Theme> {
    try {
        const response = await fetch('/api/user/theme')
        if (!response.ok) throw new Error('Failed to load theme')
        const data = await response.json()
        return data.theme
    } catch (error) {
        console.error('Error loading theme:', error)
        return 'system'
    }
}

export async function syncThemeWithBackend(theme: Theme): Promise<void> {
    try {
        const response = await fetch('/api/user/theme', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ theme }),
        })
        if (!response.ok) throw new Error('Failed to sync theme')
    } catch (error) {
        console.error('Error syncing theme:', error)
    }
} 