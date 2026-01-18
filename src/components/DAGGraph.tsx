// src/components/DAGGraph.tsx
import { useEffect, useState, useCallback } from 'react'
import { DAGLayout, LayoutNode, Commit } from '../services/dagLayout'
import { fetchCommitsForDAG } from '../services/gitCommitParser'
import { useGit } from '../context/GitContext'

export function DAGGraph() {
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [currentCommit, setCurrentCommit] = useState<string | null>(null)
  const [checkingOutBranch, setCheckingOutBranch] = useState<string | null>(null)
  const [committingNode, setCommittingNode] = useState<string | null>(null)
  const [pullingNode, setPullingNode] = useState<string | null>(null)
  const [pushingNode, setPushingNode] = useState<string | null>(null)

  const { refetchGit } = useGit()

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
        const headCommit = commits.find(c =>
          c.refs.some(r => r.includes('HEAD'))
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
  }, [refetchGit])

  const handleCheckoutBranch = async (branchName: string) => {
    setCheckingOutBranch(branchName)
    try {
      // Note: this still uses your API call for checkout (keeps existing behavior)
      await window.API.git.run(`checkout ${branchName}`)
      console.log(`Checked out to ${branchName}`)
      // Refetch git data to update the DAG
      await refetchGit()
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
    } catch (err) {
      console.error(`Error checking out ${branchName}:`, err)
      alert(`Failed to checkout ${branchName}: ${err}`)
    } finally {
      setCheckingOutBranch(null)
    }
  }

  // Placeholder action handlers — currently only toggle local state & log.
  // Swap the console.log / setTimeout with actual API calls later.
  const handleCommitClick = useCallback((nodeHash: string) => {
    console.log('Commit placeholder for', nodeHash)
    setCommittingNode(nodeHash)
    // Example placeholder feedback; remove or replace with real API call.
    setTimeout(() => setCommittingNode(null), 1200)
  }, [])

  const handlePullClick = useCallback((nodeHash: string) => {
    console.log('Pull placeholder for', nodeHash)
    setPullingNode(nodeHash)
    setTimeout(() => setPullingNode(null), 1000)
  }, [])

  const handlePushClick = useCallback((nodeHash: string) => {
    console.log('Push placeholder for', nodeHash)
    setPushingNode(nodeHash)
    setTimeout(() => setPushingNode(null), 1000)
  }, [])

  if (loading) return <div className="flex items-center justify-center h-full">Building DAG...</div>

  const LANE_WIDTH = 80
  const ROW_HEIGHT = 60
  const maxLane = Math.max(...layoutNodes.map((n) => n.lane), 0)
  const maxY = Math.max(...layoutNodes.map((n) => n.y), 0)
  const width = (maxLane + 1) * LANE_WIDTH + 100
  const height = maxY + ROW_HEIGHT + 140

  return (
    <div className="h-full w-full overflow-auto bg-gray-50">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMin meet"
        className="bg-white block"
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

          // For cleaner tooltip positioning
          const tooltipX = node.x + 50
          const tooltipY = node.y - 60
          const tooltipWidth = 320
          const tooltipHeight = 140
          const buttonWidth = 80
          const buttonHeight = 24
          const buttonGap = 12

          return (
            <g
              key={node.hash}
              onMouseEnter={() => isInteractive && setHoveredNode(node.hash)}
              onMouseLeave={() => isInteractive && setHoveredNode(null)}
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
                <g style={{ cursor: 'pointer' }}>
                  <rect
                    x={tooltipX}
                    y={tooltipY}
                    width={tooltipWidth}
                    height={tooltipHeight}
                    fill="white"
                    stroke={node.color}
                    strokeWidth="2"
                    rx="8"
                    opacity="0.98"
                  />
                  <text
                    x={tooltipX + 10}
                    y={tooltipY + 20}
                    fontSize="11"
                    fill="#333"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Current HEAD: {node.hash.slice(0, 10)}
                  </text>
                  <text
                    x={tooltipX + 10}
                    y={tooltipY + 38}
                    fontSize="10"
                    fill="#666"
                    fontWeight="600"
                    fontFamily="sans-serif"
                  >
                    Branch: {node.refs.filter(r => !r.includes('HEAD')).join(', ') || 'detached'}
                  </text>
                  <text
                    x={tooltipX + 10}
                    y={tooltipY + 55}
                    fontSize="10"
                    fill="#666"
                    fontFamily="sans-serif"
                  >
                    {node.message}
                  </text>

                  {/* Action hint line */}
                  <text
                    x={tooltipX + 10}
                    y={tooltipY + 73}
                    fontSize="10"
                    fill="#0066cc"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    style={{ textDecoration: 'underline' }}
                  >
                    ▶ More actions
                  </text>

                  {/* Buttons row (Commit, Pull, Push) */}
                  <g transform={`translate(${tooltipX + 10}, ${tooltipY + 80})`}>
                    {/* Commit */}
                    <g
                      onClick={() => handleCommitClick(node.hash)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={0}
                        y={0}
                        width={buttonWidth}
                        height={buttonHeight}
                        rx="6"
                        fill="#ffffff"
                        stroke={node.color}
                        strokeWidth="1.5"
                      />
                      <text
                        x={buttonWidth / 2}
                        y={buttonHeight / 2 + 4}
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        fill="#333"
                      >
                        {committingNode === node.hash ? '⟳ Committing...' : 'Commit'}
                      </text>
                    </g>

                    {/* Pull */}
                    <g
                      onClick={() => handlePullClick(node.hash)}
                      transform={`translate(${buttonWidth + buttonGap}, 0)`}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={0}
                        y={0}
                        width={buttonWidth}
                        height={buttonHeight}
                        rx="6"
                        fill="#ffffff"
                        stroke="#1E88E5"
                        strokeWidth="1.2"
                      />
                      <text
                        x={buttonWidth / 2}
                        y={buttonHeight / 2 + 4}
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        fill="#1E88E5"
                      >
                        {pullingNode === node.hash ? '⟳ Pulling...' : 'Pull'}
                      </text>
                    </g>

                    {/* Push */}
                    <g
                      onClick={() => handlePushClick(node.hash)}
                      transform={`translate(${(buttonWidth + buttonGap) * 2}, 0)`}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={0}
                        y={0}
                        width={buttonWidth}
                        height={buttonHeight}
                        rx="6"
                        fill="#ffffff"
                        stroke="#43A047"
                        strokeWidth="1.2"
                      />
                      <text
                        x={buttonWidth / 2}
                        y={buttonHeight / 2 + 4}
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        fill="#43A047"
                      >
                        {pushingNode === node.hash ? '⟳ Pushing...' : 'Push'}
                      </text>
                    </g>
                  </g>
                </g>
              )}

              {/* Hover tooltip for branch tips */}
              {isBranchTip && !isCurrentNode && isHovered && (
                <g
                  style={{ cursor: 'pointer' }}
                  onClick={() => {/* onClick already assigned to checkout button below — keep empty to avoid accidental parent click */}}
                >
                  <rect
                    x={tooltipX}
                    y={tooltipY}
                    width={tooltipWidth}
                    height={tooltipHeight}
                    fill="white"
                    stroke={checkingOutBranch === branchNames[0] ? '#FF9800' : '#4CAF50'}
                    strokeWidth={checkingOutBranch === branchNames[0] ? 3 : 2}
                    rx="8"
                    opacity="0.98"
                  />
                  <text
                    x={tooltipX + 10}
                    y={tooltipY + 20}
                    fontSize="11"
                    fill="#333"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Branch Tip: {node.hash.slice(0, 10)}
                  </text>
                  <text
                    x={tooltipX + 10}
                    y={tooltipY + 38}
                    fontSize="10"
                    fill="#666"
                    fontWeight="600"
                    fontFamily="sans-serif"
                  >
                    Branch: {branchNames.join(', ')}
                  </text>
                  <text
                    x={tooltipX + 10}
                    y={tooltipY + 55}
                    fontSize="10"
                    fill="#666"
                    fontFamily="sans-serif"
                  >
                    {node.message}
                  </text>

                  {/* Checkout action (big) */}
                  <g
                    onClick={() => handleCheckoutBranch(branchNames[0])}
                    transform={`translate(${tooltipX + 10}, ${tooltipY + 70})`}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={0}
                      y={0}
                      width={tooltipWidth - 20}
                      height={28}
                      rx="8"
                      fill={checkingOutBranch === branchNames[0] ? '#FFF8E1' : '#FFFFFF'}
                      stroke={checkingOutBranch === branchNames[0] ? '#FF9800' : '#4CAF50'}
                      strokeWidth={checkingOutBranch === branchNames[0] ? 2.5 : 1.8}
                    />
                    <text
                      x={(tooltipWidth - 20) / 2}
                      y={18}
                      fontSize="12"
                      fontWeight="700"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                      fill={checkingOutBranch === branchNames[0] ? '#FF9800' : '#4CAF50'}
                    >
                      {checkingOutBranch === branchNames[0] ? '⟳ Checking out...' : '▶ Click to switch to this branch'}
                    </text>
                  </g>

                  {/* Small action buttons row (Commit, Pull, Push) under the checkout button */}
                  <g transform={`translate(${tooltipX + 10}, ${tooltipY + 104})`}>
                    <g
                      onClick={() => handleCommitClick(node.hash)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={0}
                        y={0}
                        width={buttonWidth}
                        height={buttonHeight}
                        rx="6"
                        fill="#ffffff"
                        stroke={node.color}
                        strokeWidth="1.5"
                      />
                      <text
                        x={buttonWidth / 2}
                        y={buttonHeight / 2 + 4}
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        fill="#333"
                      >
                        {committingNode === node.hash ? '⟳ Committing...' : 'Commit'}
                      </text>
                    </g>

                    <g
                      onClick={() => handlePullClick(node.hash)}
                      transform={`translate(${buttonWidth + buttonGap}, 0)`}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={0}
                        y={0}
                        width={buttonWidth}
                        height={buttonHeight}
                        rx="6"
                        fill="#ffffff"
                        stroke="#1E88E5"
                        strokeWidth="1.2"
                      />
                      <text
                        x={buttonWidth / 2}
                        y={buttonHeight / 2 + 4}
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        fill="#1E88E5"
                      >
                        {pullingNode === node.hash ? '⟳ Pulling...' : 'Pull'}
                      </text>
                    </g>

                    <g
                      onClick={() => handlePushClick(node.hash)}
                      transform={`translate(${(buttonWidth + buttonGap) * 2}, 0)`}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={0}
                        y={0}
                        width={buttonWidth}
                        height={buttonHeight}
                        rx="6"
                        fill="#ffffff"
                        stroke="#43A047"
                        strokeWidth="1.2"
                      />
                      <text
                        x={buttonWidth / 2}
                        y={buttonHeight / 2 + 4}
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        fill="#43A047"
                      >
                        {pushingNode === node.hash ? '⟳ Pushing...' : 'Push'}
                      </text>
                    </g>
                  </g>
                </g>
              )}
            </g>
          )
        })}
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
