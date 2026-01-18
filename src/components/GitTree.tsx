import { GitBranch, GitCommit, GitMerge, Circle, FileCode } from 'lucide-react';
import { RepositoryTree } from './RepositoryTree';
import GitHistoryGraph from './GitHistoryGraph';
import { useGit } from '../context/GitContext';

interface GitTreeProps {
  activeTab: 'branches' | 'commits' | 'log' | 'tree';
}

const mockBranches = [
  { name: 'main', current: true, commits: 45 },
  { name: 'feature/user-auth', current: false, commits: 12 },
  { name: 'bugfix/header-issue', current: false, commits: 3 },
  { name: 'develop', current: false, commits: 38 },
];

const mockCommits = [
  { hash: '7f3a2c1', message: 'Add user authentication', author: 'John Doe', time: '2 hours ago', branch: 'main', color: 'pink' },
  { hash: 'b4e9d82', message: 'Fix header styling issue', author: 'Jane Smith', time: '5 hours ago', branch: 'main', color: 'blue' },
  { hash: 'a1c4f5e', message: 'Update dependencies', author: 'John Doe', time: '1 day ago', branch: 'main', color: 'purple' },
  { hash: '9e2b8a3', message: 'Merge feature branch', author: 'Alice Johnson', time: '2 days ago', branch: 'main', isMerge: true, color: 'green' },
  { hash: '3c7f1d9', message: 'Add login component', author: 'John Doe', time: '2 days ago', branch: 'feature/user-auth', color: 'yellow' },
  { hash: '6d8e4b2', message: 'Initial commit', author: 'John Doe', time: '1 week ago', branch: 'main', color: 'pink' },
];

const mockFiles = [
  { name: 'Header.tsx', status: 'modified', lines: '+12 -3' },
  { name: 'auth.ts', status: 'added', lines: '+45' },
  { name: 'styles.css', status: 'modified', lines: '+8 -2' },
  { name: 'config.json', status: 'deleted', lines: '-20' },
];

const mockLog = [
  '$ git status',
  'On branch main',
  'Your branch is ahead of \'origin/main\' by 3 commits.',
  '  (use "git push" to publish your local commits)',
  '',
  'Changes not staged for commit:',
  '  (use "git add <file>..." to update what will be committed)',
  '  modified:   src/components/Header.tsx',
  '',
  'no changes added to commit',
  '',
  '$ git log --oneline -5',
  '7f3a2c1 Add user authentication',
  'b4e9d82 Fix header styling issue',
  'a1c4f5e Update dependencies',
  '9e2b8a3 Merge feature branch',
  '3c7f1d9 Add login component',
];

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', dot: 'bg-pink-400' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', dot: 'bg-blue-400' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', dot: 'bg-purple-400' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', dot: 'bg-green-400' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', dot: 'bg-yellow-400' },
  };
  return colors[color] || colors.pink;
};

export function GitTree({ activeTab }: GitTreeProps) {
  const { status, logs, loading } = useGit();
  if (activeTab === 'tree') {
    // return <RepositoryTree />;
    return (
      <div className="flex-1 h-full overflow-hidden pt-4">
        <GitHistoryGraph />
      </div>
  )
  }

  if (activeTab === 'branches') {
    return (
      <div className="flex-1 p-4 overflow-auto">
        <div className="space-y-2">
          {mockBranches.map((branch, index) => {
            const colors = ['pink', 'blue', 'purple', 'green'];
            const colorClasses = getColorClasses(colors[index % colors.length]);
            return (
              <div
                key={branch.name}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all border-2 ${
                  branch.current
                    ? `${colorClasses.bg} ${colorClasses.border} shadow-sm`
                    : 'hover:bg-purple-50 border-transparent hover:border-purple-100'
                }`}
              >
                <GitBranch
                  className={`w-5 h-5 ${branch.current ? colorClasses.text : 'text-gray-400'}`}
                />
                <span
                  className={`text-sm flex-1 font-medium ${
                    branch.current ? colorClasses.text : 'text-gray-600'
                  }`}
                >
                  {branch.name}
                </span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colorClasses.bg} ${colorClasses.text}`}>
                  {branch.commits}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTab === 'commits') {
    return (
      <div className="flex-1 flex overflow-hidden">
        {/* Left side: Graph visualization */}
        <div className="w-1/2 p-4 overflow-auto border-r-2 border-purple-100">
          <div className="space-y-0">
            {mockCommits.map((commit, index) => {
              const colorClasses = getColorClasses(commit.color);
              const isLast = index === mockCommits.length - 1;
              
              return (
                <div key={commit.hash} className="flex gap-3 relative">
                  {/* Graph line */}
                  <div className="flex flex-col items-center relative">
                    {commit.isMerge ? (
                      <div className={`w-6 h-6 ${colorClasses.dot} rounded-full flex items-center justify-center shadow-md z-10`}>
                        <GitMerge className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className={`w-5 h-5 ${colorClasses.dot} rounded-full shadow-md z-10`}></div>
                    )}
                    {!isLast && (
                      <div className={`w-0.5 h-16 ${colorClasses.dot} opacity-30 mt-1`}></div>
                    )}
                  </div>
                  
                  {/* Commit info */}
                  <div className="flex-1 pb-4">
                    <div className={`px-3 py-2 rounded-xl ${colorClasses.bg} border ${colorClasses.border}`}>
                      <div className="text-xs font-mono text-gray-500 mb-1">{commit.hash}</div>
                      <div className={`text-sm font-medium ${colorClasses.text}`}>{commit.message}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side: File changes */}
        <div className="w-1/2 p-4 overflow-auto bg-purple-50/30">
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-purple-600 mb-2">📝 Changed Files</h3>
          </div>
          <div className="space-y-2">
            {mockFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border-2 border-purple-100 hover:border-purple-200 transition-all"
              >
                <div className={`w-2 h-2 rounded-full ${
                  file.status === 'modified' ? 'bg-yellow-400' :
                  file.status === 'added' ? 'bg-green-400' :
                  'bg-red-400'
                }`}></div>
                <FileCode className="w-4 h-4 text-purple-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 truncate">{file.name}</div>
                  <div className="text-xs text-gray-500">{file.lines}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    );
  }

  // Log view
return (
    <div className="flex-1 p-4 overflow-auto bg-purple-50/30">
      <div className="font-mono text-xs space-y-1 bg-white p-4 rounded-2xl border-2 border-purple-100">
        {loading ? (
          <div className="text-gray-500">Loading git status...</div>
        ) : (
          <>
            <div className="text-purple-600 font-semibold">$ git status</div>
            {status.split('\n').map((line, index) => (
              <div
                key={index}
                className={`${
                  line.includes('modified:')
                    ? 'text-yellow-600'
                    : line.includes('deleted:')
                    ? 'text-red-600'
                    : line.includes('new file:')
                    ? 'text-green-600'
                    : 'text-gray-600'
                }`}
              >
                {line || '\u00A0'}
              </div>
            ))}
            
            <div className="mt-4 text-purple-600 font-semibold">$ git log -5</div>
            {logs.split('\n').map((line, index) => (
              <div key={index} className="text-gray-600">
                {line || '\u00A0'}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}