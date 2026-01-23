import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useTerminal } from './TerminalContext'

export interface GitData {
  status: string
  logs: string
  loading: boolean
  error: string | null
  characterState: 'idle' | 'working' | 'dirty' | 'stashed'
  animationState: 'none' | 'pulling' | 'pushing'
  hasUnstagedChanges: boolean
  showCommitInput: boolean;
}

interface GitContextType extends GitData {
  refetchGit: () => Promise<void>
  setCharacterState: (state: 'idle' | 'working' | 'dirty') => void
  triggerAnimation: (type: 'pulling' | 'pushing') => void
  handleGitAction: (action: string, commitMessage?: string) => void
}

const GitContext = createContext<GitContextType | undefined>(undefined)

export function GitProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState('')
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [characterState, setCharacterState] = useState<'idle' | 'working' | 'dirty' | 'stashed'>('idle')
  const [animationState, setAnimationState] = useState<'none' | 'pulling' | 'pushing'>('none')
  const [currentCommand, setCurrentCommand] = useState<string>('');
  const [showCommitInput, setShowCommitInput] = useState(false);
  const { setCommand } = useTerminal();
  const [hasUnstagedChanges, setHasUnstagedChanges] = useState(false)

  const refetchGit = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await window.ipcRenderer.invoke('git:startup')
      setStatus(data.status)
      setLogs(data.logs)
      // Check for unstaged changes
      const hasChanges = await window.ipcRenderer.invoke('git:hasChanges')
      setHasUnstagedChanges(hasChanges)
      setCharacterState(hasChanges ? 'dirty' : 'idle')
      console.log('Git data refreshed:', data)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch git data')
    } finally {
      setLoading(false)
    }
  }, [])

  const triggerAnimation = useCallback((type: 'pulling' | 'pushing') => {
    setAnimationState(type)
    // Reset animation after 4 seconds
    setTimeout(() => {
      setAnimationState('none')
      // Refetch git data after animation completes
      refetchGit()
    }, 4000)
  }, [refetchGit])

  
const handleCommit = (commitMessage?: string) => {
  console.log('Commit button clicked'); // Debugging log
  if (!commitMessage) {
    commitMessage = '';
  }
  if (commitMessage.trim()) {
    console.log('Commit message:', commitMessage); // Debugging log
    const statusCmd = `git status --porcelain`;
    setCommand(statusCmd);
    window.API.git.run('status --porcelain')
      .then(statusOutput => {
        if (!statusOutput.trim()) {
          console.error('No changes to commit');
          return;
        }
        console.log('committing changes...');
        const commitCmd = `git commit -m "${commitMessage}"`;
        setCommand(commitCmd);
        window.API.git.run(`commit -m "${commitMessage}"`)
          .then(response => {
            console.log('Commit successful:', response);
          })
          .catch(error => console.error('Commit failed:', error));
      })
      .catch(error => console.error('Failed to check status:', error));
  } else {
    console.error('Commit message cannot be empty');
  }
};

const handlePush = () => {
  const cmd = `git push origin HEAD`;
  setCommand(cmd);
  triggerAnimation('pushing');
  window.API.git.run('push origin HEAD')
    .then(response => {
      console.log('Push successful:', response);
      return response;
    })
    .catch(error => console.error('Push failed:', error));
}

const handlePull = () => {
    const cmd = `git pull`;
    setCommand(cmd);
    triggerAnimation('pulling');
    window.API.git.run('pull')
      .then(response => {
        console.log('Pull successful:', response)
        return response;
      })
      .catch(error => console.error('Pull failed:', error));
}

const handleStash = () => {
  const cmd = `git stash`;
  setCommand(cmd);
  window.API.git.run('stash')
    .then(response => {
      console.log('Stash successful:', response)
      setCharacterState('stashed');
      return response;
    })
    .catch(error => console.error('Stash failed:', error));
}

const handleUnstash = () => {
  const cmd = `git stash pop`;
  setCommand(cmd);
  window.API.git.run('stash pop')
    .then(response => {
      setCharacterState(hasUnstagedChanges ? 'dirty' : 'idle');
      console.log('Unstash successful:', response)
      return response;
    })
    .catch(error => console.error('Unstash failed:', error));
}

  const handleGitAction = useCallback((action: string, commitMessage?: string) => {
    const gitActionMap: Record<string, (msg?: string) => void> = {
      commit: handleCommit,
      push: handlePush, 
      pull: handlePull,
      stash: handleStash,
      unstash: handleUnstash
    }
    
    return commitMessage ? gitActionMap[action.toLowerCase()](commitMessage) : gitActionMap[action.toLowerCase()]()    
    
  }, [])

  useEffect(() => {
    // Poll the git:hasChanges endpoint every 5 seconds
    const intervalId = setInterval(() => {
      window.API.git.hasChanges()
        .then(response => {
          if (response.hasChanges) {
            // setLittleMan(hold_box);
            setCharacterState('dirty')
          } else {
            // Revert to the default state based on characterState
            setCharacterState('idle');
          }
        })
        .catch(error => {
          console.error('Error calling git:hasChanges:', error);
        });
    }, 5000); // 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [characterState]);

  return (
    <GitContext.Provider value={{ status, logs, loading, error, refetchGit, characterState, setCharacterState, animationState, triggerAnimation, hasUnstagedChanges, showCommitInput, handleGitAction }}>
      {children}
    </GitContext.Provider>
  )
}

export function useGit() {
  const context = useContext(GitContext)
  if (!context) {
    throw new Error('useGit must be used within GitProvider')
  }
  return context
}