import { GitBranch, GitCommit, FileText, RefreshCw, Settings, FolderTree, Smile } from 'lucide-react';

interface MenuBarProps {
  activeTab: 'landing' | 'log' | 'tree';
  setActiveTab: (tab: 'landing' | 'log' | 'tree') => void;
}

export function MenuBar({ activeTab, setActiveTab }: MenuBarProps) {
  return (
    <div className="bg-purple-50 border-b-2 border-purple-200">
      {/* Tabs */}
      <div className="flex items-center px-3 pt-2 gap-1">
        {/* <button
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-t-xl transition-all ${
            activeTab === 'branches'
              ? 'bg-white text-purple-600 shadow-sm border-2 border-b-0 border-purple-200'
              : 'text-purple-400 hover:text-purple-600 hover:bg-purple-100/50'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Branches
        </button>
        <button
          onClick={() => setActiveTab('commits')}
          className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-t-xl transition-all ${
            activeTab === 'commits'
              ? 'bg-white text-purple-600 shadow-sm border-2 border-b-0 border-purple-200'
              : 'text-purple-400 hover:text-purple-600 hover:bg-purple-100/50'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          Commits
        </button> */}

        <button 
          onClick={() => setActiveTab('landing')}
          className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-t-xl transition-all ${
            activeTab === 'landing'
              ? 'bg-white text-purple-600 shadow-sm border-2 border-b-0 border-purple-200'
              : 'text-purple-400 hover:text-purple-600 hover:bg-purple-100/50'
          }`}
        >
          <Smile className='w-4 h-4' />
          Landing
        </button>

        <button
          onClick={() => setActiveTab('tree')}
          className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-t-xl transition-all ${
            activeTab === 'tree'
              ? 'bg-white text-purple-600 shadow-sm border-2 border-b-0 border-purple-200'
              : 'text-purple-400 hover:text-purple-600 hover:bg-purple-100/50'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Tree
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-t-xl transition-all ${
            activeTab === 'log'
              ? 'bg-white text-purple-600 shadow-sm border-2 border-b-0 border-purple-200'
              : 'text-purple-400 hover:text-purple-600 hover:bg-purple-100/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Log
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white">
        <button className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border-2 border-purple-200 rounded-full flex items-center gap-1.5 transition-all shadow-sm">
          <RefreshCw className="w-3.5 h-3.5" />
          Pull
        </button>
        <button className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-gradient-to-r from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 border-2 border-blue-200 rounded-full flex items-center gap-1.5 transition-all shadow-sm">
          Push
        </button>
        <button className="px-3 py-1.5 text-xs font-semibold text-pink-700 bg-gradient-to-r from-pink-100 to-rose-100 hover:from-pink-200 hover:to-rose-200 border-2 border-pink-200 rounded-full flex items-center gap-1.5 transition-all shadow-sm">
          Fetch
        </button>
        <div className="flex-1"></div>
        <button className="p-1.5 text-purple-400 hover:text-purple-600 hover:bg-purple-100 rounded-full transition-all">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}