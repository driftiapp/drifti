import { logActivity, getRecentActivity, getActivityByType, getActivityByDateRange } from '../activity-logger'
import { Prisma } from '@prisma/client'
import { headers } from 'next/headers'
import { ActivityType } from '../activity-logger'

type MockPrismaClient = {
    $queryRaw: jest.Mock;
}

// Mock next/headers
jest.mock('next/headers', () => ({
    headers: () => new Map([
        ['x-forwarded-for', '127.0.0.1'],
        ['user-agent', 'test-agent']
    ])
}))

// Mock prisma
jest.mock('../prisma', () => {
    const mockPrismaClient: MockPrismaClient = {
        $queryRaw: jest.fn()
    }
    return {
        prisma: mockPrismaClient
    }
})

// Get the mocked prisma instance
import { prisma } from '../prisma'
const mockedPrisma = prisma as unknown as MockPrismaClient

describe('Activity Logger', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('logActivity', () => {
        it('should log activity with metadata', async () => {
            const userId = 'user123'
            const type: ActivityType = 'LOGIN'
            const description = 'User logged in'
            const metadata = { browser: 'Chrome' }

            await logActivity(userId, type, description, metadata)

            expect(mockedPrisma.$queryRaw).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO "ActivityLog"')
            )
        })

        it('should log activity without metadata', async () => {
            const userId = 'user123'
            const type: ActivityType = 'LOGOUT'
            const description = 'User logged out'

            await logActivity(userId, type, description)

            expect(mockedPrisma.$queryRaw).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO "ActivityLog"')
            )
        })
    })

    describe('getRecentActivity', () => {
        it('should get recent activity for a user with limit', async () => {
            const userId = 'user123'
            const mockActivities = [
                {
                    id: '1',
                    userId: 'user123',
                    type: 'LOGIN',
                    description: 'User logged in',
                    ipAddress: '127.0.0.1',
                    userAgent: 'test-agent',
                    metadata: null,
                    createdAt: new Date()
                }
            ]

            mockedPrisma.$queryRaw.mockResolvedValueOnce(mockActivities)

            const result = await getRecentActivity(userId, 1)

            expect(mockedPrisma.$queryRaw).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM "ActivityLog"')
            )
            expect(result).toEqual(mockActivities)
        })
    })

    describe('getActivityByType', () => {
        it('should get activities by type', async () => {
            const type: ActivityType = 'LOGIN'
            const mockActivities = [
                {
                    id: '1',
                    userId: 'user123',
                    type: 'LOGIN',
                    description: 'User logged in',
                    ipAddress: '127.0.0.1',
                    userAgent: 'test-agent',
                    metadata: null,
                    createdAt: new Date()
                }
            ]

            mockedPrisma.$queryRaw.mockResolvedValueOnce(mockActivities)

            const result = await getActivityByType(type)

            expect(mockedPrisma.$queryRaw).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM "ActivityLog"')
            )
            expect(result).toEqual(mockActivities)
        })
    })

    describe('getActivityByDateRange', () => {
        it('should get activities within date range', async () => {
            const startDate = new Date('2024-01-01')
            const endDate = new Date('2024-01-02')
            const mockActivities = [
                {
                    id: '1',
                    userId: 'user123',
                    type: 'LOGIN',
                    description: 'User logged in',
                    ipAddress: '127.0.0.1',
                    userAgent: 'test-agent',
                    metadata: null,
                    createdAt: new Date('2024-01-01T12:00:00Z')
                }
            ]

            mockedPrisma.$queryRaw.mockResolvedValueOnce(mockActivities)

            const result = await getActivityByDateRange(startDate, endDate)

            expect(mockedPrisma.$queryRaw).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM "ActivityLog"')
            )
            expect(result).toEqual(mockActivities)
        })
    })
}) 