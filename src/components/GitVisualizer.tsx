import { useState, useEffect } from 'react';
import { GitTree } from './GitTree';
import { MenuBar } from './MenuBar';
import { TerminalPanel } from './TerminalPanel';
import { useGit } from '../context/GitContext'

export function GitVisualizer() {
  const [activeTab, setActiveTab] = useState<'branches' | 'commits' | 'log' | 'tree'>('commits');
  const { loading, refetchGit } = useGit()
  useEffect(() => {
    //fetch on mount
    refetchGit()
  }, [refetchGit])

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <MenuBar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 overflow-hidden flex">
        <GitTree activeTab={activeTab} />
      </div>

      <TerminalPanel />
    </div>
  );
}