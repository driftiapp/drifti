import { Role } from '../types/auth';

export type Permission =
    | 'read:own_profile'
    | 'update:own_profile'
    | 'read:own_orders'
    | 'create:order'
    | 'read:all'
    | 'write:all'
    | 'delete:all'
    | 'manage:users'
    | 'manage:roles'
    | 'manage:system'
    | 'read:own_store'
    | 'write:own_store'
    | 'manage:own_orders'
    | 'manage:own_products'
    | 'view:own_analytics'
    | 'read:own_deliveries'
    | 'update:own_deliveries'
    | 'view:own_earnings'
    | 'read:all_orders'
    | 'update:order_status'
    | 'read:all_profiles'
    | 'manage:support_tickets';

// Define permissions for each role
export const rolePermissions: Record<Role, readonly Permission[]> = {
    USER: [
        'read:own_profile',
        'update:own_profile',
        'read:own_orders',
        'create:order',
    ] as const,
    ADMIN: [
        'read:all',
        'write:all',
        'delete:all',
        'manage:users',
        'manage:roles',
        'manage:system',
    ] as const,
    BUSINESS_OWNER: [
        'read:own_store',
        'write:own_store',
        'manage:own_orders',
        'manage:own_products',
        'view:own_analytics',
    ] as const,
    DRIVER: [
        'read:own_deliveries',
        'update:own_deliveries',
        'view:own_earnings',
    ] as const,
    CUSTOMER_SUPPORT: [
        'read:all_orders',
        'update:order_status',
        'read:all_profiles',
        'manage:support_tickets',
    ] as const,
};

// Helper function to check if a role has a specific permission
export function hasPermission(role: Role, permission: Permission): boolean {
    const permissions = rolePermissions[role] || [];
    return permissions.includes(permission);
}

// Helper function to get all permissions for a role
export function getRolePermissions(role: Role): readonly Permission[] {
    return rolePermissions[role] || [];
}

// Helper function to check if a role has all required permissions
export function hasAllPermissions(role: Role, requiredPermissions: Permission[]): boolean {
    const rolePerms = rolePermissions[role] || [];
    return requiredPermissions.every(perm => rolePerms.includes(perm));
}

// Helper function to check if a role has any of the required permissions
export function hasAnyPermission(role: Role, requiredPermissions: Permission[]): boolean {
    const rolePerms = rolePermissions[role] || [];
    return requiredPermissions.some(perm => rolePerms.includes(perm));
} 