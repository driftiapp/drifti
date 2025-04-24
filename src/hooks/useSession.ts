'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { Session } from 'next-auth'

interface SessionState {
  session: Session | null
  setSession: (session: Session | null) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session: Session | null) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: 'session-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function useSession() {
  const { session, setSession, clearSession } = useSessionStore()
  
  return {
    session,
    setSession,
    clearSession,
    isAuthenticated: !!session,
  }
} 