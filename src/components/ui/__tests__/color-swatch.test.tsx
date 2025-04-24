import { render, screen } from '@testing-library/react'
import { ColorSwatch } from '../color-swatch'

describe('ColorSwatch', () => {
    it('renders with default size', () => {
        render(<ColorSwatch color="#ff0000" />)
        const swatch = screen.getByRole('presentation')
        expect(swatch).toHaveClass('h-8 w-8')
        expect(swatch).toHaveStyle({ backgroundColor: '#ff0000' })
    })

    it('renders with custom size', () => {
        render(<ColorSwatch color="#00ff00" size="sm" />)
        const swatch = screen.getByRole('presentation')
        expect(swatch).toHaveClass('h-4 w-4')
    })

    it('renders with custom className', () => {
        render(<ColorSwatch color="#0000ff" className="custom-class" />)
        const swatch = screen.getByRole('presentation')
        expect(swatch).toHaveClass('custom-class')
    })

    it('displays title attribute', () => {
        render(<ColorSwatch color="#ff00ff" title="Custom Title" />)
        const swatch = screen.getByRole('presentation')
        expect(swatch).toHaveAttribute('title', 'Custom Title')
    })

    it('uses color as title when no title is provided', () => {
        render(<ColorSwatch color="#ff00ff" />)
        const swatch = screen.getByRole('presentation')
        expect(swatch).toHaveAttribute('title', '#ff00ff')
    })
}) 