import { useState } from 'react';
import { GitTree } from './GitTree';
import { MenuBar } from './MenuBar';
import { TerminalPanel } from './TerminalPanel';

export function GitVisualizer() {
  const [activeTab, setActiveTab] = useState<'branches' | 'commits' | 'log' | 'tree'>('commits');

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