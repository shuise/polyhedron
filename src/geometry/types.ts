export type GoldbergVariant = 'standard' | 'truncated' | 'geodesic';

export interface GoldbergParams {
  m: number;
  n: number;
  radius: number;
  variant: GoldbergVariant;
}

export interface Face {
  indices: number[];
}

export interface GeometryData {
  positions: Float32Array;
  indices: Uint16Array | Uint32Array;
  /** Edge line segments (pairs of vertex indices), each edge appears once */
  edges: Uint16Array | Uint32Array;
  /** Number of pentagon faces (for display) */
  pentagonCount: number;
  /** Number of hexagon faces (for display) */
  hexagonCount: number;
  /** Total face count */
  faceCount: number;
  /** Vertex count */
  vertexCount: number;
}
