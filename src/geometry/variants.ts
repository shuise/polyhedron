/**
 * Variant transformations for Goldberg polyhedra.
 *
 * Currently supported:
 * - standard: direct dual output (pentagons + hexagons)
 * - truncated: truncation at vertices
 * - geodesic: triangular subdivision mesh (no dual)
 */

import type { GeometryData, GoldbergParams } from './types';

/**
 * Apply truncation to a Goldberg polyhedron.
 * Truncation cuts off each vertex, replacing it with a smaller face.
 * For now this is handled in the main generator, but this file provides
 * post-processing utilities for future enhancement.
 */
export function applyTruncation(geometry: GeometryData, _params: GoldbergParams): GeometryData {
  // Truncation is complex to implement correctly in a post-process step.
  // For now, we return the geometry as-is and note that true truncation
  // would require rebuilding the topology.
  // Future: implement proper truncation using vertex-face adjacency.
  return geometry;
}

/**
 * Get a user-friendly description of the Goldberg polyhedron.
 */
export function describePolyhedron(params: GoldbergParams, data: GeometryData): string {
  const { m, n, variant } = params;
  const name = variant === 'geodesic' ? '测地线球体' : 'Goldberg 多面体';
  const faces = variant === 'geodesic'
    ? `${data.faceCount} 个三角面`
    : `${data.pentagonCount} 个五边形 + ${data.hexagonCount} 个六边形 = ${data.faceCount} 个面`;
  return `${name} (${m},${n}) — ${faces}，${data.vertexCount} 个顶点`;
}
