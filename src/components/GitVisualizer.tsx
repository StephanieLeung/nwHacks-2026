import { useState } from 'react';
import { GitBranch, GitCommit, GitMerge, RefreshCw, Settings, Terminal, FolderGit2, Sparkles } from 'lucide-react';
import { GitTree } from './GitTree';
import { MenuBar } from './MenuBar';
import { TerminalPanel } from './TerminalPanel';

export function GitVisualizer() {
  const [activeTab, setActiveTab] = useState<'branches' | 'commits' | 'log' | 'tree'>('commits');

  return (
    <div className="w-[520px] h-[680px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-purple-200 relative">
      {/* Cute decorative elements */}
      <div className="absolute top-4 right-4 z-10">
        <div className="relative">
          {/* Git mascot */}
          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
            <GitBranch className="w-6 h-6" />
          </div>
          <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
        </div>
      </div>

      {/* Floating bubbles */}
      <div className="absolute top-20 right-12 w-6 h-6 bg-blue-200 rounded-full opacity-40 animate-pulse"></div>
      <div className="absolute top-32 right-8 w-4 h-4 bg-purple-200 rounded-full opacity-60"></div>

      {/* Window Title Bar */}
      <div className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-purple-700" />
          <span className="text-sm text-purple-800 font-semibold">✨ git visualizer</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-3 h-3 rounded-full bg-yellow-300 hover:bg-yellow-400 shadow-sm"></button>
          <button className="w-3 h-3 rounded-full bg-green-300 hover:bg-green-400 shadow-sm"></button>
          <button className="w-3 h-3 rounded-full bg-pink-300 hover:bg-pink-400 shadow-sm"></button>
        </div>
      </div>

      {/* Menu Bar */}
      <MenuBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area - Split into graph and details */}
      <div className="flex-1 overflow-hidden flex">
        <GitTree activeTab={activeTab} />
      </div>

      {/* Terminal Panel at bottom */}
      <TerminalPanel />
    </div>
  );
}