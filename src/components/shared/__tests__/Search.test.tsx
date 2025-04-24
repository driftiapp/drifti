import { render, screen, fireEvent, act } from '@testing-library/react'
import { Search } from '../Search'

describe('Search', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('renders with placeholder', () => {
        render(<Search onSearch={() => { }} placeholder="Custom placeholder" />)
        expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument()
    })

    it('shows loading state while debouncing', () => {
        const onSearch = jest.fn()
        render(<Search onSearch={onSearch} debounceMs={300} />)

        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'test' } })
        expect(screen.getByRole('status')).toBeInTheDocument()

        act(() => {
            jest.advanceTimersByTime(300)
        })

        expect(onSearch).toHaveBeenCalledWith('test')
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('debounces search input', () => {
        const onSearch = jest.fn()
        render(<Search onSearch={onSearch} debounceMs={300} />)

        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 't' } })
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'te' } })
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'tes' } })
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'test' } })

        expect(onSearch).not.toHaveBeenCalled()

        act(() => {
            jest.advanceTimersByTime(300)
        })

        expect(onSearch).toHaveBeenCalledTimes(1)
        expect(onSearch).toHaveBeenCalledWith('test')
    })

    it('clears loading state when search is complete', () => {
        const onSearch = jest.fn()
        render(<Search onSearch={onSearch} debounceMs={300} />)

        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'test' } })
        expect(screen.getByRole('status')).toBeInTheDocument()

        act(() => {
            jest.advanceTimersByTime(300)
        })

        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
}) 