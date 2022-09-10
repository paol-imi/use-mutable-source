import type * as client from './client';

export const useSource: typeof client.useSource = () => {
  return [
    (getSnapshot: (source: any, snapshot: null) => any) =>
      getSnapshot(null, null),
    () => null as any,
  ] as const;
};

export const usePureSource: typeof client.usePureSource = (
  init: () => any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ...rest: any[]
) => {
  const source = init();
  return [
    (getSnapshot: (source: any, snapshot: null) => any) =>
      getSnapshot(source, null),
    source,
  ] as const;
};

export const withContract: typeof client.withContract = (source: any) => {
  return [
    (getSnapshot: (source: any, snapshot: null) => any) =>
      getSnapshot(source, null),
    source,
    null as any,
  ] as const;
};
