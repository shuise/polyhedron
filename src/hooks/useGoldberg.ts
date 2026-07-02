import { useState, useCallback, useMemo } from 'react';
import type { GoldbergParams } from '../geometry/types';
import { generateGoldberg, PRESETS } from '../geometry/goldberg';
import { describePolyhedron } from '../geometry/variants';
import type { GeometryData } from '../geometry/types';

export function useGoldberg() {
  const [data, setData] = useState<GeometryData>(() => generateGoldberg({ m: 1, n: 1, radius: 2, variant: 'standard' }));
  const [params, setParams] = useState<GoldbergParams>({ m: 1, n: 1, radius: 2, variant: 'standard' });
  const [presetName, setPresetName] = useState<string | null>('C60（富勒烯）');
  const [renderKey, setRenderKey] = useState(0);

  const updateParams = useCallback((partial: Partial<GoldbergParams>) => {
    setParams(prev => {
      const newParams = { ...prev, ...partial };
      setData(generateGoldberg(newParams));
      setPresetName(null);
      setRenderKey(k => k + 1);
      return newParams;
    });
  }, []);

  const setPreset = useCallback((name: string) => {
    const preset = PRESETS[name];
    if (preset) {
      setPresetName(name);
      setParams({ ...preset });
      setData(generateGoldberg(preset));
      setRenderKey(k => k + 1);
    }
  }, []);

  const description = useMemo(() => {
    return describePolyhedron(params, data);
  }, [params, data]);

  return {
    params,
    presetName,
    data,
    description,
    renderKey,
    updateParams,
    setPreset,
  };
}
