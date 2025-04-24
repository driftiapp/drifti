'use client';

import * as React from "react"
import type { LucideIcon } from "lucide-react"

interface IconProps extends React.ComponentPropsWithoutRef<"svg"> {
    icon: LucideIcon
}

export function Icon({ icon: Icon, ...props }: IconProps) {
    return <Icon {...props} />
} 