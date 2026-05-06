export interface Node {
  id: string;
  lat: number;
  lng: number;
  tags?: Record<string, string>;
}
