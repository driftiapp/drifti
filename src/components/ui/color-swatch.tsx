import { cn } from "@/lib/utils"

interface ColorSwatchProps {
    color: string
    size?: "sm" | "md" | "lg"
    className?: string
    title?: string
}

export function ColorSwatch({ color, size = "md", className, title }: ColorSwatchProps) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12"
    }

    return (
        <div
            className={cn(
                "rounded-md transition-colors",
                sizeClasses[size],
                className
            )}
            style={{ backgroundColor: color }}
            title={title || color}
            role="presentation"
        />
    )
} 