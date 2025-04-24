'use client'

import { ReactNode, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

type FilterType = 'select' | 'multi-select' | 'date-range' | 'boolean'

interface FilterOption {
    label: string
    value: string
}

interface FilterProps {
    type: FilterType
    label: string
    options?: FilterOption[]
    value: any
    onChange: (value: any) => void
    className?: string
}

export function Filter({
    type,
    label,
    options = [],
    value,
    onChange,
    className = '',
}: FilterProps) {
    const [isOpen, setIsOpen] = useState(false)

    const handleSelect = (option: FilterOption) => {
        if (type === 'multi-select') {
            const currentValues = Array.isArray(value) ? value : []
            const newValues = currentValues.includes(option.value)
                ? currentValues.filter((v) => v !== option.value)
                : [...currentValues, option.value]
            onChange(newValues)
        } else {
            onChange(option.value)
            setIsOpen(false)
        }
    }

    const handleClear = () => {
        onChange(type === 'multi-select' ? [] : null)
    }

    const renderValue = () => {
        if (!value) return null

        if (type === 'multi-select' && Array.isArray(value)) {
            return value.map((v) => {
                const option = options.find((o) => o.value === v)
                return option ? (
                    <Badge key={v} variant="secondary" className="mr-1">
                        {option.label}
                        <button
                            className="ml-1"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleSelect(option)
                            }}
                            aria-label={`Remove ${option.label}`}
                            title={`Remove ${option.label}`}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ) : null
            })
        }

        if (type === 'select') {
            const option = options.find((o) => o.value === value)
            return option?.label
        }

        if (type === 'boolean') {
            return value ? 'Yes' : 'No'
        }

        if (type === 'date-range') {
            return `${value.start} - ${value.end}`
        }

        return value
    }

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                        {label}
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    {options.map((option) => (
                        <DropdownMenuItem
                            key={option.value}
                            onClick={() => handleSelect(option)}
                            className="flex items-center justify-between"
                        >
                            <span>{option.label}</span>
                            {type === 'multi-select' && Array.isArray(value) && (
                                <input
                                    type="checkbox"
                                    checked={value.includes(option.value)}
                                    onChange={() => { }}
                                    className="ml-2"
                                    aria-label={`Select ${option.label}`}
                                    title={`Select ${option.label}`}
                                />
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            {value && (
                <div className="flex items-center gap-2">
                    {renderValue()}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        className="h-6 w-6"
                        aria-label="Clear filter"
                        title="Clear filter"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    )
} 