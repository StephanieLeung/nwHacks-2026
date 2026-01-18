import { useEffect, useState } from 'react'
import { DAGLayout, LayoutNode, Commit } from '../services/dagLayout'
import { fetchCommitsForDAG } from '../services/gitCommitParser'
import { useGit } from '../context/GitContext'
import { LittleMan } from './LittleMan'

export function DAGGraph() {
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [currentCommit, setCurrentCommit] = useState<string | null>(null)
  const [checkingOutBranch, setCheckingOutBranch] = useState<string | null>(null)
  const { refetchGit, characterState} = useGit()
  const hoverTimeoutRef = useState<NodeJS.Timeout | null>(null)[0]

  useEffect(() => {
    async function buildDAG() {
      setLoading(true)
      try {
        const commits = await fetchCommitsForDAG()
        const branches = extractBranches(commits)
        const layout = new DAGLayout(commits)
        const nodes = layout.getLayout(branches)
        setLayoutNodes(nodes)
        
        // Find current commit (HEAD)
        const head = await window.API.git.run(`rev-parse HEAD`)
        const headCommit = commits.find(c =>
          c.hash = head.trim()
        )

        if (headCommit) setCurrentCommit(headCommit.hash)
        
        console.log('DAG layout created:', nodes)
        console.log('Current HEAD:', headCommit?.hash)
      } catch (err) {
        console.error('Error building DAG:', err)
      } finally {
        setLoading(false)
      }
    }

    buildDAG()
  }, [])

  const handleCheckoutBranch = async (branchName: string) => {
    setCheckingOutBranch(branchName)
    try {
      await window.API.git.run(`checkout ${branchName}`)
      console.log(`Checked out to ${branchName}`)
      
      // Rebuild DAG
      const commits = await fetchCommitsForDAG()
      const branches = extractBranches(commits)
      const layout = new DAGLayout(commits)
      const nodes = layout.getLayout(branches)
      setLayoutNodes(nodes)
      
      const headCommit = commits.find(c => 
        c.refs.some(r => r.includes('HEAD'))
      )
      if (headCommit) setCurrentCommit(headCommit.hash)
      
      // Refetch git data to update character state
      await refetchGit()
    } catch (err) {
      console.error(`Error checking out ${branchName}:`, err)
      alert(`Failed to checkout ${branchName}: ${err}`)
    } finally {
      setCheckingOutBranch(null)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full">Building DAG...</div>

  const LANE_WIDTH = 80
  const ROW_HEIGHT = 60
  const maxLane = Math.max(...layoutNodes.map((n) => n.lane), 0)
  const maxY = Math.max(...layoutNodes.map((n) => n.y), 0)
  const contentWidth = (maxLane + 1) * LANE_WIDTH + 100
  const contentHeight = maxY + ROW_HEIGHT + 100
  
  // Whitespace margins
  const marginTop = 150
  const marginBottom = 50
  const marginLeft = 100
  const marginRight = 50
  
  const width = contentWidth + marginLeft + marginRight
  const height = contentHeight + marginTop + marginBottom
  
  // Hover handlers with delay
  const handleMouseEnter = (nodeHash: string) => {
    if (hoverTimeoutRef) clearTimeout(hoverTimeoutRef)
    setHoveredNode(nodeHash)
  }
  
  const handleMouseLeave = () => {
    // Delay hiding the tooltip by 300ms
    const timeout = setTimeout(() => {
      setHoveredNode(null)
    }, 600)
    // Store timeout reference (though we can't update the ref properly in useState)
  }
  
  return (
    <div className="h-full w-full overflow-auto bg-gray-50 relative pl-8">
      {/* LittleMan positioned above current HEAD */}
      {currentCommit && layoutNodes.length > 0 && (() => {
        const currentNode = layoutNodes.find(n => n.hash === currentCommit)
        if (currentNode) {
          // Shifted more to the left, positioned slightly above node
          const leftOffset = currentNode.lane === 0 ? currentNode.x - 40 : currentNode.x - 40
          return (
            <div style={{ position: 'absolute', left: `${leftOffset + marginLeft + 32 - 20}px`, top: `${currentNode.y + marginTop + 30 - 10}px`, zIndex: 50 }}>
              <LittleMan characterState={characterState as any} />
            </div>
          )
        }
        return null
      })()}       <svg
        width={width}
        height={height}
        viewBox={`${-marginLeft} ${-marginTop} ${width} ${height}`}
        preserveAspectRatio="xMinYMin meet"
        className="bg-white block relative"
        style={{ zIndex: 10 }}
      >
        {/* Draw commit connections */}
        {layoutNodes.map((node) =>
          node.parents.map((parentHash) => {
            const parent = layoutNodes.find((n) => n.hash === parentHash)
            if (!parent) return null

            const isCrossLane = parent.lane !== node.lane
            const isMerge = node.parents.length > 1
            const isBranch = parent.children.length > 1

            // For merges: use the child node's color (branch color) for the merge line
            // For branch creation: also use child node's color
            // This ensures the merge line keeps the branch's distinct color
            const strokeColor = node.color

            // Use curved path for branch creation or merge (cross-lane)
            if (isCrossLane && (isMerge || isBranch)) {
              const x1 = parent.x + 40
              const y1 = parent.y + 40
              const x2 = node.x + 40
              const y2 = node.y + 40
              const midY = (y1 + y2) / 2

              const path = `M ${x1},${y1} L ${x1},${midY} Q ${x1},${midY} ${(x1 + x2) / 2},${midY} Q ${x2},${midY} ${x2},${midY} L ${x2},${y2}`

              return (
                <path
                  key={`${node.hash}-${parentHash}`}
                  d={path}
                  stroke={strokeColor}
                  strokeWidth="2"
                  fill="none"
                  opacity="0.7"
                />
              )
            }

            // Regular parent-child connection (straight line)
            return (
              <line
                key={`${node.hash}-${parentHash}`}
                x1={parent.x + 40}
                y1={parent.y + 40}
                x2={node.x + 40}
                y2={node.y + 40}
                stroke={strokeColor}
                strokeWidth="2"
                opacity="0.6"
              />
            )
          })
        )}

        {/* Draw commits */}
        {layoutNodes.map((node) => {
          const isCurrentNode = node.hash === currentCommit
          const isHovered = hoveredNode === node.hash
          
          // Check if this node is a branch tip (has refs but no children, or refs with branch names)
          const branchNames = node.refs.filter(r => !r.includes('HEAD') && !r.includes('tag:'))
          const isBranchTip = branchNames.length > 0 && node.children.length === 0
          const isInteractive = isCurrentNode || isBranchTip
          
          return (
          <g 
            key={node.hash}
            onMouseEnter={() => isInteractive && handleMouseEnter(node.hash)}
            onMouseLeave={() => isInteractive && handleMouseLeave()}
            style={{ cursor: isInteractive ? 'pointer' : 'default' }}
          >
            {/* Commit circle */}
            <circle
              cx={node.x + 40}
              cy={node.y + 40}
              r={isInteractive && isHovered ? 8 : 6}
              fill={node.color}
              stroke={isCurrentNode ? '#FFD700' : (isBranchTip ? '#4CAF50' : 'white')}
              strokeWidth={isInteractive ? 3 : 2}
            />

            {/* Commit hash and message */}
            <text
              x={node.x + 60}
              y={node.y + 35}
              fontSize="12"
              fill="#333"
              fontFamily="monospace"
            >
              {node.hash.slice(0, 7)}
            </text>
            <text
              x={node.x + 60}
              y={node.y + 50}
              fontSize="11"
              fill="#666"
              fontFamily="sans-serif"
            >
              {node.message.slice(0, 40)}
            </text>
            
            {/* Hover tooltip for current node */}
            {isCurrentNode && isHovered && (
              <g 
                style={{ zIndex: 100 }}
                onMouseEnter={() => handleMouseEnter(node.hash)}
                onMouseLeave={handleMouseLeave}
              >
                <rect
                  x={node.x + 50}
                  y={node.y - 60}
                  width="300"
                  height="100"
                  fill="white"
                  stroke={node.color}
                  strokeWidth="2"
                  rx="8"
                  opacity="0.95"
                  style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))', cursor: 'pointer' }}
                />
                <text
                  x={node.x + 60}
                  y={node.y - 40}
                  fontSize="11"
                  fill="#333"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  Current HEAD: {node.hash.slice(0, 10)}
                </text>
                <text
                  x={node.x + 60}
                  y={node.y - 25}
                  fontSize="10"
                  fill="#666"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  Branch: {node.refs.filter(r => !r.includes('HEAD')).join(', ') || 'detached'}
                </text>
                <text
                  x={node.x + 60}
                  y={node.y - 10}
                  fontSize="10"
                  fill="#666"
                  fontFamily="sans-serif"
                >
                  {node.message}
                </text>
                <text
                  x={node.x + 60}
                  y={node.y + 10}
                  fontSize="10"
                  fill="#0066cc"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  style={{ textDecoration: 'underline' }}
                >
                  ▶ Click for more actions
                </text>
              </g>
            )}
            
            {/* Hover tooltip for branch tips */}
            {isBranchTip && !isCurrentNode && isHovered && (
              <g 
                style={{ zIndex: 100 }}
                onMouseEnter={() => handleMouseEnter(node.hash)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleCheckoutBranch(branchNames[0])}
              >
                <rect
                  x={node.x + 50}
                  y={node.y - 60}
                  width="300"
                  height="100"
                  fill="white"
                  stroke={checkingOutBranch === branchNames[0] ? '#FF9800' : '#4CAF50'}
                  strokeWidth={checkingOutBranch === branchNames[0] ? 3 : 2}
                  rx="8"
                  opacity="0.95"
                  style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))', cursor: 'pointer' }}
                />
                <text
                  x={node.x + 60}
                  y={node.y - 40}
                  fontSize="11"
                  fill="#333"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  Branch Tip: {node.hash.slice(0, 10)}
                </text>
                <text
                  x={node.x + 60}
                  y={node.y - 25}
                  fontSize="10"
                  fill="#666"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  Branch: {branchNames.join(', ')}
                </text>
                <text
                  x={node.x + 60}
                  y={node.y - 10}
                  fontSize="10"
                  fill="#666"
                  fontFamily="sans-serif"
                >
                  {node.message}
                </text>
                <text
                  x={node.x + 60}
                  y={node.y + 10}
                  fontSize="10"
                  fill={checkingOutBranch === branchNames[0] ? '#FF9800' : '#4CAF50'}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  style={{ textDecoration: 'underline' }}
                >
                  {checkingOutBranch === branchNames[0] ? '⟳ Checking out...' : '▶ Click to switch to this branch'}
                </text>
              </g>
            )}
          </g>
        )}
        )}
      </svg>
    </div>
  )
}

function extractBranches(commits: Commit[]): Map<string, string> {
  const branches = new Map<string, string>()
  commits.forEach((commit) => {
    commit.refs.forEach((ref) => {
      if (ref.includes('HEAD') || ref.includes('main') || ref.includes('master')) {
        branches.set(ref, commit.hash)
      }
    })
  })
  return branches
}