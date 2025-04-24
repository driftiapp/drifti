import { render, screen } from '@testing-library/react'
import { LoadingState } from '../LoadingState'

describe('LoadingState', () => {
    it('renders with default size', () => {
        render(<LoadingState />)
        const loader = screen.getByRole('status')
        expect(loader).toBeInTheDocument()
    })

    it('renders with custom size', () => {
        render(<LoadingState size={32} />)
        const loader = screen.getByRole('status')
        expect(loader).toHaveStyle({ width: '32px', height: '32px' })
    })

    it('renders with custom className', () => {
        render(<LoadingState className="custom-class" />)
        const container = screen.getByRole('status').parentElement
        expect(container).toHaveClass('custom-class')
    })
}) 