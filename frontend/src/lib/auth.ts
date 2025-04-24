import { NextAuthOptions } from "next-auth";
import { prisma } from "./prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { Role } from "../../../src/types/auth";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        throw new Error("Missing credentials");
                    }

                    const user = await prisma.user.findUnique({
                        where: {
                            email: credentials.email,
                        },
                    });

                    if (!user) {
                        throw new Error("User not found");
                    }

                    const isPasswordValid = await compare(credentials.password, user.password);

                    if (!isPasswordValid) {
                        throw new Error("Invalid password");
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role as Role,
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async session({ token, session }) {
            try {
                if (token && session.user) {
                    session.user.id = token.id;
                    session.user.name = token.name;
                    session.user.email = token.email;
                    session.user.role = token.role as Role;
                }
                return session;
            } catch (error) {
                console.error("Session callback error:", error);
                return session;
            }
        },
        async jwt({ token, user }) {
            try {
                if (user) {
                    token.id = user.id;
                    token.role = user.role;
                }

                const dbUser = await prisma.user.findFirst({
                    where: {
                        email: token.email!,
                    },
                });

                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role as Role;
                }

                return token;
            } catch (error) {
                console.error("JWT callback error:", error);
                return token;
            }
        },
    },
}; 