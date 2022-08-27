import { type DependencyList, useCallback, useMemo, useEffect } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { is } from '../../objectIs';
import { useFactory, usePureFactory } from '../../useFactory';
import { warning } from '../../warning';
import { Slice } from '../slice';

/**
 * Derives a snapshot from a mutable source that is assumed local to the
 * component that is using this hook.
 *
 * @param getSnapshot - function that returns an immutable snapshot of the source
 * @param slice - the slice of state represented by the snapshot
 * @returns the snapshot
 */
function useSnapshot<Snapshot>(
  getSnapshot: (currentSnapshot: Snapshot | null) => Snapshot,
  slice: Slice
) {
  const subscribe = useCallback(
    (onChange: () => void) => slice.subscribe(onChange),
    [slice]
  );

  // We store the reference of the snapshot and its version inside a memo.
  const ref = useMemo(
    () => ({
      // Initial version.
      lastReadVersion: slice.version,
      // The snapshot is firstly computed here.
      snapshot: getSnapshot(null),
      // Memoized snapshot getter.
      getter: () => {
        // If a version has changed from the last read.
        if (ref.lastReadVersion !== slice.version) {
          // Updates the snapshot.
          ref.snapshot = getSnapshot(ref.snapshot);
          // Updates the last read versions.
          ref.lastReadVersion = slice.version;
        }

        return ref.snapshot;
      },
    }),
    [getSnapshot, slice]
  );

  // Compute the snapshot using "useSyncExternalStore". We assume that the
  // snapshot is derived from local data and therefore it is predicable during
  // server side rendering.
  return useSyncExternalStore(subscribe, ref.getter, ref.getter);
}

/**
 * Generates a source, and allows to use it safely inside any component. The
 * source is re-created every time a dependency changes.
 *
 * @param init - function that generates the source, it can optionally returns also a "destroy" function
 * @param deps - dependency list that define the source lifecycle
 * @param contract - function to register a callback that is called whenever the source changes
 * @returns an hook to derive snapshots and a function to lazily initialize the source
 */
export function useSource<Source>(
  init: () => [source: Source, destroy?: (source: Source) => void],
  ...rest: [
    // Defines "deps" as optional.
    ...deps: [DependencyList?] | [],
    contract: (source: Source, onChange: () => void) => void | (() => void)
  ]
) {
  // Destructure the remaining arguments.
  const [deps = [], contract] = rest.length === 1 ? [[], rest[0]] : rest;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const slice = useMemo(() => new Slice(), deps);
  // Generates the source.
  const [ref, lazyInit] = useFactory(() => {
    const [source, destroy] = init();
    // Subscribes the slice to updates.
    const unsubscribe = contract(source, slice.update);
    // Returns [source, destroy].
    return [
      source,
      () => {
        unsubscribe?.();
        destroy?.(source);
      },
    ];
  }, deps);

  /**
   * Hook that allows to consume a snapshot of the source.
   *
   * @param getSnapshot - function that returns a snapshot of the source
   * @param getSnapshotDeps - dependency list that defines the "getSnapshot" lifecycle
   * @returns the snapshot
   */
  const useSourceSnapshot = useCallback(
    function useSourceSnapshot<Snapshot>(
      getSnapshot: (
        source: Source | null,
        currentSnapshot: Snapshot | null
      ) => Snapshot,
      getSnapshotDeps: DependencyList = []
    ) {
      const getSourceSnapshot = useCallback(
        (currentSnapshot: Snapshot | null) =>
          getSnapshot(ref.current, currentSnapshot),
        // The linter fails to recognize that the outer scope is an hook and
        // assumes that "ref" is stable.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [ref, ...getSnapshotDeps]
      );

      if (__DEV__) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          // Every time the initial snapshot doesn't match the derived one,
          // we show a warning.
          const fallback = getSnapshot(null, null);
          const snapshot = getSnapshot(lazyInit(), fallback);
          if (!is(fallback, snapshot)) {
            warning(
              `The initial snapshot (derived when the source was not yet ` +
                `created) is different from the snapshot derived from the ` +
                `source. This will force a new render and may hurt performance.\n` +
                `Initial snapshot: ${JSON.stringify(fallback, null, 2)}\n ` +
                `Actual snapshot: ${JSON.stringify(snapshot, null, 2)}`
            );
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);
      }

      return useSnapshot(getSourceSnapshot, slice);
    },
    [lazyInit, ref, slice]
  );

  // This overload returns [useSnapshot, lazyInit].
  return [useSourceSnapshot, lazyInit] as const;
}

/**
 * Generates a pure source, and allows to use it safely inside any component.
 * The source is re-created every time a dependency changes.
 * The source generation and the contract should be side-effect free.
 * After the contract is signed, the source should be garbage collectable.
 *
 * @param init - function that generates the source
 * @param deps - dependency list that define the source lifecycle
 * @param contract - function to register a callback that is called whenever the source changes
 * @returns an hook to derive snapshots and the source
 */
export function usePureSource<Source>(
  init: () => Source,
  ...rest: [
    // Defines "deps" as optional.
    ...deps: [DependencyList?] | [],
    contract: (source: Source, onChange: () => void) => void
  ]
) {
  // Destructure the remaining arguments.
  const [deps = [], contract] = rest.length === 1 ? [[], rest[0]] : rest;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const slice = useMemo(() => new Slice(), deps);
  // Generates the source.
  const source = usePureFactory(() => {
    const source = init();
    // Subscribes the slice to updates.
    contract(source, slice.update);
    return source;
  }, deps);

  /**
   * Hook that allows to consume a snapshot of the source.
   *
   * @param getSnapshot - function that returns a snapshot of the source
   * @param getSnapshotDeps - dependency list that defines the "getSnapshot" lifecycle
   * @returns the snapshot
   */
  const useSourceSnapshot = useCallback(
    function useSourceSnapshot<Snapshot>(
      getSnapshot: (
        source: Source,
        currentSnapshot: Snapshot | null
      ) => Snapshot,
      getSnapshotDeps: DependencyList = []
    ) {
      const getSourceSnapshot = useCallback(
        (currentSnapshot: Snapshot | null) =>
          getSnapshot(source, currentSnapshot),
        // The linter fails to recognize that the outer scope is an hook.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [source, ...getSnapshotDeps]
      );

      return useSnapshot(getSourceSnapshot, slice);
    },
    [source, slice]
  );

  // This overload returns [useSnapshot, source].
  return [useSourceSnapshot, source] as const;
}
