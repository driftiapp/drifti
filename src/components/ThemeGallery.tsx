'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, Trash2, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Textarea } from './ui/textarea'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { fuzzySearch } from '@/lib/utils'
import { ColorSwatch } from "@/components/ui/color-swatch"

interface Theme {
  id: string
  name: string
  description: string
  author: string
  rating: number
  downloads: number
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    border: string
  }
}

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  createdAt: string
  likes: number
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export function ThemeGallery() {
  const { data: session } = useSession()
  const [themes, setThemes] = useState<Theme[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  })
  const [isLoading, setIsLoading] = useState(true)
  const [category, setCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('popular')
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [userRating, setUserRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [localSearch, setLocalSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch])

  // Filter themes locally when search is short
  const filteredThemes = useCallback(() => {
    if (debouncedSearch.length < 3) {
      return themes
    }
    return themes.filter(theme =>
      fuzzySearch(debouncedSearch, theme.name) ||
      fuzzySearch(debouncedSearch, theme.description) ||
      fuzzySearch(debouncedSearch, theme.category)
    )
  }, [themes, debouncedSearch])

  const fetchThemes = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: debouncedSearch,
        category,
        sortBy,
      })

      const response = await fetch(`/api/themes?${params}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setThemes(data.themes)
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages,
        totalItems: data.totalItems,
      }))
    } catch (error) {
      console.error('Error fetching themes:', error)
      toast.error('Failed to load themes', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }, [pagination.currentPage, pagination.itemsPerPage, debouncedSearch, category, sortBy])

  useEffect(() => {
    fetchThemes()
  }, [fetchThemes])

  const fetchComments = useCallback(async () => {
    if (!selectedTheme) return

    try {
      const response = await fetch(`/api/themes/${selectedTheme.id}/comments`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setComments(data.comments)
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      })
    }
  }, [selectedTheme])

  useEffect(() => {
    if (selectedTheme) {
      fetchComments()
    }
  }, [selectedTheme, fetchComments])

  const handleRating = useCallback(async (rating: number) => {
    if (!session) {
      toast.error('Please sign in to rate themes')
      return
    }

    if (!selectedTheme) return

    try {
      const response = await fetch(`/api/themes/${selectedTheme.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setUserRating(rating)
      setThemes(prevThemes =>
        prevThemes.map(theme =>
          theme.id === selectedTheme.id
            ? { ...theme, rating: data.rating }
            : theme
        )
      )
      toast.success('Rating submitted successfully')
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error('Failed to submit rating', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      })
    }
  }, [session, selectedTheme])

  const handleComment = useCallback(async () => {
    if (!session) {
      toast.error('Please sign in to comment')
      return
    }

    if (!selectedTheme) return

    try {
      const response = await fetch(`/api/themes/${selectedTheme.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setComments(prevComments => [data, ...prevComments])
      setNewComment('')
      toast.success('Comment added successfully')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      })
    }
  }, [session, selectedTheme, newComment])

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!selectedTheme) return

    try {
      const response = await fetch(
        `/api/themes/${selectedTheme.id}/comments?commentId=${commentId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId))
      toast.success('Comment deleted successfully')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      })
    }
  }, [selectedTheme])

  const applyTheme = useCallback(async (theme: Theme) => {
    try {
      const response = await fetch(`/api/themes/${theme.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      document.documentElement.style.setProperty('--primary', theme.colors.primary)
      document.documentElement.style.setProperty('--secondary', theme.colors.secondary)
      document.documentElement.style.setProperty('--background', theme.colors.background)
      document.documentElement.style.setProperty('--text', theme.colors.text)
      document.documentElement.style.setProperty('--border', theme.colors.border)

      toast.success('Theme applied successfully')
    } catch (error) {
      console.error('Error applying theme:', error)
      toast.error('Failed to apply theme', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      })
    }
  }, [])

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Input
            type="text"
            placeholder="Search themes..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="Light">Light</SelectItem>
              <SelectItem value="Dark">Dark</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Latest</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredThemes().map((theme) => (
            <Card key={theme.id} className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{theme.name}</h3>
                    <p className="text-sm text-muted-foreground">{theme.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(theme.colors).map(([key, value]) => (
                    <ColorSwatch
                      key={key}
                      color={value}
                      title={`${key}: ${value}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyTheme(theme)}
                  >
                    Apply Theme
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === pagination.currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPagination({ ...pagination, currentPage: page })}
            >
              {page}
            </Button>
          ))}
        </div>
      )}

      <Dialog open={!!selectedTheme} onOpenChange={() => setSelectedTheme(null)}>
        <DialogContent className="max-w-2xl">
          {selectedTheme && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTheme.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h4 className="mb-2 font-semibold">Rate this theme</h4>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 cursor-pointer transition-colors ${star <= (hoveredRating || userRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-none text-gray-300'
                          }`}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => handleRating(star)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold">Comments</h4>
                  {session ? (
                    <div className="mb-4 space-y-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <Button
                        onClick={handleComment}
                        disabled={!newComment.trim()}
                      >
                        Post Comment
                      </Button>
                    </div>
                  ) : (
                    <p className="mb-4 text-sm text-gray-500">
                      Please sign in to comment
                    </p>
                  )}

                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex items-start justify-between rounded-lg border p-3"
                      >
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-medium">
                              {comment.userName || 'Anonymous'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                        {session?.user?.id === comment.userId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-center text-gray-500">
                        No comments yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 