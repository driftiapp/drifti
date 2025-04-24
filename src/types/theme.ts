export interface Theme {
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