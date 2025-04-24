import { DefaultSession } from "next-auth"

export enum Role {
    USER = "USER",
    ADMIN = "ADMIN",
    BUSINESS_OWNER = "BUSINESS_OWNER",
    DRIVER = "DRIVER",
    CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT"
}

declare module "next-auth" {
    interface User {
        role: Role;
        emailVerified?: Date | null;
    }

    interface Session {
        user: {
            id: string;
            role: Role;
            emailVerified?: Date | null;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: Role;
    }
} 