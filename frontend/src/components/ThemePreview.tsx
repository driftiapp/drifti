'use client'

import { useTheme } from '@/context/ThemeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getThemeStyles } from '@/lib/theme'

export function ThemePreview() {
    const { theme, accent } = useTheme()
    const styles = getThemeStyles(theme, accent)

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Theme Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Primary Button</h3>
                    <Button>Primary Button</Button>
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Secondary Button</h3>
                    <Button variant="secondary">Secondary Button</Button>
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Outline Button</h3>
                    <Button variant="outline">Outline Button</Button>
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Ghost Button</h3>
                    <Button variant="ghost">Ghost Button</Button>
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Link Button</h3>
                    <Button variant="link">Link Button</Button>
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Destructive Button</h3>
                    <Button variant="destructive">Destructive Button</Button>
                </div>
            </CardContent>
        </Card>
    )
} 