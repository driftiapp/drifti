interface ThemeColors {
    primary: string
    secondary: string
    background: string
    text: string
    border: string
}

export function applyThemeColors(colors: ThemeColors) {
    const root = document.documentElement

    // Apply each color as a CSS variable
    Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
    })
}

export function getThemeColors(): ThemeColors {
    const root = document.documentElement
    const style = getComputedStyle(root)

    return {
        primary: style.getPropertyValue('--primary').trim(),
        secondary: style.getPropertyValue('--secondary').trim(),
        background: style.getPropertyValue('--background').trim(),
        text: style.getPropertyValue('--text').trim(),
        border: style.getPropertyValue('--border').trim(),
    }
} 