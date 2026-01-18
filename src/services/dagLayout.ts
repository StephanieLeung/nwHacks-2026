export interface Commit {
  hash: string
  parents: string[]
  refs: string[]
  message: string
}

export interface CommitNode {
  hash: string
  parents: string[]
  children: string[]
  message: string
  refs: string[]
}

export interface LayoutNode extends CommitNode {
  lane: number
  order: number
  x: number
  y: number
  color: string
}

const LANE_WIDTH = 80
const ROW_HEIGHT = 60

export class DAGLayout {
  private nodes: Map<string, CommitNode> = new Map()
  private sorted: string[] = []
  private lanes: Map<string, number> = new Map()
  private branchLane: Map<string, number> = new Map()
  private activeLanes: number[] = []
  private freeLanes: number[] = []

  constructor(commits: Commit[]) {
    this.buildDAG(commits)
    this.topologicalSort()
    this.assignLanes()
  }

  private buildDAG(commits: Commit[]) {
    // Build nodes with children map
    commits.forEach((commit) => {
      this.nodes.set(commit.hash, {
        hash: commit.hash,
        parents: commit.parents,
        children: [],
        message: commit.message,
        refs: commit.refs,
      })
    })

    // Link children to parents
    commits.forEach((commit) => {
      commit.parents.forEach((parent) => {
        const parentNode = this.nodes.get(parent)
        if (parentNode) {
          parentNode.children.push(commit.hash)
        }
      })
    })
  }

  private topologicalSort() {
    // Sort by date-order (parents before children)
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (hash: string) => {
      if (visited.has(hash)) return
      if (visiting.has(hash)) return // Cycle detection

      visiting.add(hash)
      const node = this.nodes.get(hash)
      if (node) {
        node.parents.forEach((parent) => visit(parent))
      }
      visiting.delete(hash)
      visited.add(hash)
      this.sorted.push(hash)
    }

    this.nodes.forEach((_, hash) => visit(hash))
    // Do not reverse; 'visit' pushes a node after visiting parents,
    // so 'sorted' already has parents before children, matching date-order.
  }

  private assignLanes() {
    const laneMap = new Map<string, number>()
    let nextLaneId = 0

    this.sorted.forEach((hash) => {
      const node = this.nodes.get(hash)!
      let lane: number

      // Normalize branch names from refs decorations
      const branchNames = this.normalizeRefs(node.refs)

      // Pin main/master to lane 0
      if (branchNames.includes('main') || branchNames.includes('master')) {
        lane = 0
        this.branchLane.set('main', 0)
        this.branchLane.set('master', 0)
      } else if (branchNames.length > 0) {
        // Use existing lane for this branch if present, else allocate new lane
        const b = branchNames[0]
        if (this.branchLane.has(b)) {
          lane = this.branchLane.get(b)!
        } else {
          lane = nextLaneId === 0 ? 1 : nextLaneId
          this.branchLane.set(b, lane)
          nextLaneId = Math.max(nextLaneId + 1, lane + 1)
        }
      } else if (node.parents.length === 1) {
        // No branch decoration: continue parent's lane
        lane = laneMap.get(node.parents[0]) ?? (nextLaneId === 0 ? 1 : nextLaneId++)
      } else if (node.parents.length > 1) {
        // Merge commit: stick to first parent's lane
        lane = laneMap.get(node.parents[0]) ?? (nextLaneId === 0 ? 1 : nextLaneId++)
      } else {
        // Orphan/root without refs: allocate new lane (not 0 to keep main/master at 0)
        lane = nextLaneId === 0 ? 1 : nextLaneId++
      }

      laneMap.set(hash, lane)
      this.lanes.set(hash, lane)
    })
  }

  getLayout(branches: Map<string, string>): LayoutNode[] {
    const colorsByLane = this.assignLaneColors()

    const total = this.sorted.length
    return this.sorted.map((hash, order) => {
      const node = this.nodes.get(hash)!
      const lane = this.lanes.get(hash) || 0

      return {
        ...node,
        lane,
        order,
        x: lane * LANE_WIDTH,
        // Flip vertical direction: newest at top, oldest at bottom
        y: (total - 1 - order) * ROW_HEIGHT,
        color: colorsByLane.get(lane) || '#999',
      }
    })
  }

  private assignLaneColors(): Map<number, string> {
    const colorsByLane = new Map<number, string>()
    const palette: string[] = [
      '#3b82f6', // blue
      '#ec4899', // pink
      '#10b981', // green
      '#a855f7', // purple
      '#f59e0b', // amber
      '#f97316', // orange
      '#22c55e', // emerald
      '#64748b', // slate
    ]

    // Reserve lane 0 (main/master) color
    colorsByLane.set(0, '#000000')

    const used = new Set<string>(['#000000'])
    let idx = 0

    // Collect all lanes present, excluding 0
    const lanes = Array.from(new Set(Array.from(this.lanes.values()))).sort((a, b) => a - b)
    lanes.forEach((lane) => {
      if (lane === 0) return
      // Pick first unused color; if exhausted, cycle
      let color = palette[idx % palette.length]
      // Find next free color
      let attempts = 0
      while (used.has(color) && attempts < palette.length) {
        idx++
        color = palette[idx % palette.length]
        attempts++
      }
      colorsByLane.set(lane, color)
      used.add(color)
      idx++
    })

    return colorsByLane
  }

  private normalizeRefs(refs: string[]): string[] {
    const names: string[] = []
    refs.forEach((r) => {
      // Examples: "HEAD -> main", "origin/main", "tag: v1.0"
      const parts = r.split(/[:,\-\>\s]+/).map((p) => p.trim()).filter(Boolean)
      parts.forEach((p) => {
        if (p === 'HEAD' || p === 'tag' || p === 'origin') return
        // Only branch names
        names.push(p.replace('remotes/', '').replace('origin/', ''))
      })
    })
    return Array.from(new Set(names))
  }
}