import { Loader2 } from "lucide-react"

interface LoadingStateProps {
    size?: number
    className?: string
}

export function LoadingState({ size = 24, className = "" }: LoadingStateProps) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <Loader2 className="h-6 w-6 animate-spin text-primary" size={size} />
        </div>
    )
} 