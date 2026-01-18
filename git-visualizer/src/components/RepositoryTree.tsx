import { useState } from 'react';
import { Folder, FolderOpen, File, ChevronRight, ChevronDown, GitBranch, GitMerge, Circle } from 'lucide-react';

interface CommitNode {
  hash: string;
  author: string;
  time: string;
  branches: string[];
  lane: number;
  hasLineDown?: boolean;
  hasLineUp?: boolean;
  mergeLines?: { from: number; to: number }[];
  isCurrent?: boolean;
}

const mockGitGraph: CommitNode[] = [
  { 
    hash: '7f3a2c1', 
    author: 'John', 
    time: '2h',
    branches: ['main'],
    lane: 0,
    hasLineDown: true,
    isCurrent: true
  },
  { 
    hash: 'b4e9d82', 
    author: 'Jane', 
    time: '5h',
    branches: [],
    lane: 0,
    hasLineDown: true,
    hasLineUp: true
  },
  { 
    hash: 'a1c4f5e', 
    author: 'John', 
    time: '1d',
    branches: [],
    lane: 0,
    hasLineDown: true,
    hasLineUp: true,
    mergeLines: [{ from: 1, to: 0 }]
  },
  { 
    hash: '9e2b8a3', 
    author: 'Alice', 
    time: '2d',
    branches: [],
    lane: 0,
    hasLineDown: true,
    hasLineUp: true
  },
  { 
    hash: 'c8f2a11', 
    author: 'John', 
    time: '2d',
    branches: ['feature/user-auth'],
    lane: 1,
    hasLineDown: true,
    hasLineUp: true
  },
  { 
    hash: '3c7f1d9', 
    author: 'John', 
    time: '3d',
    branches: [],
    lane: 1,
    hasLineDown: true,
    hasLineUp: true
  },
  { 
    hash: '5d9e2b4', 
    author: 'Jane', 
    time: '4d',
    branches: [],
    lane: 0,
    hasLineDown: true,
    hasLineUp: true,
    mergeLines: [{ from: 2, to: 0 }]
  },
  { 
    hash: '1a8c3f7', 
    author: 'Alice', 
    time: '5d',
    branches: ['develop'],
    lane: 0,
    hasLineDown: true,
    hasLineUp: true
  },
  { 
    hash: '4e7d9c2', 
    author: 'Bob', 
    time: '6d',
    branches: [],
    lane: 0,
    hasLineDown: true,
    hasLineUp: true
  },
  { 
    hash: 'f2a9b3e', 
    author: 'Jane', 
    time: '6d',
    branches: ['bugfix/header'],
    lane: 2,
    hasLineDown: true,
    hasLineUp: true
  },
  { 
    hash: '2b5c8d1', 
    author: 'Alice', 
    time: '7d',
    branches: [],
    lane: 0,
    hasLineDown: true,
    hasLineUp: true
  },
  { 
    hash: '8f1e4a9', 
    author: 'John', 
    time: '8d',
    branches: [],
    lane: 1,
    hasLineDown: true,
    hasLineUp: true
  },
  { 
    hash: 'e3d7c2f', 
    author: 'Bob', 
    time: '9d',
    branches: [],
    lane: 2,
    hasLineDown: true,
    hasLineUp: true
  },
  { 
    hash: '6d8e4b2', 
    author: 'John', 
    time: '1w',
    branches: [],
    lane: 0,
    hasLineUp: true
  },
];

const laneColors = [
  { dot: 'bg-purple-400', line: 'border-purple-300', current: 'bg-purple-500 ring-4 ring-purple-200' },
  { dot: 'bg-pink-400', line: 'border-pink-300', current: 'bg-pink-500 ring-4 ring-pink-200' },
  { dot: 'bg-blue-400', line: 'border-blue-300', current: 'bg-blue-500 ring-4 ring-blue-200' },
  { dot: 'bg-green-400', line: 'border-green-300', current: 'bg-green-500 ring-4 ring-green-200' },
  { dot: 'bg-yellow-400', line: 'border-yellow-300', current: 'bg-yellow-500 ring-4 ring-yellow-200' },
];

const branchColors: Record<string, string> = {
  'main': 'bg-purple-200 text-purple-800 border-purple-400',
  'develop': 'bg-blue-200 text-blue-800 border-blue-400',
  'feature/user-auth': 'bg-pink-200 text-pink-800 border-pink-400',
  'bugfix/header': 'bg-green-200 text-green-800 border-green-400',
};

