/**
 * Goldberg polyhedron geometry generator.
 *
 * Algorithm:
 * 1. Start with regular icosahedron (12 vertices, 20 triangular faces)
 * 2. Subdivide each triangle by (m, n) parameters using barycentric coordinates
 * 3. Project all vertices onto unit sphere
 * 4. Build dual: original vertices → pentagons, triangle centers → hexagons
 */

import { ICOSAHEDRON_VERTICES, ICOSAHEDRON_FACES, normalize } from './icosahedron';
import type { GeometryData, GoldbergParams } from './types';

type Vec3 = [number, number, number];

/** Barycentric subdivision point on a triangle, projected to sphere */
function barycentricPoint(
  a: Vec3, b: Vec3, c: Vec3,
  i: number, j: number, k: number,
  total: number
): Vec3 {
  const t = 1 / total;
  return normalize([
    (a[0] * i + b[0] * j + c[0] * k) * t,
    (a[1] * i + b[1] * j + c[1] * k) * t,
    (a[2] * i + b[2] * j + c[2] * k) * t,
  ]);
}

interface SubdividedMesh {
  vertices: Vec3[];
  faceTris: number[][];
  origVertexMap: Map<number, number>;
  faceCenterMap: Map<number, number>;
}

/**
 * Build a full subdivision of the icosahedron by (m, n).
 */
function buildSubdivision(m: number, n: number): SubdividedMesh {
  const total = m + n;
  if (total === 0) throw new Error('m + n must be > 0');

  const vertexKey = (v: Vec3): string => v.map(x => x.toFixed(12)).join(',');
  const vertexMap = new Map<string, number>();
  const vertices: Vec3[] = [];
  const origVertexMap = new Map<number, number>();
  const faceCenterMap = new Map<number, number>();
  const faceTris: number[][] = [];

  const getOrCreate = (v: Vec3): number => {
    const key = vertexKey(v);
    const existing = vertexMap.get(key);
    if (existing !== undefined) return existing;
    const idx = vertices.length;
    vertices.push(v);
    vertexMap.set(key, idx);
    return idx;
  };

  for (let i = 0; i < ICOSAHEDRON_VERTICES.length; i++) {
    const v = normalize(ICOSAHEDRON_VERTICES[i]!);
    origVertexMap.set(i, getOrCreate(v));
  }

  for (let fi = 0; fi < ICOSAHEDRON_FACES.length; fi++) {
    const [ia, ib, ic] = ICOSAHEDRON_FACES[fi]!;
    const a = normalize(ICOSAHEDRON_VERTICES[ia]!);
    const b = normalize(ICOSAHEDRON_VERTICES[ib]!);
    const c = normalize(ICOSAHEDRON_VERTICES[ic]!);

    const faceIndices: number[] = [];
    for (let i = 0; i <= total; i++) {
      for (let j = 0; j <= total - i; j++) {
        const k = total - i - j;
        faceIndices.push(getOrCreate(barycentricPoint(a, b, c, i, j, k, total)));
      }
    }

    // Face center (for dual)
    const center = (total % 3 === 0 && m === n)
      ? barycentricPoint(a, b, c, total / 3, total / 3, total / 3, total)
      : normalize([
          (a[0] + b[0] + c[0]) / 3,
          (a[1] + b[1] + c[1]) / 3,
          (a[2] + b[2] + c[2]) / 3,
        ]);
    faceCenterMap.set(fi, getOrCreate(center));

    // Generate sub-triangles for the grid
    let rowStart = 0;
    for (let row = 0; row < total; row++) {
      const rowLen = total - row + 1;
      const nextRowStart = rowStart + rowLen;
      for (let col = 0; col < rowLen - 1; col++) {
        faceTris.push([
          faceIndices[rowStart + col]!,
          faceIndices[rowStart + col + 1]!,
          faceIndices[nextRowStart + col]!,
        ]);
        if (col < rowLen - 2) {
          faceTris.push([
            faceIndices[rowStart + col + 1]!,
            faceIndices[nextRowStart + col + 1]!,
            faceIndices[nextRowStart + col]!,
          ]);
        }
      }
      rowStart = nextRowStart;
    }
  }

  return { vertices, faceTris, origVertexMap, faceCenterMap };
}

/**
 * Build the dual of the subdivided mesh.
 * Returns both triangulated mesh and polygon edges for clean line rendering.
 */
