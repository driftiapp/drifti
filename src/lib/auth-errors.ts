export class AuthError extends Error {
    constructor(
        message: string,
        public code: string,
        public status: number = 401
    ) {
        super(message)
        this.name = 'AuthError'
    }
}

export const AuthErrors = {
    INVALID_CREDENTIALS: new AuthError(
        'Invalid email or password',
        'INVALID_CREDENTIALS'
    ),
    UNAUTHORIZED: new AuthError(
        'You must be logged in to access this resource',
        'UNAUTHORIZED'
    ),
    FORBIDDEN: new AuthError(
        'You do not have permission to access this resource',
        'FORBIDDEN',
        403
    ),
    INVALID_TOKEN: new AuthError(
        'Invalid or expired token',
        'INVALID_TOKEN'
    ),
    ACCOUNT_LOCKED: new AuthError(
        'Your account has been locked. Please contact support.',
        'ACCOUNT_LOCKED',
        403
    ),
    TWO_FACTOR_REQUIRED: new AuthError(
        'Two-factor authentication is required',
        'TWO_FACTOR_REQUIRED'
    ),
    TWO_FACTOR_INVALID: new AuthError(
        'Invalid two-factor authentication code',
        'TWO_FACTOR_INVALID'
    ),
    EMAIL_NOT_VERIFIED: new AuthError(
        'Please verify your email address',
        'EMAIL_NOT_VERIFIED'
    ),
    PASSWORD_RESET_REQUIRED: new AuthError(
        'Password reset is required',
        'PASSWORD_RESET_REQUIRED'
    ),
    SESSION_EXPIRED: new AuthError(
        'Your session has expired. Please log in again.',
        'SESSION_EXPIRED'
    ),
} as const

export function handleAuthError(error: unknown): AuthError {
    if (error instanceof AuthError) {
        return error
    }

    if (error instanceof Error) {
        return new AuthError(
            error.message,
            'UNKNOWN_ERROR',
            500
        )
    }

    return new AuthError(
        'An unknown error occurred',
        'UNKNOWN_ERROR',
        500
    )
} 