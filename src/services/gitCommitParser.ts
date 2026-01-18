import { Commit } from './dagLayout'

export async function fetchCommitsForDAG(): Promise<Commit[]> {
  try {
    // Use dedicated handler that runs git without a shell
    const output = await window.ipcRenderer.invoke('git:getHistory')
    return parseCommits(String(output))
  } catch (err) {
    console.error('Error fetching commits:', err)
    return []
  }
}

function parseCommits(gitOutput: string): Commit[] {
  return gitOutput
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const [hash, parents, refs, message] = line.split('|')
      return {
        hash: (hash || '').trim(),
        parents: parents ? parents.trim().split(' ').filter(Boolean) : [],
        refs: refs ? refs.trim().split(', ').map((r) => r.trim()).filter(Boolean) : [],
        message: (message || '').trim() || 'No message',
      }
    })
    .filter((c) => c.hash)
}