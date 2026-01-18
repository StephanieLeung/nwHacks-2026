import { useEffect, useState } from 'react'
import { DAGLayout, LayoutNode, Commit } from '../services/dagLayout'
import { fetchCommitsForDAG } from '../services/gitCommitParser'

export function DAGGraph() {
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function buildDAG() {
      setLoading(true)
      try {
        const commits = await fetchCommitsForDAG()
        const branches = extractBranches(commits)
        const layout = new DAGLayout(commits)
        const nodes = layout.getLayout(branches)
        setLayoutNodes(nodes)
        console.log('DAG layout created:', nodes)
      } catch (err) {
        console.error('Error building DAG:', err)
      } finally {
        setLoading(false)
      }
    }

    buildDAG()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-full">Building DAG...</div>

  const LANE_WIDTH = 80
  const ROW_HEIGHT = 60
  const maxLane = Math.max(...layoutNodes.map((n) => n.lane), 0)
  const maxY = Math.max(...layoutNodes.map((n) => n.y), 0)
  const width = (maxLane + 1) * LANE_WIDTH + 100
  const height = maxY + ROW_HEIGHT + 100

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

            return (
              <line
                key={`${node.hash}-${parentHash}`}
                x1={parent.x + 40}
                y1={parent.y + 40}
                x2={node.x + 40}
                y2={node.y + 40}
                stroke={node.color}
                strokeWidth="2"
                opacity="0.6"
              />
            )
          })
        )}

        {/* Draw commits */}
        {layoutNodes.map((node) => (
          <g key={node.hash}>
            {/* Commit circle */}
            <circle
              cx={node.x + 40}
              cy={node.y + 40}
              r="6"
              fill={node.color}
              stroke="white"
              strokeWidth="2"
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
          </g>
        ))}
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