function buildDual(mesh: SubdividedMesh) {
  const { vertices, faceCenterMap } = mesh;

  const edgeToFaces = new Map<string, number[]>();
  for (let fi = 0; fi < ICOSAHEDRON_FACES.length; fi++) {
    const [a, b, c] = ICOSAHEDRON_FACES[fi]!;
    for (const [e1, e2] of [[Math.min(a, b), Math.max(a, b)], [Math.min(b, c), Math.max(b, c)], [Math.min(c, a), Math.max(c, a)]]) {
      const key = `${e1},${e2}`;
      const existing = edgeToFaces.get(key) ?? [];
      existing.push(fi);
      edgeToFaces.set(key, existing);
    }
  }

  const dualFaces: number[][] = [];

  // 1) Original vertices → pentagons
  for (let vi = 0; vi < ICOSAHEDRON_VERTICES.length; vi++) {
    const withOrder: { idx: number; fi: number }[] = [];
    for (let fi = 0; fi < ICOSAHEDRON_FACES.length; fi++) {
      if (ICOSAHEDRON_FACES[fi]!.includes(vi)) {
        withOrder.push({ idx: faceCenterMap.get(fi)!, fi });
      }
    }
    withOrder.sort((a, b) => a.fi - b.fi);
    dualFaces.push(withOrder.map(w => w.idx));
  }

  // 2) Face centers → hexagons
  for (let fi = 0; fi < ICOSAHEDRON_FACES.length; fi++) {
    const [ia, ib, ic] = ICOSAHEDRON_FACES[fi]!;
    const edges: [number, number, number][] = [
      [Math.min(ia, ib), Math.max(ia, ib), ic],
      [Math.min(ib, ic), Math.max(ib, ic), ia],
      [Math.min(ic, ia), Math.max(ic, ia), ib],
    ];
    const ring: number[] = [];
    for (const [e1, e2, oppositeV] of edges) {
      const key = `${e1},${e2}`;
      const adjFaces = edgeToFaces.get(key)!;
      const adjFi = adjFaces.find(f => f !== fi)!;
      ring.push(oppositeV, faceCenterMap.get(adjFi)!);
    }
    dualFaces.push(ring);
  }

  let pentagonCount = 0;
  let hexagonCount = 0;
  const triIndices: number[] = [];
  // Collect edges from polygon faces, deduplicate
  const edgeSet = new Set<string>();

  for (const face of dualFaces) {
    if (face.length === 5) pentagonCount++;
    else if (face.length === 6) hexagonCount++;
    // Fan triangulation
    for (let i = 1; i < face.length - 1; i++) {
      triIndices.push(face[0]!, face[i]!, face[i + 1]!);
    }
    // Polygon outline edges (deduplicated)
    for (let i = 0; i < face.length; i++) {
      const a = face[i]!;
      const b = face[(i + 1) % face.length]!;
      const key = Math.min(a, b) + ':' + Math.max(a, b);
      edgeSet.add(key);
    }
  }

  const positions: number[] = [];
  for (const v of vertices) {
    positions.push(v[0], v[1], v[2]);
  }

  // Convert edge set to index pairs
  const edgeIndices: number[] = [];
  for (const key of edgeSet) {
    const [a, b] = key.split(':').map(Number);
    edgeIndices.push(a!, b!);
  }

  return {
    positions,
    indices: triIndices,
    edges: edgeIndices,
    pentagonCount,
    hexagonCount,
  };
}

/**
 * Generate Goldberg polyhedron geometry.
 */
export function generateGoldberg(params: GoldbergParams): GeometryData {
  const { m, n, radius, variant } = params;
  const total = m + n;
  if (total === 0) throw new Error('m + n must be > 0');

  const mesh = buildSubdivision(m, n);

  if (variant === 'geodesic') {
    const { vertices, faceTris } = mesh;
    const positions = new Float32Array(vertices.length * 3);
    for (let i = 0; i < vertices.length; i++) {
      positions[i * 3] = vertices[i]![0] * radius;
      positions[i * 3 + 1] = vertices[i]![1] * radius;
      positions[i * 3 + 2] = vertices[i]![2] * radius;
    }
    const indices: number[] = [];
    for (const tri of faceTris) {
      indices.push(tri[0]!, tri[1]!, tri[2]!);
    }
    return {
      positions,
      indices: new Uint32Array(indices),
      edges: new Uint32Array(0),
      pentagonCount: 0,
      hexagonCount: 0,
      faceCount: faceTris.length,
      vertexCount: vertices.length,
    };
  }

  const result = buildDual(mesh);
  const positions = new Float32Array(result.positions);
  const indices = new Uint32Array(result.indices);
  const edges = new Uint32Array(result.edges);

  // Scale
  for (let i = 0; i < positions.length; i++) {
    positions[i] *= radius;
  }

  return {
    positions,
    indices,
    edges,
    pentagonCount: result.pentagonCount,
    hexagonCount: result.hexagonCount,
    faceCount: indices.length / 3,
    vertexCount: positions.length / 3,
  };
}

export const PRESETS: Record<string, GoldbergParams> = {
  'C60（富勒烯）': { m: 1, n: 1, radius: 2, variant: 'standard' },
  'C80': { m: 2, n: 0, radius: 2, variant: 'standard' },
  'C180': { m: 2, n: 1, radius: 2, variant: 'standard' },
  'C240': { m: 2, n: 2, radius: 2, variant: 'standard' },
  'C320': { m: 3, n: 1, radius: 2, variant: 'standard' },
  '测地线 (2,1)': { m: 2, n: 1, radius: 2, variant: 'geodesic' },
  '测地线 (3,2)': { m: 3, n: 2, radius: 2, variant: 'geodesic' },
};
