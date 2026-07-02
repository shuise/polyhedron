import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import GoldbergPolyhedron from './GoldbergPolyhedron';
import type { GoldbergParams } from '../geometry/types';

interface Props {
  params: GoldbergParams;
  color: string;
  opacity: number;
  wireframeColor: string;
  showEdges: boolean;
  displayMode: 'solid' | 'wireframe' | 'transparent';
  showGrid: boolean;
  showAxes: boolean;
}

export default function Scene({ params, color, opacity, wireframeColor, showEdges, displayMode, showGrid, showAxes }: Props) {
  return (
    <Canvas
      camera={{ position: [4, 3, 5], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, 3, -5]} intensity={0.3} />

      <GoldbergPolyhedron
        params={params}
        color={color}
        opacity={opacity}
        wireframeColor={wireframeColor}
        showEdges={showEdges}
        displayMode={displayMode}
      />

      {showGrid && <Grid args={[10, 10]} />}
      {showAxes && <axesHelper args={[3]} />}

      <OrbitControls enableDamping dampingFactor={0.1} />
      <Environment preset="studio" />
    </Canvas>
  );
}
