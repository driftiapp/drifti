import { useTheme } from '@/store/useTheme'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const themes = [
  { id: 'light', label: '☀️ Light', description: 'Clean and bright' },
  { id: 'dark', label: '🌙 Dark', description: 'Easy on the eyes' },
  { id: 'sepia', label: '📜 Sepia', description: 'Warm and classic' },
  { id: 'high-contrast', label: '🔍 High Contrast', description: 'Maximum readability' },
  { id: 'rider', label: '🚗 Rider', description: 'Optimized for drivers' },
  { id: 'driver', label: '🚚 Driver', description: 'Delivery focused' },
  { id: 'owner', label: '👔 Owner', description: 'Business management' },
] as const

export function ThemeToggle() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  const currentTheme = themes.find((t) => t.id === theme) || themes[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <span>{currentTheme.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`flex items-center gap-2 ${theme === t.id ? 'bg-accent/10' : ''}`}
          >
            <div>
              <div className="font-medium">{t.label}</div>
              <div className="text-sm text-muted-foreground">{t.description}</div>
            </div>
            {theme === t.id && (
              <span className="ml-auto">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 