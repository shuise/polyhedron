import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, DoubleSide, FrontSide } from 'three';
import { generateGoldberg } from '../geometry/goldberg';
import type { GoldbergParams } from '../geometry/types';

interface Props {
  params: GoldbergParams;
  color: string;
  opacity: number;
  wireframeColor: string;
  showEdges: boolean;
  displayMode: 'solid' | 'wireframe' | 'transparent';
}

export default function GoldbergPolyhedron({ params, color, opacity, wireframeColor, showEdges, displayMode }: Props) {
  const { geometry, edgesGeom } = useMemo(() => {
    const data = generateGoldberg(params);

    // Solid mesh geometry — flat shaded for clear face visibility
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(data.positions, 3));
    geom.setIndex(Array.from(data.indices));
    geom.computeVertexNormals();
    // Convert smooth normals to flat normals per triangle for hard edges
    // Actually, flatShading: true on the material handles this, no need to modify geometry.

    // Edge geometry from dual face boundaries
    let eGeom: BufferGeometry | null = null;
    if (showEdges && data.edges.length > 0) {
      eGeom = new BufferGeometry();
      eGeom.setAttribute('position', new Float32BufferAttribute(data.positions, 3));
      eGeom.setIndex(Array.from(data.edges));
    }

    return { geometry: geom, edgesGeom: eGeom };
  }, [params, showEdges]);

  return (
    <group>
      <mesh geometry={geometry}>
        {displayMode === 'wireframe' ? (
          <meshBasicMaterial wireframe color={wireframeColor} />
        ) : (
          <meshPhysicalMaterial
            color={color}
            transparent={displayMode === 'transparent' || opacity < 1}
            opacity={opacity}
            metalness={0.05}
            roughness={0.4}
            flatShading={true}
            side={displayMode === 'transparent' ? DoubleSide : FrontSide}
          />
        )}
      </mesh>
      {edgesGeom && (
        <lineSegments geometry={edgesGeom}>
          <lineBasicMaterial color={wireframeColor} />
        </lineSegments>
      )}
    </group>
  );
}
