import React, { createContext, useContext, useState, useCallback } from 'react'

export interface GitData {
  status: string
  logs: string
  loading: boolean
  error: string | null
  characterState: 'idle' | 'working' | 'dirty'
  animationState: 'none' | 'pulling' | 'pushing'
  hasUnstagedChanges: boolean
}

interface GitContextType extends GitData {
  refetchGit: () => Promise<void>
  setCharacterState: (state: 'idle' | 'working' | 'dirty') => void
  triggerAnimation: (type: 'pulling' | 'pushing') => void
}

const GitContext = createContext<GitContextType | undefined>(undefined)

export function GitProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState('')
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [characterState, setCharacterState] = useState<'idle' | 'working' | 'dirty'>('idle')
  const [animationState, setAnimationState] = useState<'none' | 'pulling' | 'pushing'>('none')
  const [hasUnstagedChanges, setHasUnstagedChanges] = useState(false)

  const refetchGit = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await window.ipcRenderer.invoke('git:startup')
      setStatus(data.status)
      setLogs(data.logs)
      // Check for unstaged changes
      const hasChanges = await window.ipcRenderer.invoke('git:hasChanges')
      setHasUnstagedChanges(hasChanges)
      setCharacterState(hasChanges ? 'dirty' : 'idle')
      console.log('Git data refreshed:', data)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch git data')
    } finally {
      setLoading(false)
    }
  }, [])

  const triggerAnimation = useCallback((type: 'pulling' | 'pushing') => {
    setAnimationState(type)
    // Reset animation after 4 seconds
    setTimeout(() => {
      setAnimationState('none')
      // Refetch git data after animation completes
      refetchGit()
    }, 4000)
  }, [refetchGit])

  return (
    <GitContext.Provider value={{ status, logs, loading, error, refetchGit, characterState, setCharacterState, animationState, triggerAnimation, hasUnstagedChanges }}>
      {children}
    </GitContext.Provider>
  )
}

export function useGit() {
  const context = useContext(GitContext)
  if (!context) {
    throw new Error('useGit must be used within GitProvider')
  }
  return context
}