export interface GraphNode {
  id: string;
  lat: number;
  lng: number;
  tags?: Record<string, string>;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  length: number;
  baseSpeed: number;
  state: 0 | 1 | 2 | 3;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
