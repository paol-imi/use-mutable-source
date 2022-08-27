import type * as client from './client';

export const useSource: typeof client.useSource = () => {
  return [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (getSnapshot: (source: any, snapshot: null) => any, ...rest: any[]) =>
      getSnapshot(null, null),
    () => null as any,
  ] as const;
};

export const usePureSource: typeof client.usePureSource = (init: () => any) => {
  const source = init();
  return [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (getSnapshot: (source: any, snapshot: null) => any, ...rest: any[]) =>
      getSnapshot(source, null),
    source,
  ] as const;
};
