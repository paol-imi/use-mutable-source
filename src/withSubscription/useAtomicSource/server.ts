import type * as client from './client';

export const useSource: typeof client.useSource = (
  _: any,
  getSnapshot: (source: null, snapshot: null) => any
) => {
  return [getSnapshot(null, null), () => null as any] as const;
};

export const usePureSource: typeof client.usePureSource = (
  init: () => any,
  getSnapshot: (source: any, snapshot: null) => any
) => {
  const source = init();
  return [getSnapshot(source, null), source] as const;
};
