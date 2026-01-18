import React, { createContext, useContext, useState, useCallback } from 'react'

export interface GitData {
  status: string
  logs: string
  loading: boolean
  error: string | null
}

interface GitContextType extends GitData {
  refetchGit: () => Promise<void>
}

const GitContext = createContext<GitContextType | undefined>(undefined)

export function GitProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState('')
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetchGit = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await window.ipcRenderer.invoke('git:startup')
      setStatus(data.status)
      setLogs(data.logs)
      console.log('Git data refreshed:', data)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch git data')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <GitContext.Provider value={{ status, logs, loading, error, refetchGit }}>
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