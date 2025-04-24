import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Action, Severity } from '@/types/ip';

// Define valid action types and severity levels
const VALID_ACTIONS = ['block', 'whitelist', 'view', 'note', 'scan', 'investigate'];
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];
const UNDO_WINDOW_SECONDS = 30;

// Define types for aggregation and operations
type AggregationResult = {
  action: string;
  severity: string;
  _count: {
    _all: number;
  };
};

type OperationType = 'update' | 'delete' | 'bulk_update' | 'bulk_delete';

type OperationLog = {
  id: string;
  type: OperationType;
  timestamp: Date;
  data: any;
  snapshot: any[];
  ip: string;
  userId: string;
  expiresAt: Date;
};

// In-memory operation log (in production, use Redis or similar)
const operationLogs = new Map<string, OperationLog>();

// Cleanup expired operations periodically
setInterval(() => {
  const now = new Date();
  const operationLogsArray = Array.from(operationLogs.entries());
  for (const [id, operation] of operationLogsArray) {
    if (operation.expiresAt < now) {
      operationLogs.delete(id);
    }
  }
}, 5000);

export async function GET(
  request: Request,
  { params }: { params: { ip: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse URL search params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const severity = searchParams.get('severity');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const minSeverity = searchParams.get('minSeverity');

    // Validate action type if provided
    if (action && !VALID_ACTIONS.includes(action)) {
      return new NextResponse('Invalid action type', { status: 400 });
    }

    // Validate severity if provided
    if (severity && !VALID_SEVERITIES.includes(severity)) {
      return new NextResponse('Invalid severity level', { status: 400 });
    }

    // Validate minSeverity if provided
    if (minSeverity && !VALID_SEVERITIES.includes(minSeverity)) {
      return new NextResponse('Invalid minimum severity level', { status: 400 });
    }

    // Validate date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        return new NextResponse('Start date must be before end date', { status: 400 });
      }
    }

    // Build where clause with advanced filtering
    const where = {
      ip: params.ip,
      ...(action && { action: action as Action }),
      ...(severity && { severity: severity as Severity }),
      ...(minSeverity && {
        severity: {
          in: VALID_SEVERITIES.slice(VALID_SEVERITIES.indexOf(minSeverity))
        }
      }),
      ...(startDate || endDate) && {
        timestamp: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      }
    };

    // Get total count for pagination
    const total = await prisma.ipHistory.count({ where });

    // Fetch paginated results with additional metadata
    const history = await prisma.ipHistory.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Get aggregation data for the current filter set
    const aggregations = await prisma.ipHistory.groupBy({
      by: ['action', 'severity'],
      where,
      _count: {
        _all: true
      }
    });

    // Return results with enhanced metadata
    return NextResponse.json({
      data: history,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      },
      aggregations: {
        byAction: aggregations.reduce((acc: Record<string, number>, curr: AggregationResult) => {
          acc[curr.action] = (acc[curr.action] || 0) + curr._count._all;
          return acc;
        }, {} as Record<string, number>),
        bySeverity: aggregations.reduce((acc: Record<string, number>, curr: AggregationResult) => {
          acc[curr.severity] = (acc[curr.severity] || 0) + curr._count._all;
          return acc;
        }, {} as Record<string, number>)
      },
      filters: {
        availableActions: VALID_ACTIONS,
        availableSeverities: VALID_SEVERITIES
      }
    });
  } catch (error) {
    console.error('Error fetching IP history:', error);
    if (error instanceof Error && error.message.includes('Invalid DateTime')) {
      return new NextResponse('Invalid date format', { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { ip: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { action, details, severity } = body;

    if (!action || !details || !severity) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Validate action and severity
    if (!VALID_ACTIONS.includes(action)) {
      return new NextResponse('Invalid action type', { status: 400 });
    }
    if (!VALID_SEVERITIES.includes(severity)) {
      return new NextResponse('Invalid severity level', { status: 400 });
    }

    const history = await prisma.ipHistory.create({
      data: {
        ip: params.ip,
        action,
        details,
        severity,
        userId: session.user.id
      }
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error creating IP history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { ip: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { ids, action, severity } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return new NextResponse('Invalid or missing IDs', { status: 400 });
    }

    // Validate action and severity if provided
    if (action && !VALID_ACTIONS.includes(action)) {
      return new NextResponse('Invalid action type', { status: 400 });
    }
    if (severity && !VALID_SEVERITIES.includes(severity)) {
      return new NextResponse('Invalid severity level', { status: 400 });
    }

    // Get snapshot of current state
    const snapshot = await prisma.ipHistory.findMany({
      where: {
        id: { in: ids },
        ip: params.ip
      }
    });

    // Build update data
    const updateData: any = {};
    if (action) updateData.action = action;
    if (severity) updateData.severity = severity;

    const result = await prisma.ipHistory.updateMany({
      where: {
        id: { in: ids },
        ip: params.ip
      },
      data: updateData
    });

    // Create operation log entry
    const operationId = crypto.randomUUID();
    const now = new Date();
    operationLogs.set(operationId, {
      id: operationId,
      type: 'bulk_update',
      timestamp: now,
      data: updateData,
      snapshot,
      ip: params.ip,
      userId: session.user.id,
      expiresAt: new Date(now.getTime() + UNDO_WINDOW_SECONDS * 1000)
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      operationId,
      undoExpiresAt: new Date(now.getTime() + UNDO_WINDOW_SECONDS * 1000)
    });
  } catch (error) {
    console.error('Error updating IP history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { ip: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',');

    if (!ids || ids.length === 0) {
      return new NextResponse('Invalid or missing IDs', { status: 400 });
    }

    // Get snapshot before deletion
    const snapshot = await prisma.ipHistory.findMany({
      where: {
        id: { in: ids },
        ip: params.ip
      }
    });

    const result = await prisma.ipHistory.deleteMany({
      where: {
        id: { in: ids },
        ip: params.ip
      }
    });

    // Create operation log entry
    const operationId = crypto.randomUUID();
    const now = new Date();
    operationLogs.set(operationId, {
      id: operationId,
      type: 'bulk_delete',
      timestamp: now,
      data: { ids },
      snapshot,
      ip: params.ip,
      userId: session.user.id,
      expiresAt: new Date(now.getTime() + UNDO_WINDOW_SECONDS * 1000)
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      operationId,
      undoExpiresAt: new Date(now.getTime() + UNDO_WINDOW_SECONDS * 1000)
    });
  } catch (error) {
    console.error('Error deleting IP history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// New endpoint for undo operations
export async function OPTIONS(
  request: Request,
  { params }: { params: { ip: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');

    if (!operationId) {
      return new NextResponse('Operation ID is required', { status: 400 });
    }

    const operation = operationLogs.get(operationId);
    if (!operation) {
      return new NextResponse('Operation not found or expired', { status: 404 });
    }

    if (operation.expiresAt < new Date()) {
      operationLogs.delete(operationId);
      return new NextResponse('Operation has expired', { status: 410 });
    }

    if (operation.ip !== params.ip || operation.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Perform undo based on operation type
    switch (operation.type) {
      case 'bulk_update':
      case 'bulk_delete':
        // Restore from snapshot
        for (const record of operation.snapshot) {
          await prisma.ipHistory.upsert({
            where: { id: record.id },
            create: record,
            update: record
          });
        }
        break;

      default:
        return new NextResponse('Unsupported operation type', { status: 400 });
    }

    // Remove the operation from the log
    operationLogs.delete(operationId);

    return NextResponse.json({
      success: true,
      message: 'Operation successfully undone',
      restoredCount: operation.snapshot.length
    });
  } catch (error) {
    console.error('Error undoing operation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// New endpoint for bulk operations
export async function PATCH(
  request: Request,
  { params }: { params: { ip: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { operation, ids, data } = body;

    if (!operation || !ids || !Array.isArray(ids) || ids.length === 0) {
      return new NextResponse('Invalid request parameters', { status: 400 });
    }

    let result;
    switch (operation) {
      case 'export':
        // Get selected records for export
        const records = await prisma.ipHistory.findMany({
          where: {
            id: { in: ids },
            ip: params.ip
          },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        });
        return NextResponse.json(records);

      case 'bulk_update':
        if (!data) {
          return new NextResponse('Missing update data', { status: 400 });
        }
        result = await prisma.ipHistory.updateMany({
          where: {
            id: { in: ids },
            ip: params.ip
          },
          data
        });
        return NextResponse.json({
          success: true,
          updatedCount: result.count
        });

      case 'bulk_delete':
        result = await prisma.ipHistory.deleteMany({
          where: {
            id: { in: ids },
            ip: params.ip
          }
        });
        return NextResponse.json({
          success: true,
          deletedCount: result.count
        });

      default:
        return new NextResponse('Invalid operation', { status: 400 });
    }
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 