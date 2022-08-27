import { type DependencyList, useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { is } from '../../objectIs';
import { useFactory, usePureFactory } from '../../useFactory';
import { warning } from '../../warning';

/**
 * Derives a snapshot from a mutable source that is assumed local to the
 * component that is using this hook.
 *
 * @param getSnapshot - function that returns a snapshot of the source
 * @param subscribe - function to register a callback that is called whenever the source changes
 * @returns the snapshot
 */
function useSnapshot<Snapshot>(
  getSnapshot: (currentSnapshot: Snapshot | null) => Snapshot,
  subscribe: (onChange: () => void) => () => void
) {
  const getMemoizedSnapshot = useMemo(() => {
    let snapshot: Snapshot | null = null;
    return () => {
      snapshot = getSnapshot(snapshot);
      return snapshot;
    };
  }, [getSnapshot]);

  if (__DEV__) {
    // "getSnapshot" should be able to recognize that the snapshot has not
    // changed. The instability of the snapshot will likely cause an infinite
    // render loop.
    if (!is(getMemoizedSnapshot(), getMemoizedSnapshot())) {
      warning(
        `"getSnapshot" must be a pure function, and if called multiple times ` +
          `in a row, it must return the same snapshot.\n` +
          `This is necessary to avoid an infinite render loop.`
      );
    }
  }

  // Compute the snapshot using "useSyncExternalStore". We assume that the
  // snapshot is derived from local data and therefore it is predicable during
  // server side rendering.
  return useSyncExternalStore(
    subscribe,
    getMemoizedSnapshot,
    getMemoizedSnapshot
  );
}

/**
 * Generates a source, and allows to use it safely inside any component. The
 * source is re-created every time a dependency changes.
 *
 * @param init - function that generates the source, it can optionally returns also a "destroy" function
 * @param deps - dependency list that defines the source lifecycle
 * @returns an hook to derive snapshots and a function to lazily initialize the source
 */
export function useSource<Source>(
  init: () => [source: Source, destroy?: (source: Source) => void],
  deps: DependencyList = []
) {
  // Generates the source.
  const [ref, lazyInit] = useFactory(init, deps);

  /**
   * Hook that allows to derive a snapshot from the source.
   *
   * @param getSnapshot - function that returns a snapshot of the source
   * @param getSnapshotDeps - dependency list that defines the "getSnapshot" lifecycle
   * @param subscribe - function to register a callback that is called whenever the source changes
   * @param subscribeDeps - dependency list that defines the "subscribe" lifecycle
   * @returns the snapshot
   */
  const useSourceSnapshot = useCallback(
    function useSourceSnapshot<Snapshot>(
      getSnapshot: (
        source: Source | null,
        currentSnapshot: Snapshot | null
      ) => Snapshot,
      ...rest: [
        // Defines "getSnapshotDeps" as optional.
        ...getSnapshotDeps: [DependencyList?] | [],
        subscribe: (source: Source, onChange: () => void) => () => void,
        // Defines "subscribeDeps" as optional.
        ...subscribeDeps: [DependencyList?] | []
      ]
    ) {
      // Destructure the remaining arguments. Since this is a quite complex
      // scenario, Typescript is not able to make inference.
      const [getSnapshotDeps = [], subscribe, subscribeDeps = []] =
        typeof rest[0] === 'function'
          ? [undefined, rest[0], rest[1] as Exclude<typeof rest[1], Function>]
          : [rest[0], rest[1] as Extract<typeof rest[1], Function>, rest[2]];

      const memoizedSubscribe = useCallback(
        // Since we assumes that the initial snapshot is predictable
        // (every external value used by "init" should always be visible also to
        // "getSnapshot"), we do not manually call "onChange" after the source
        // has been initialized. Note that useSyncExternalStore will compare the
        // initial snapshot with the one derived from the source (and
        // eventually correct it) only if the source is not initialized here.
        // We don't care about this dual behavior since the initial snapshot
        // should always be correct.
        (onChange: () => void) => {
          if (__DEV__) {
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
          }

          return subscribe(lazyInit(), onChange);
        },
        // the "subscribe" lifecycle depends directly on "subscribeDeps".
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [lazyInit, ...subscribeDeps]
      );

      const getSourceSnapshot = useCallback(
        (currentSnapshot: Snapshot | null) =>
          getSnapshot(ref.current, currentSnapshot),
        // The linter fails to recognize that the outer scope is an hook and
        // assumes that "ref" is stable.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [ref, ...getSnapshotDeps]
      );

      return useSnapshot(getSourceSnapshot, memoizedSubscribe);
    },
    [ref, lazyInit]
  );

  // Returns [useSnapshot, lazyInit].
  return [useSourceSnapshot, lazyInit] as const;
}

/**
 * Generates a pure source, and allows to use it safely inside any component.
 * The source is re-created every time a dependency changes.
 * The source generation should be side-effect free.
 *
 * @param init - function that generates the source
 * @param deps - dependency list that define the source lifecycle
 * @returns an hook to derive snapshots and the source
 */
export function usePureSource<Source>(
  init: () => Source,
  deps: DependencyList = []
) {
  // Generates the source.
  const source = usePureFactory(init, deps);

  /**
   * Hook that allows to consume a snapshot of the source.
   *
   * @param getSnapshot - function that returns a snapshot of the source
   * @param getSnapshotDeps - dependency list that defines the "getSnapshot" lifecycle
   * @param subscribe - function to register a callback that is called whenever the source changes
   * @param subscribeDeps - dependency list that defines the "subscribe" lifecycle
   * @returns the snapshot
   */
  const useSourceSnapshot = useCallback(
    function useSourceSnapshot<Snapshot>(
      getSnapshot: (
        source: Source,
        currentSnapshot: Snapshot | null
      ) => Snapshot,
      ...rest: [
        // Defines "getSnapshotDeps" as optional.
        ...getSnapshotDeps: [DependencyList?] | [],
        subscribe: (source: Source, onChange: () => void) => () => void,
        // Defines "subscribeDeps" as optional.
        ...subscribeDeps: [DependencyList?] | []
      ]
    ) {
      // Destructure the remaining arguments. Since this is a quite complex
      // scenario, Typescript is not able to make inference.
      const [getSnapshotDeps = [], subscribe, subscribeDeps = []] =
        typeof rest[0] === 'function'
          ? [undefined, rest[0], rest[1] as Exclude<typeof rest[1], Function>]
          : [rest[0], rest[1] as Extract<typeof rest[1], Function>, rest[2]];

      const memoizedSubscribe = useCallback(
        (onChange: () => void) => subscribe(source, onChange),
        // the "subscribe" lifecycle depends directly on "subscribeDeps".
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [source, ...subscribeDeps]
      );

      const getSourceSnapshot = useCallback(
        (currentSnapshot: Snapshot | null) =>
          getSnapshot(source, currentSnapshot),
        // The linter fails to recognize that the outer scope is an hook and
        // assumes that "source" is stable.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [source, ...getSnapshotDeps]
      );

      return useSnapshot(getSourceSnapshot, memoizedSubscribe);
    },
    [source]
  );

  // Returns [useSnapshot, source].
  return [useSourceSnapshot, source] as const;
}
