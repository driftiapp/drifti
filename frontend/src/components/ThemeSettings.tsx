'use client'

import { useTheme } from '@/context/ThemeContext'
import { Button, Card, CardContent, CardHeader, CardTitle, RadioGroup, RadioGroupItem, Label } from './ui'
import { Moon, Sun, Monitor, RotateCcw } from 'lucide-react'
import { AccentColor, accentColors, FontSize, Spacing, BorderRadius } from '@/lib/theme'
import { ThemePreview } from './ThemePreview'
import { useState } from 'react'
import { toast } from 'sonner'

export function ThemeSettings() {
    const {
        theme,
        setTheme,
        accent,
        setAccent,
        fontSize,
        setFontSize,
        spacing,
        setSpacing,
        borderRadius,
        setBorderRadius,
        syncTheme
    } = useTheme()

    const [isLoading, setIsLoading] = useState(false)

    const handleThemeChange = async (value: string) => {
        try {
            setIsLoading(true)
            setTheme(value as 'light' | 'dark' | 'system')
            await syncTheme()
            toast.success('Theme updated successfully')
        } catch (error) {
            toast.error('Failed to update theme')
            console.error('Error updating theme:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAccentChange = async (value: AccentColor) => {
        try {
            setIsLoading(true)
            setAccent(value)
            await syncTheme()
            toast.success('Accent color updated successfully')
        } catch (error) {
            toast.error('Failed to update accent color')
            console.error('Error updating accent color:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFontSizeChange = async (value: string) => {
        try {
            setIsLoading(true)
            setFontSize(value as FontSize)
            await syncTheme()
            toast.success('Font size updated successfully')
        } catch (error) {
            toast.error('Failed to update font size')
            console.error('Error updating font size:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSpacingChange = async (value: string) => {
        try {
            setIsLoading(true)
            setSpacing(value as Spacing)
            await syncTheme()
            toast.success('Spacing updated successfully')
        } catch (error) {
            toast.error('Failed to update spacing')
            console.error('Error updating spacing:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleBorderRadiusChange = async (value: string) => {
        try {
            setIsLoading(true)
            setBorderRadius(value as BorderRadius)
            await syncTheme()
            toast.success('Border radius updated successfully')
        } catch (error) {
            toast.error('Failed to update border radius')
            console.error('Error updating border radius:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleReset = async () => {
        try {
            setIsLoading(true)
            setTheme('system')
            setAccent('blue')
            setFontSize('medium')
            setSpacing('comfortable')
            setBorderRadius('medium')
            await syncTheme()
            toast.success('Theme settings reset to default')
        } catch (error) {
            toast.error('Failed to reset theme settings')
            console.error('Error resetting theme settings:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Theme Settings</CardTitle>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleReset}
                        disabled={isLoading}
                        aria-label="Reset theme settings"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Label>Theme</Label>
                        <RadioGroup
                            value={theme}
                            onValueChange={handleThemeChange}
                            className="space-y-4"
                            name="theme"
                            disabled={isLoading}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="light" id="light" name="theme" />
                                <Label htmlFor="light" className="flex items-center space-x-2">
                                    <Sun className="h-4 w-4" />
                                    <span>Light</span>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="dark" id="dark" name="theme" />
                                <Label htmlFor="dark" className="flex items-center space-x-2">
                                    <Moon className="h-4 w-4" />
                                    <span>Dark</span>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="system" id="system" name="theme" />
                                <Label htmlFor="system" className="flex items-center space-x-2">
                                    <Monitor className="h-4 w-4" />
                                    <span>System</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-4">
                        <Label>Accent Color</Label>
                        <div className="grid grid-cols-5 gap-4">
                            {Object.entries(accentColors).map(([color, value]) => (
                                <Button
                                    key={color}
                                    variant={accent === color ? 'default' : 'outline'}
                                    className="h-8 w-8 p-0"
                                    style={{ backgroundColor: value }}
                                    onClick={() => handleAccentChange(color as AccentColor)}
                                    aria-label={`Set accent color to ${color}`}
                                    disabled={isLoading}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label>Font Size</Label>
                        <RadioGroup
                            value={fontSize}
                            onValueChange={handleFontSizeChange}
                            className="space-y-4"
                            name="fontSize"
                            disabled={isLoading}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="small" id="font-small" name="fontSize" />
                                <Label htmlFor="font-small">Small</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="medium" id="font-medium" name="fontSize" />
                                <Label htmlFor="font-medium">Medium</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="large" id="font-large" name="fontSize" />
                                <Label htmlFor="font-large">Large</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-4">
                        <Label>Spacing</Label>
                        <RadioGroup
                            value={spacing}
                            onValueChange={handleSpacingChange}
                            className="space-y-4"
                            name="spacing"
                            disabled={isLoading}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="compact" id="spacing-compact" name="spacing" />
                                <Label htmlFor="spacing-compact">Compact</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="comfortable" id="spacing-comfortable" name="spacing" />
                                <Label htmlFor="spacing-comfortable">Comfortable</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="spacious" id="spacing-spacious" name="spacing" />
                                <Label htmlFor="spacing-spacious">Spacious</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-4">
                        <Label>Border Radius</Label>
                        <RadioGroup
                            value={borderRadius}
                            onValueChange={handleBorderRadiusChange}
                            className="space-y-4"
                            name="borderRadius"
                            disabled={isLoading}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="none" id="radius-none" name="borderRadius" />
                                <Label htmlFor="radius-none">None</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="small" id="radius-small" name="borderRadius" />
                                <Label htmlFor="radius-small">Small</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="medium" id="radius-medium" name="borderRadius" />
                                <Label htmlFor="radius-medium">Medium</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="large" id="radius-large" name="borderRadius" />
                                <Label htmlFor="radius-large">Large</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </CardContent>
            </Card>

            <ThemePreview />
        </div>
    )
} 