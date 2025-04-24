import { DefaultSession, DefaultUser } from "next-auth"

export enum Role {
    USER = "USER",
    ADMIN = "ADMIN",
    BUSINESS_OWNER = "BUSINESS_OWNER",
    DRIVER = "DRIVER",
    CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT"
}

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: Role
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        role: Role
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: Role
    }
}

export interface JWTPayload {
    id: string;
    email: string;
    role: Role;
    iat?: number;
    exp?: number;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface AuthResponse {
    tokens: AuthTokens;
    user: {
        id: string;
        email: string;
        role: Role;
    };
} 