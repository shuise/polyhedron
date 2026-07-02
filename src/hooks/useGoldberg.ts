import { useState, useCallback, useMemo } from 'react';
import type { GoldbergParams } from '../geometry/types';
import { generateGoldberg, PRESETS } from '../geometry/goldberg';
import { describePolyhedron } from '../geometry/variants';
import type { GeometryData } from '../geometry/types';

interface GoldbergState {
  params: GoldbergParams;
  presetName: string | null;
  data: GeometryData | null;
}

export function useGoldberg() {
  const [state, setState] = useState<GoldbergState>({
    params: { m: 1, n: 1, radius: 2, variant: 'standard' },
    presetName: 'C60（富勒烯）',
    data: null,
  });

  const updateParams = useCallback((partial: Partial<GoldbergParams>) => {
    setState(prev => {
      const newParams = { ...prev.params, ...partial };
      const data = generateGoldberg(newParams);
      return { params: newParams, presetName: null, data };
    });
  }, []);

  const setPreset = useCallback((name: string) => {
    const preset = PRESETS[name];
    if (preset) {
      const data = generateGoldberg(preset);
      setState({ params: { ...preset }, presetName: name, data });
    }
  }, []);

  const description = useMemo(() => {
    if (!state.data) return '';
    return describePolyhedron(state.params, state.data);
  }, [state]);

  return {
    params: state.params,
    presetName: state.presetName,
    data: state.data,
    description,
    updateParams,
    setPreset,
  };
}
