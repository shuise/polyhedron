/**
 * Regular icosahedron base geometry.
 * 12 vertices, 20 triangular faces.
 */

const PHI = (1 + Math.sqrt(5)) / 2;

// 12 vertices of a regular icosahedron on unit sphere
export const ICOSAHEDRON_VERTICES: [number, number, number][] = [
  [-1,  PHI,  0], // 0
  [ 1,  PHI,  0], // 1
  [-1, -PHI,  0], // 2
  [ 1, -PHI,  0], // 3
  [ 0, -1,  PHI], // 4
  [ 0,  1,  PHI], // 5
  [ 0, -1, -PHI], // 6
  [ 0,  1, -PHI], // 7
  [ PHI,  0, -1], // 8
  [ PHI,  0,  1], // 9
  [-PHI,  0, -1], // 10
  [-PHI,  0,  1], // 11
];

// 20 triangular faces (vertex indices, counter-clockwise outward)
export const ICOSAHEDRON_FACES: [number, number, number][] = [
  [0, 11, 5],  [0, 5, 1],   [0, 1, 7],   [0, 7, 10],  [0, 10, 11],
  [1, 5, 9],   [5, 11, 4],  [11, 10, 2], [10, 7, 6],  [7, 1, 8],
  [3, 9, 4],   [3, 4, 2],   [3, 2, 6],   [3, 6, 8],   [3, 8, 9],
  [4, 9, 5],   [2, 4, 11],  [6, 2, 10],  [8, 6, 7],   [9, 8, 1],
];

/** Normalize a 3D vector to unit length */
export function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

/** Get icosahedron vertices normalized to unit sphere */
export function getIcosahedronVertices(): [number, number, number][] {
  return ICOSAHEDRON_VERTICES.map(v => normalize(v));
}
