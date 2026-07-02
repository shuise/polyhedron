import { BufferGeometry } from 'three';

/**
 * Export geometry as STL (ASCII format).
 * Suitable for 3D printing.
 */
export function exportSTL(geometry: BufferGeometry, filename: string = 'polyhedron.stl'): void {
  const positions = geometry.getAttribute('position');
  const index = geometry.getIndex();
  if (!positions || !index) return;

  const verts = positions.array as Float32Array;
  const indices = index.array as Uint16Array | Uint32Array;
  const normal = geometry.getAttribute('normal');
  const normals = normal?.array as Float32Array | undefined;

  let stl = `solid goldberg_polyhedron\n`;

  for (let i = 0; i < indices.length; i += 3) {
    const ia = indices[i]! * 3;
    const ib = indices[i + 1]! * 3;
    const ic = indices[i + 2]! * 3;

    // Face normal
    let nx = 0, ny = 0, nz = 1;
    if (normals) {
      const ni = indices[i]! * 3;
      nx = normals[ni]!;
      ny = normals[ni + 1]!;
      nz = normals[ni + 2]!;
    } else {
      // Compute face normal
      const ax = verts[ib]! - verts[ia]!, ay = verts[ib + 1]! - verts[ia + 1]!, az = verts[ib + 2]! - verts[ia + 2]!;
      const bx = verts[ic]! - verts[ia]!, by = verts[ic + 1]! - verts[ia + 1]!, bz = verts[ic + 2]! - verts[ia + 2]!;
      nx = ay * bz - az * by;
      ny = az * bx - ax * bz;
      nz = ax * by - ay * bx;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 0) { nx /= len; ny /= len; nz /= len; }
    }

    stl += `  facet normal ${nx} ${ny} ${nz}\n`;
    stl += `    outer loop\n`;
    stl += `      vertex ${verts[ia]!} ${verts[ia + 1]!} ${verts[ia + 2]!}\n`;
    stl += `      vertex ${verts[ib]!} ${verts[ib + 1]!} ${verts[ib + 2]!}\n`;
    stl += `      vertex ${verts[ic]!} ${verts[ic + 1]!} ${verts[ic + 2]!}\n`;
    stl += `    endloop\n`;
    stl += `  endfacet\n`;
  }

  stl += `endsolid goldberg_polyhedron\n`;

  downloadTextFile(stl, filename, 'application/vnd.ms-pki.stl');
}

/**
 * Export geometry as OBJ format.
 */
export function exportOBJ(geometry: BufferGeometry, filename: string = 'polyhedron.obj'): void {
  const positions = geometry.getAttribute('position');
  const index = geometry.getIndex();
  if (!positions || !index) return;

  const verts = positions.array as Float32Array;
  const indices = index.array as Uint16Array | Uint32Array;
  const normal = geometry.getAttribute('normal');

  let obj = `# Goldberg 多面体\n# 由 3d-ball 生成\n\ng goldberg_polyhedron\n`;

  // Vertices
  for (let i = 0; i < verts.length; i += 3) {
    obj += `v ${verts[i]!} ${verts[i + 1]!} ${verts[i + 2]!}\n`;
  }

  // Normals
  if (normal) {
    const norms = normal.array as Float32Array;
    for (let i = 0; i < norms.length; i += 3) {
      obj += `vn ${norms[i]!} ${norms[i + 1]!} ${norms[i + 2]!}\n`;
    }
  }

  obj += `s 1\n`;

  // Faces
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i]! + 1;
    const b = indices[i + 1]! + 1;
    const c = indices[i + 2]! + 1;
    if (normal) {
      obj += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
    } else {
      obj += `f ${a} ${b} ${c}\n`;
    }
  }

  downloadTextFile(obj, filename, 'application/obj');
}

function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getExportFilename(params: { m: number; n: number; variant: string }, extension: string): string {
  const { m, n, variant } = params;
  const variantLabel = variant === 'standard' ? '' : `_${variant}`;
  return `goldberg_${m}_${n}${variantLabel}.${extension}`;
}
