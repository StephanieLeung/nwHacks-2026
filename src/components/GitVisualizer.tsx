import { useState, useEffect } from 'react';
import { GitTree } from './GitTree';
import { MenuBar } from './MenuBar';
import { TerminalPanel } from './TerminalPanel';
import { useGit } from '../context/GitContext';

declare global {
  interface Window {
    API: typeof import('../../electron/preload').api;
  }
}

export function GitVisualizer() {
  const [activeTab, setActiveTab] = useState<'branches' | 'commits' | 'log' | 'tree'>('commits');
  const { loading, refetchGit } = useGit();

  useEffect(() => {
    // Fetch on mount
    refetchGit();

    // Poll the git:hasChanges endpoint every 5 seconds
    const intervalId = setInterval(() => {
      window.API.git.hasChanges()
        .then(response => {
          console.log('git:hasChanges response:', response);
        })
        .catch(error => {
          console.error('Error calling git:hasChanges:', error);
        });
    }, 5000); // 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [refetchGit]);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
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