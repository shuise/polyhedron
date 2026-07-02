import { useState, useEffect, useRef } from 'react';
import { useControls, folder, button } from 'leva';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import Scene from './components/Scene';
import { useGoldberg } from './hooks/useGoldberg';
import { exportSTL, exportOBJ, getExportFilename } from './utils/export';
import type { GoldbergParams, GoldbergVariant } from './geometry/types';
import { generateGoldberg, PRESETS } from './geometry/goldberg';

const DETAIL_LEVELS: { m: number; n: number; label: string }[] = [
  { m: 0, n: 1, label: '最小 (32面)' },
  { m: 1, n: 1, label: '简单 (92面)' },
  { m: 2, n: 0, label: '较低 (122面)' },
  { m: 2, n: 1, label: '中等 (182面)' },
  { m: 2, n: 2, label: '较高 (272面)' },
  { m: 3, n: 1, label: '丰富 (362面)' },
  { m: 3, n: 2, label: '详细 (452面)' },
  { m: 3, n: 3, label: '非常详细 (632面)' },
  { m: 4, n: 3, label: '极致 (902面)' },
];

function mnToDetailLevel(m: number, n: number): number {
  for (let i = 0; i < DETAIL_LEVELS.length; i++) {
    if (DETAIL_LEVELS[i]!.m === m && DETAIL_LEVELS[i]!.n === n) return i;
  }
  return -1;
}

function geometryFromParams(params: GoldbergParams): BufferGeometry {
  const data = generateGoldberg(params);
  const geom = new BufferGeometry();
  geom.setAttribute('position', new Float32BufferAttribute(data.positions, 3));
  geom.setIndex(Array.from(data.indices));
  geom.computeVertexNormals();
  return geom;
}

export default function App() {
  const { params, data, presetName, description, renderKey, updateParams, setPreset } = useGoldberg();
  const presetKeys = Object.keys(PRESETS);
  const [detailLevel, setDetailLevel] = useState<number>(mnToDetailLevel(params.m, params.n));

  // Use ref to avoid stale closure in leva factory
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const exportSTLRef = useRef(() => {
    const p = paramsRef.current;
    const geom = geometryFromParams(p);
    exportSTL(geom, getExportFilename(p, 'stl'));
    geom.dispose();
  });

  const exportOBJRef = useRef(() => {
    const p = paramsRef.current;
    const geom = geometryFromParams(p);
    exportOBJ(geom, getExportFilename(p, 'obj'));
    geom.dispose();
  });

  // Stable leva scheme — factory form with [] deps means it never recreates
  const [levaValues, setLeva] = useControls(() => ({
    '多面体': folder({
      detailLevel: {
        label: '详细程度',
        value: 1,
        min: 0,
        max: DETAIL_LEVELS.length - 1,
        step: 1,
        onChange: (val: number) => {
          setDetailLevel(val);
          const level = DETAIL_LEVELS[val]!;
          updateParams({ m: level.m, n: level.n });
        },
      },
      m: {
        value: 1, min: 0, max: 10, step: 1,
        onChange: (val: number) => {
          setDetailLevel(-1);
          updateParams({ m: val });
        },
      },
      n: {
        value: 1, min: 0, max: 10, step: 1,
        onChange: (val: number) => {
          setDetailLevel(-1);
          updateParams({ n: val });
        },
      },
      radius: {
        label: '半径', value: 2, min: 0.5, max: 5, step: 0.1,
        onChange: (val: number) => updateParams({ radius: val }),
      },
      variant: {
        label: '变体', value: 'standard',
        options: { '标准': 'standard', '截角': 'truncated', '测地线': 'geodesic' },
        onChange: (val: string) => updateParams({ variant: val as GoldbergVariant }),
      },
    }),
    '外观': folder({
      color: { label: '颜色', value: '#4a9eff' },
      opacity: { label: '不透明度', value: 0.85, min: 0, max: 1, step: 0.01 },
      wireframeColor: { label: '线框颜色', value: '#222222' },
      showEdges: { label: '显示边缘', value: true },
      displayMode: {
        label: '显示模式', value: 'solid',
        options: { '实体': 'solid', '线框': 'wireframe', '半透明': 'transparent' },
      },
    }),
    '场景': folder({
      showGrid: { label: '显示网格', value: true },
      showAxes: { label: '显示坐标轴', value: true },
    }),
    '导出': folder({
      '导出 STL': button(() => exportSTLRef.current()),
      '导出 OBJ': button(() => exportOBJRef.current()),
    }),
  }), []);

  // Sync leva values when params change from external sources (preset, detailLevel)
  useEffect(() => {
    (setLeva as any)({ m: params.m, n: params.n, radius: params.radius, variant: params.variant, detailLevel: Math.max(0, detailLevel) });
  }, [params, detailLevel]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') return;
    setPreset(val);
    const p = PRESETS[val]!;
    setDetailLevel(mnToDetailLevel(p.m, p.n));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        background: 'rgba(0,0,0,0.6)',
        color: '#ccc',
        padding: '4px 16px',
        borderRadius: 4,
        fontSize: 13,
        fontFamily: 'monospace',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        pointerEvents: 'auto',
      }}>
        <select
          value={presetName ?? '__custom__'}
          onChange={handlePresetChange}
          style={{
            background: 'transparent',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: 3,
            padding: '2px 6px',
            fontSize: 12,
            fontFamily: 'monospace',
            cursor: 'pointer',
          }}
        >
          <option value="__custom__">自定义</option>
          {presetKeys.map(key => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
        <span>{description}</span>
      </div>
      <Scene
        data={data}
        renderKey={renderKey}
        color={levaValues.color}
        opacity={levaValues.opacity}
        wireframeColor={levaValues.wireframeColor}
        showEdges={levaValues.showEdges}
        displayMode={levaValues.displayMode as 'solid' | 'wireframe' | 'transparent'}
        showGrid={levaValues.showGrid}
        showAxes={levaValues.showAxes}
      />
    </div>
  );
}
