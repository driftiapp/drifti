"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string
    onValueChange?: (value: string) => void
    name?: string
    disabled?: boolean
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
    ({ className, value, onValueChange, name, disabled, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                role="radiogroup"
                className={cn("grid gap-2", className)}
                data-disabled={disabled}
                {...props}
            >
                {React.Children.map(children, (child) => {
                    if (React.isValidElement<RadioGroupItemProps>(child)) {
                        return React.cloneElement(child, {
                            ...child.props,
                            disabled: disabled || child.props.disabled,
                        })
                    }
                    return child
                })}
            </div>
        )
    }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
    ({ className, value, ...props }, ref) => {
        return (
            <input
                type="radio"
                ref={ref}
                value={value}
                className={cn(
                    "h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            />
        )
    }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem } 