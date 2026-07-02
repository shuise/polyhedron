import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, DoubleSide, FrontSide } from 'three';
import type { GeometryData } from '../geometry/types';

interface Props {
  data: GeometryData;
  color: string;
  opacity: number;
  wireframeColor: string;
  showEdges: boolean;
  displayMode: 'solid' | 'wireframe' | 'transparent';
}

export default function GoldbergPolyhedron({ data, color, opacity, wireframeColor, showEdges, displayMode }: Props) {
  const geometry = useMemo(() => {
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(data.positions, 3));
    geom.setIndex(Array.from(data.indices));
    geom.computeVertexNormals();
    return geom;
  }, [data]);

  const edgesGeom = useMemo(() => {
    if (!showEdges || data.edges.length === 0) return null;
    const eGeom = new BufferGeometry();
    eGeom.setAttribute('position', new Float32BufferAttribute(data.positions, 3));
    eGeom.setIndex(Array.from(data.edges));
    return eGeom;
  }, [data, showEdges]);

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
