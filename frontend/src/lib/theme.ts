import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import themeConfig from './theme-config.json'

export type Theme = 'light' | 'dark' | 'system'
export type AccentColor = keyof typeof themeConfig.accent.colors
export type FontSize = keyof typeof themeConfig.fontSize.sizes
export type Spacing = keyof typeof themeConfig.spacing.sizes
export type BorderRadius = keyof typeof themeConfig.borderRadius.sizes

export const accentColors = themeConfig.accent.colors
export const fontSizes = themeConfig.fontSize.sizes
export const spacing = themeConfig.spacing.sizes
export const borderRadius = themeConfig.borderRadius.sizes

export const themeTransition = 'transition-all duration-200 ease-in-out'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface ThemeConfig {
    theme: Theme
    accent: AccentColor
    fontSize: FontSize
    spacing: Spacing
    borderRadius: BorderRadius
}

export function getThemeStyles(config: ThemeConfig) {
    const { theme, accent, fontSize, spacing: spacingValue, borderRadius: radiusValue } = config

    const baseStyles = {
        light: {
            ...themeConfig.styles.light,
            'font-size': fontSizes[fontSize],
            spacing: spacing[spacingValue],
            'border-radius': borderRadius[radiusValue],
            primary: accentColors[accent],
            ring: accentColors[accent],
        },
        dark: {
            ...themeConfig.styles.dark,
            'font-size': fontSizes[fontSize],
            spacing: spacing[spacingValue],
            'border-radius': borderRadius[radiusValue],
            primary: accentColors[accent],
            ring: accentColors[accent],
        },
    }

    return theme === 'system'
        ? {
            light: baseStyles.light,
            dark: baseStyles.dark,
        }
        : baseStyles[theme]
}

export function exportTheme(config: ThemeConfig): string {
    return JSON.stringify(config, null, 2)
}

export function importTheme(json: string): ThemeConfig {
    const config = JSON.parse(json)
    return {
        theme: config.theme || themeConfig.theme.default,
        accent: config.accent || themeConfig.accent.default,
        fontSize: config.fontSize || themeConfig.fontSize.default,
        spacing: config.spacing || themeConfig.spacing.default,
        borderRadius: config.borderRadius || themeConfig.borderRadius.default,
    }
} 