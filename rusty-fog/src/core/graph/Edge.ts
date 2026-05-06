export interface Edge {
  id: string;
  from: string;
  to: string;
  length: number;        // метры
  baseSpeed: number;     // м/с
  state: 0 | 1 | 2 | 3;  // intact/damaged/blocked/requires_protection
}
