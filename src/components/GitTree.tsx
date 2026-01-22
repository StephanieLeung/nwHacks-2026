import { DAGGraph } from './DAGGraph'; 
import { useGit } from '../context/GitContext';
import { useEffect, useState } from 'react'
import Landing from './Landing';
import { usePath } from '../context/PathContext';

interface GitTreeProps {
  // activeTab: 'branches' | 'commits' | 'log' | 'tree';
  activeTab: 'landing' |'tree' | 'log';
}

export function GitTree({ activeTab }: GitTreeProps) {
  const { status, logs, loading, refetchGit } = useGit();
  const [commits, setCommits] = useState<any[]>([])
  const { path } = usePath();

  useEffect(() => {
    const refetch = async () => {
      await refetchGit();
    }
    refetch();
  }, [path, refetchGit])

  //fetch real commits on mount
  useEffect(() => {
    async function fetchCommits() {
      try {
        const data = await window.ipcRenderer.invoke('git:getHistory')
        setCommits(data)
        console.log('Real commits loaded:', data)
      } catch (err) {
        console.error('Error fetching commits:', err)
      }
    }
    fetchCommits()
  }, [])
  if (activeTab === 'landing') {
    return (
      <div className='w-full flex justify-center items-center'>
        <Landing />
      </div>
    )

  }

  if (activeTab === 'tree') {
    // return <RepositoryTree />;
    return (
      <div className="flex-1 h-full w-full overflow-hidden">
        <DAGGraph />
      </div>
  )
  }

  // Log view
  if (activeTab === 'log') {
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


  }