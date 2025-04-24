import { render, screen, fireEvent } from '@testing-library/react'
import { Filter } from '../Filter'

const options = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' },
]

describe('Filter', () => {
    it('renders with label', () => {
        render(<Filter type="select" label="Test Filter" options={options} value={null} onChange={() => { }} />)
        expect(screen.getByText('Test Filter')).toBeInTheDocument()
    })

    it('handles single select', () => {
        const onChange = jest.fn()
        render(<Filter type="select" label="Test Filter" options={options} value={null} onChange={onChange} />)

        fireEvent.click(screen.getByText('Test Filter'))
        fireEvent.click(screen.getByText('Option 1'))

        expect(onChange).toHaveBeenCalledWith('1')
    })

    it('handles multi select', () => {
        const onChange = jest.fn()
        render(
            <Filter
                type="multi-select"
                label="Test Filter"
                options={options}
                value={[]}
                onChange={onChange}
            />
        )

        fireEvent.click(screen.getByText('Test Filter'))
        fireEvent.click(screen.getByText('Option 1'))
        fireEvent.click(screen.getByText('Option 2'))

        expect(onChange).toHaveBeenCalledWith(['1', '2'])
    })

    it('handles clearing single select', () => {
        const onChange = jest.fn()
        render(
            <Filter
                type="select"
                label="Test Filter"
                options={options}
                value="1"
                onChange={onChange}
            />
        )

        fireEvent.click(screen.getByTitle('Clear filter'))
        expect(onChange).toHaveBeenCalledWith(null)
    })

    it('handles clearing multi select', () => {
        const onChange = jest.fn()
        render(
            <Filter
                type="multi-select"
                label="Test Filter"
                options={options}
                value={['1', '2']}
                onChange={onChange}
            />
        )

        fireEvent.click(screen.getByTitle('Clear filter'))
        expect(onChange).toHaveBeenCalledWith([])
    })

    it('handles removing individual items in multi select', () => {
        const onChange = jest.fn()
        render(
            <Filter
                type="multi-select"
                label="Test Filter"
                options={options}
                value={['1', '2']}
                onChange={onChange}
            />
        )

        fireEvent.click(screen.getByTitle('Remove Option 1'))
        expect(onChange).toHaveBeenCalledWith(['2'])
    })

    it('renders boolean value correctly', () => {
        render(
            <Filter
                type="boolean"
                label="Test Filter"
                options={options}
                value={true}
                onChange={() => { }}
            />
        )

        expect(screen.getByText('Yes')).toBeInTheDocument()
    })

    it('renders date range value correctly', () => {
        const dateRange = { start: '2024-01-01', end: '2024-01-31' }
        render(
            <Filter
                type="date-range"
                label="Test Filter"
                options={options}
                value={dateRange}
                onChange={() => { }}
            />
        )

        expect(screen.getByText('2024-01-01 - 2024-01-31')).toBeInTheDocument()
    })
}) 