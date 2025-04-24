import { NextRequest, NextResponse } from 'next/server';
import { Role } from '../types/auth';
import { hasPermission, hasAllPermissions, hasAnyPermission, Permission } from '../lib/permissions';

export function withRole(requiredPermissions: Permission[]) {
    return async function (
        request: NextRequest,
        handler: (req: NextRequest) => Promise<NextResponse>
    ): Promise<NextResponse> {
        const user = (request as any).user;

        if (!user || !user.role) {
            return new NextResponse(
                JSON.stringify({ message: 'Authentication required' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Check if user has all required permissions
        if (!hasAllPermissions(user.role as Role, requiredPermissions)) {
            return new NextResponse(
                JSON.stringify({ message: 'Insufficient permissions' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return handler(request);
    };
}

export function withAnyRole(requiredPermissions: Permission[]) {
    return async function (
        request: NextRequest,
        handler: (req: NextRequest) => Promise<NextResponse>
    ): Promise<NextResponse> {
        const user = (request as any).user;

        if (!user || !user.role) {
            return new NextResponse(
                JSON.stringify({ message: 'Authentication required' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Check if user has any of the required permissions
        if (!hasAnyPermission(user.role as Role, requiredPermissions)) {
            return new NextResponse(
                JSON.stringify({ message: 'Insufficient permissions' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return handler(request);
    };
}

// Helper function to check if a user has a specific permission
export function checkPermission(role: Role, permission: Permission): boolean {
    return hasPermission(role, permission);
} 