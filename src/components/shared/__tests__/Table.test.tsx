import { render, screen, fireEvent } from '@testing-library/react'
import { Table } from '../Table'

interface TestData {
    id: number
    name: string
    email: string
}

const testData: TestData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
]

const columns = [
    { header: 'ID', accessor: 'id' as const, sortable: true },
    { header: 'Name', accessor: 'name' as const, sortable: true },
    { header: 'Email', accessor: 'email' as const },
]

describe('Table', () => {
    it('renders table with data', () => {
        render(<Table data={testData} columns={columns} />)
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    })

    it('shows loading state', () => {
        render(<Table data={testData} columns={columns} isLoading={true} />)
        expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('shows empty state', () => {
        render(<Table data={[]} columns={columns} />)
        expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('handles sorting', () => {
        const onSort = jest.fn()
        render(
            <Table
                data={testData}
                columns={columns}
                onSort={onSort}
                sortField="name"
                sortDirection="asc"
            />
        )

        fireEvent.click(screen.getByText('Name'))
        expect(onSort).toHaveBeenCalledWith('name', 'desc')
    })

    it('handles pagination', () => {
        const longData = Array.from({ length: 15 }, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
        }))

        render(<Table data={longData} columns={columns} />)

        expect(screen.getByText('Showing 1 to 10 of 15 entries')).toBeInTheDocument()
        expect(screen.getByText('Next')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Next'))
        expect(screen.getByText('Showing 11 to 15 of 15 entries')).toBeInTheDocument()
        expect(screen.getByText('Previous')).toBeInTheDocument()
    })

    it('renders custom cell content', () => {
        const customColumns = [
            ...columns,
            {
                header: 'Actions',
                accessor: (item: TestData) => (
                    <button data-testid={`action-${item.id}`}>Edit</button>
                ),
            },
        ]

        render(<Table data={testData} columns={customColumns} />)
        expect(screen.getByTestId('action-1')).toBeInTheDocument()
        expect(screen.getByTestId('action-2')).toBeInTheDocument()
    })
}) 