export function RepositoryTree() {
  const maxLanes = 3;

  return (
    <div className="flex-1 p-4 overflow-auto">
      <div className="mb-4 px-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-purple-600">🌳 Git Commit Tree</h3>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded-full ring-2 ring-purple-200"></div>
            <span className="text-gray-600">Current</span>
          </div>
        </div>
      </div>
      <div className="relative">
        {mockGitGraph.map((commit, index) => {
          const color = laneColors[commit.lane % laneColors.length];
          const nextCommit = mockGitGraph[index + 1];

          return (
            <div key={commit.hash} className="flex gap-2 relative">
              {/* Graph visualization */}
              <div className="flex gap-0 relative" style={{ width: `${maxLanes * 20}px`, height: '32px' }}>
                {/* Draw vertical lines for all lanes */}
                {Array.from({ length: maxLanes }).map((_, laneIdx) => {
                  const laneColor = laneColors[laneIdx % laneColors.length];
                  const hasCommitInLane = commit.lane === laneIdx;
                  
                  // Check if this lane continues from previous or to next commit
                  const prevCommit = mockGitGraph[index - 1];
                  const shouldDrawUp = hasCommitInLane && commit.hasLineUp;
                  const shouldDrawDown = hasCommitInLane && commit.hasLineDown;

                  return (
                    <div key={laneIdx} className="relative flex items-center justify-center" style={{ width: '20px' }}>
                      {/* Vertical line up */}
                      {shouldDrawUp && (
                        <div 
                          className={`absolute border-l-2 ${laneColor.line}`} 
                          style={{ 
                            width: '0px', 
                            height: '16px',
                            top: '0px',
                            left: '9px'
                          }}
                        ></div>
                      )}
                      
                      {/* Vertical line down */}
                      {shouldDrawDown && (
                        <div 
                          className={`absolute border-l-2 ${laneColor.line}`} 
                          style={{ 
                            width: '0px', 
                            height: '16px',
                            top: '16px',
                            left: '9px'
                          }}
                        ></div>
                      )}

                      {/* Commit dot */}
                      {hasCommitInLane && (
                        <div 
                          className={`absolute ${commit.isCurrent ? color.current : color.dot} rounded-full shadow-md z-10`}
                          style={{ 
                            width: commit.isCurrent ? '12px' : '8px',
                            height: commit.isCurrent ? '12px' : '8px',
                            top: '10px',
                            left: commit.isCurrent ? '4px' : '6px'
                          }}
                        ></div>
                      )}
                    </div>
                  );
                })}

                {/* Draw merge lines */}
                {commit.mergeLines?.map((merge, idx) => {
                  const fromX = merge.from * 20 + 10;
                  const toX = merge.to * 20 + 10;
                  const mergeColor = laneColors[merge.from % laneColors.length];
                  
                  return (
                    <svg 
                      key={idx}
                      className="absolute pointer-events-none" 
                      style={{ 
                        left: `${Math.min(fromX, toX) - 10}px`,
                        top: '-16px',
                        width: `${Math.abs(toX - fromX) + 20}px`,
                        height: '32px'
                      }}
                    >
                      <path
                        d={fromX < toX 
                          ? `M 10 0 Q ${(Math.abs(toX - fromX)) / 2} 16 ${Math.abs(toX - fromX) + 10} 32`
                          : `M ${Math.abs(toX - fromX) + 10} 0 Q ${(Math.abs(toX - fromX)) / 2} 16 10 32`
                        }
                        stroke={mergeColor.line.includes('purple') ? '#d8b4fe' : 
                                mergeColor.line.includes('pink') ? '#fbcfe8' :
                                mergeColor.line.includes('blue') ? '#bfdbfe' :
                                mergeColor.line.includes('green') ? '#bbf7d0' : '#fde68a'}
                        strokeWidth="2"
                        fill="none"
                        className="opacity-70"
                      />
                    </svg>
                  );
                })}
              </div>

              {/* Commit info - compact */}
              <div className={`flex items-center gap-2 flex-1 px-2 py-1 rounded-lg transition-all ${
                commit.isCurrent 
                  ? 'bg-purple-100 border-2 border-purple-300' 
                  : 'hover:bg-purple-50'
              }`}>
                <span className="text-xs font-mono text-gray-500 w-16">{commit.hash}</span>
                {commit.branches.length > 0 && (
                  <div className="flex gap-1">
                    {commit.branches.map((branch) => (
                      <span
                        key={branch}
                        className={`text-xs px-2 py-0.5 rounded-full border-2 font-bold flex items-center gap-1 ${branchColors[branch] || 'bg-gray-100 text-gray-700 border-gray-300'}`}
                      >
                        <GitBranch className="w-2.5 h-2.5" />
                        {branch}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto text-xs text-gray-500">
                  <span>{commit.author}</span>
                  <span className="text-gray-400">•</span>
                  <span>{commit.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}