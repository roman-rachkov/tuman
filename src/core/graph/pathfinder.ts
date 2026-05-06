import { GraphNode, GraphEdge } from './types';

function heuristic(a: GraphNode, b: GraphNode): number {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;
  return Math.sqrt(dx * dx + dy * dy) * 111000;
}

export function findPath(
  nodes: Record<string, GraphNode>,
  edges: GraphEdge[],
  startId: string,
  endId: string,
  filter?: (edge: GraphEdge) => boolean
): string[] {
  const openSet = new Set<string>([startId]);
  const cameFrom: Record<string, string> = {};
  const gScore: Record<string, number> = { [startId]: 0 };
  const fScore: Record<string, number> = { [startId]: heuristic(nodes[startId], nodes[endId]) };

  const adjacency: Record<string, Array<{ nodeId: string; edge: GraphEdge }>> = {};
  for (const edge of edges) {
    if (filter && !filter(edge)) continue;
    if (!adjacency[edge.from]) adjacency[edge.from] = [];
    if (!adjacency[edge.to]) adjacency[edge.to] = [];
    adjacency[edge.from].push({ nodeId: edge.to, edge });
    adjacency[edge.to].push({ nodeId: edge.from, edge });
  }

  while (openSet.size > 0) {
    let current = '';
    let minF = Infinity;
    for (const id of openSet) {
      const f = fScore[id] ?? Infinity;
      if (f < minF) { minF = f; current = id; }
    }

    if (current === endId) {
      const path: string[] = [];
      let c = current;
      while (c) { path.unshift(c); c = cameFrom[c]; }
      return path;
    }

    openSet.delete(current);
    for (const { nodeId, edge } of (adjacency[current] || [])) {
      const speed = edge.state === 1 ? edge.baseSpeed * 0.5 : edge.baseSpeed;
      const cost = edge.length / speed;
      const tentative = (gScore[current] ?? Infinity) + cost;
      if (tentative < (gScore[nodeId] ?? Infinity)) {
        cameFrom[nodeId] = current;
        gScore[nodeId] = tentative;
        fScore[nodeId] = tentative + heuristic(nodes[nodeId], nodes[endId]);
        openSet.add(nodeId);
      }
    }
  }

  return [];
}
