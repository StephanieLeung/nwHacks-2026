import React, { createContext, useContext, useState } from 'react'

type PathContextType = {
  path: string
  setPath: (path: string) => void
}

const PathContext = createContext<PathContextType | undefined>(undefined)

export const PathProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>('')

  return (
    <PathContext.Provider value={{ path, setPath }}>
      {children}
    </PathContext.Provider>
  )
}

export const usePath = () => {
  const context = useContext(PathContext)
  if (!context) {
    throw new Error('usePath must be used within a PathProvider')
  }
  return context
}
