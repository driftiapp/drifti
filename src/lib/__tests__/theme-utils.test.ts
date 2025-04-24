import { applyThemeColors, getThemeColors } from '../theme-utils'

describe('Theme Utilities', () => {
    beforeEach(() => {
        // Reset CSS variables before each test
        document.documentElement.style.removeProperty('--primary')
        document.documentElement.style.removeProperty('--secondary')
        document.documentElement.style.removeProperty('--background')
        document.documentElement.style.removeProperty('--text')
        document.documentElement.style.removeProperty('--border')
    })

    it('applies theme colors correctly', () => {
        const colors = {
            primary: '#ff0000',
            secondary: '#00ff00',
            background: '#0000ff',
            text: '#ffffff',
            border: '#000000'
        }

        applyThemeColors(colors)

        expect(document.documentElement.style.getPropertyValue('--primary')).toBe(colors.primary)
        expect(document.documentElement.style.getPropertyValue('--secondary')).toBe(colors.secondary)
        expect(document.documentElement.style.getPropertyValue('--background')).toBe(colors.background)
        expect(document.documentElement.style.getPropertyValue('--text')).toBe(colors.text)
        expect(document.documentElement.style.getPropertyValue('--border')).toBe(colors.border)
    })

    it('gets theme colors correctly', () => {
        const colors = {
            primary: '#ff0000',
            secondary: '#00ff00',
            background: '#0000ff',
            text: '#ffffff',
            border: '#000000'
        }

        applyThemeColors(colors)
        const retrievedColors = getThemeColors()

        expect(retrievedColors).toEqual(colors)
    })

    it('handles empty theme colors', () => {
        const colors = {
            primary: '',
            secondary: '',
            background: '',
            text: '',
            border: ''
        }

        applyThemeColors(colors)
        const retrievedColors = getThemeColors()

        expect(retrievedColors).toEqual(colors)
    })
}) 