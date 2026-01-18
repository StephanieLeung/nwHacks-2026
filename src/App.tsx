import React, { useState } from 'react'
import { GitVisualizer } from './components/GitVisualizer'
import Landing from './components/Landing'
import { GitProvider } from './context/GitContext'
import './App.css'

export default function App() {
  const [path, setPath] = useState<string>('')

  return (
    <div className="h-full m-0 p-0">
      {path.trim() === '' ? (
        <Landing setAppPath={setPath} />
      ) : (
      <GitProvider>
        <GitVisualizer />
      </GitProvider>
      )}
    </div>
  )
}