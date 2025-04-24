"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Icons } from "@/components/icons"
import { useRouter } from "next/navigation"

export function UserProfile() {
    const { data: session } = useSession()
    const router = useRouter()

    if (!session?.user) {
        return (
            <Button
                variant="outline"
                onClick={() => router.push("/auth/signin" as const)}
            >
                Sign In
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ""} />
                        <AvatarFallback>
                            {session.user.name?.charAt(0) ?? session.user.email?.charAt(0) ?? "U"}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {session.user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => router.push("/profile" as const)}
                >
                    <Icons.user className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => router.push("/settings" as const)}
                >
                    <Icons.settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                >
                    <Icons.logout className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 