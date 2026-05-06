import { Node } from './Node';
import { Edge } from './Edge';

export class Graph {
  private nodes: Map<string, Node> = new Map();
  private edges: Map<string, Edge> = new Map();
  private adjacency: Map<string, string[]> = new Map();

  loadFromJSON(data: any): void {
    if (data.nodes) {
      for (const node of data.nodes) {
        this.nodes.set(node.id, node);
        this.adjacency.set(node.id, []);
      }
    }
    if (data.edges) {
      for (const edge of data.edges) {
        this.edges.set(edge.id, edge);
        const adj = this.adjacency.get(edge.from) || [];
        adj.push(edge.to);
        this.adjacency.set(edge.from, adj);
      }
    }
  }

  getShortestPath(start: string, end: string, filter?: (edge: Edge) => boolean): string[] {
    // Simple BFS for now, A* will be implemented later
    if (!this.nodes.has(start) || !this.nodes.has(end)) {
      return [];
    }
    
    const queue: string[] = [start];
    const visited = new Set<string>([start]);
    const parent = new Map<string, string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === end) {
        const path: string[] = [];
        let node: string | undefined = end;
        while (node) {
          path.unshift(node);
          node = parent.get(node);
        }
        return path;
      }

      const neighbors = this.adjacency.get(current) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          const edge = Array.from(this.edges.values()).find(
            e => e.from === current && e.to === neighbor
          );
          if (!filter || (edge && filter(edge))) {
            visited.add(neighbor);
            parent.set(neighbor, current);
            queue.push(neighbor);
          }
        }
      }
    }

    return [];
  }

  updateEdgeState(edgeId: string, newState: number): void {
    const edge = this.edges.get(edgeId);
    if (edge) {
      edge.state = newState as 0 | 1 | 2 | 3;
      this.edges.set(edgeId, edge);
    }
  }

  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): Edge | undefined {
    return this.edges.get(id);
  }

  getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): Edge[] {
    return Array.from(this.edges.values());
  }
}
