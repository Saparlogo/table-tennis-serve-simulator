import { useState, useCallback, useMemo } from 'react';
import { simulate } from '../physics/BallPhysics';
import type { SimulationParams, SimulationResult } from '../types/physics';

const defaultParams: SimulationParams = {
  speed: 12,
  verticalAngle: 12,
  horizontalAngle: 0,
  topSpin: 2000,
  sideSpin: 0,
  racketAngle: 45,
};

export function useSimulation() {
  const [params, setParams] = useState<SimulationParams>(defaultParams);

  const result: SimulationResult = useMemo(() => {
    return simulate(params);
  }, [params]);

  const updateParam = useCallback(<K extends keyof SimulationParams>(
    key: K,
    value: SimulationParams[K]
  ) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setParams(defaultParams);
  }, []);

  return { params, result, updateParam, reset };
}
