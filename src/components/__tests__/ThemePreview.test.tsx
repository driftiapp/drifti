import { render, screen, fireEvent } from '@testing-library/react'
import { ThemePreview } from '../ThemePreview'
import { ThemeProvider } from '@/context/ThemeContext'

const mockSetTheme = jest.fn()

jest.mock('@/context/ThemeContext', () => ({
    useTheme: () => ({
        setTheme: mockSetTheme
    })
}))

describe('ThemePreview', () => {
    beforeEach(() => {
        mockSetTheme.mockClear()
    })

    it('renders theme preview correctly', () => {
        render(
            <ThemeProvider>
                <ThemePreview theme="light" />
            </ThemeProvider>
        )

        expect(screen.getByText('Sample App')).toBeInTheDocument()
        expect(screen.getByText('Theme Preview')).toBeInTheDocument()
        expect(screen.getByText('Sample Card')).toBeInTheDocument()
    })

    it('applies selected theme styles', () => {
        render(
            <ThemeProvider>
                <ThemePreview theme="light" isSelected />
            </ThemeProvider>
        )

        const preview = screen.getByRole('button')
        expect(preview).toHaveClass('ring-2 ring-[var(--primary)] ring-offset-2')
    })

    it('calls onSelect when clicked', () => {
        const onSelect = jest.fn()
        render(
            <ThemeProvider>
                <ThemePreview theme="light" onSelect={onSelect} />
            </ThemeProvider>
        )

        fireEvent.click(screen.getByRole('button'))
        expect(onSelect).toHaveBeenCalled()
        expect(mockSetTheme).toHaveBeenCalledWith('light')
    })

    it('displays theme name', () => {
        render(
            <ThemeProvider>
                <ThemePreview theme="light" />
            </ThemeProvider>
        )

        expect(screen.getByText('Light')).toBeInTheDocument()
    })

    it('renders color swatches', () => {
        render(
            <ThemeProvider>
                <ThemePreview theme="light" />
            </ThemeProvider>
        )

        const swatches = screen.getAllByRole('presentation')
        expect(swatches.length).toBeGreaterThan(0)
    })
}) 