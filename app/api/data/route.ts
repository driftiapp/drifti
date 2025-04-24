import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { buildOrderByClause } from '@/lib/sort-utils'
import { getCacheKey, getFromCache, setInCache } from '@/lib/cache'

const prisma = new PrismaClient()

interface SortField {
  field: string
  direction: 'asc' | 'desc'
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    
    // Parse sort fields from query parameters
    const sortFields: SortField[] = []
    const sortFieldParams = searchParams.getAll('sortField')
    const sortDirectionParams = searchParams.getAll('sortDirection')
    
    for (let i = 0; i < sortFieldParams.length; i++) {
      if (sortFieldParams[i] && sortDirectionParams[i]) {
        sortFields.push({
          field: sortFieldParams[i],
          direction: sortDirectionParams[i] as 'asc' | 'desc',
        })
      }
    }

    // Validate page and pageSize
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      )
    }
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: 'Invalid page size' },
        { status: 400 }
      )
    }

    // Validate sort fields
    const validFields = ['id', 'name', 'email', 'createdAt', 'updatedAt']
    const invalidField = sortFields.find(
      sort => !validFields.includes(sort.field)
    )
    if (invalidField) {
      return NextResponse.json(
        { error: `Invalid sort field: ${invalidField.field}` },
        { status: 400 }
      )
    }

    // Check cache
    const cacheKey = getCacheKey(page, pageSize, sortFields)
    const cachedData = getFromCache(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize

    // Build orderBy clause using our utility
    const orderBy = buildOrderByClause(sortFields)

    // Fetch data with pagination and sorting
    const [data, total] = await Promise.all([
      prisma.data.findMany({
        skip,
        take: pageSize,
        orderBy: orderBy.length > 0 ? orderBy : { id: 'asc' },
      }),
      prisma.data.count(),
    ])

    const response = {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      sortFields,
    }

    // Cache the response
    setInCache(cacheKey, response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
} 