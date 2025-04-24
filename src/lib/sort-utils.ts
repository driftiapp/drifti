import { Prisma } from '@prisma/client'

interface SortField {
  field: string
  direction: 'asc' | 'desc'
}

type DataField = 'id' | 'name' | 'email' | 'createdAt' | 'updatedAt'

export function buildOrderByClause(sortFields: SortField[]) {
  return sortFields.map(sort => {
    const field = sort.field as DataField
    const direction = sort.direction

    // Handle special cases for different field types
    switch (field) {
      case 'name':
      case 'email':
        // Case-insensitive sorting for text fields
        return {
          [field]: {
            sort: direction,
            nulls: 'last',
            case: 'insensitive',
          },
        } as Prisma.DataOrderByWithRelationInput
      
      case 'createdAt':
      case 'updatedAt':
        // Date sorting with null handling
        return {
          [field]: {
            sort: direction,
            nulls: 'last',
          },
        } as Prisma.DataOrderByWithRelationInput
      
      case 'id':
        // Numeric sorting
        return {
          [field]: direction,
        } as Prisma.DataOrderByWithRelationInput
      
      default:
        // Default sorting behavior
        return {
          [field]: direction,
        } as Prisma.DataOrderByWithRelationInput
    }
  })
}

// Natural sort comparison for strings containing numbers
export function naturalSort(a: string, b: string): number {
  const aParts = a.match(/(\d+|\D+)/g) || []
  const bParts = b.match(/(\d+|\D+)/g) || []
  
  for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
    const aPart = aParts[i]
    const bPart = bParts[i]
    
    if (aPart === bPart) continue
    
    const aNum = parseInt(aPart)
    const bNum = parseInt(bPart)
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum
    }
    
    return aPart.localeCompare(bPart)
  }
  
  return aParts.length - bParts.length
}

// Custom sort function for mixed data types
export function customSort<T extends Record<string, unknown>>(
  items: T[],
  sortFields: SortField[],
  getValue: (item: T, field: string) => string | number | null
): T[] {
  return [...items].sort((a, b) => {
    for (const { field, direction } of sortFields) {
      const aValue = getValue(a, field)
      const bValue = getValue(b, field)
      
      // Handle null values
      if (aValue === null && bValue === null) continue
      if (aValue === null) return direction === 'asc' ? 1 : -1
      if (bValue === null) return direction === 'asc' ? -1 : 1
      
      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = naturalSort(aValue, bValue)
        if (comparison !== 0) {
          return direction === 'asc' ? comparison : -comparison
        }
      } else {
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        if (comparison !== 0) {
          return direction === 'asc' ? comparison : -comparison
        }
      }
    }
    return 0
  })
} 