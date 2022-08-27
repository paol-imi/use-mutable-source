import {
  type DependencyList,
  useCallback,
  useLayoutEffect,
  useState,
} from 'react';
import { is } from '../../objectIs';
import { useFactory, usePureFactory } from '../../useFactory';
import { warning } from '../../warning';

/**
 * Derives a snapshot from a mutable source that is assumed local to the
 * component that is using this hook. The snapshot is considered atomic.
 * "getSnapshot" should be static (dynamic values won't be taken into account).
 *
 * @param getSnapshot - function that returns an immutable atomic snapshot of the source
 * @param subscribe - function to register a callback that is called whenever the source changes
 * @returns the snapshot
 */
function useSnapshot<Snapshot>(
  getSnapshot: (currentSnapshot: Snapshot | null) => Snapshot,
  subscribe: (onChange: () => void) => () => void
) {
  const [snapshot, setSnapshot] = useState(() => getSnapshot(null));

  // TODO: is it enough to require "getSnapshot" to not be dynamic as a
  // constraint, or should we actually enforce it with useCallback?
  // eslint-disable-next-line react-hooks/exhaustive-deps
  getSnapshot = useCallback(getSnapshot, []);

  // TODO: since setState does not always bail-out when the state is unchanged,
  // we could use useEvent (or a shim) and manually check for changes.
  // @example
  // const onChange = useEvent(() => {
  //   if (!is(snapshot, getSnapshot(snapshot))) setSnapshot(getSnapshot);
  // });

  useLayoutEffect(
    () => {
      // Until we are not subscribed, we cannot intercept updates in layout
      // effects, but it's critical that those updates run with the highest
      // priority. Each update is assumed with high priority until we are
      // subscribed.
      if (!is(snapshot, getSnapshot(snapshot))) setSnapshot(getSnapshot);

      return subscribe(() => setSnapshot(getSnapshot));
    },
    // "getSnapshot" is considered stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subscribe]
  );

  return snapshot;
}

/**
 * Generates a source, and allows to use it safely inside any component.
 *
 * @param init - function that generates the source, it can optionally returns also a "destroy" function
 * @param getSnapshot - function that returns an immutable atomic snapshot of the source
 * @param subscribe - function to register a callback that is called whenever the source changes
 * @param subscribeDeps - dependency list that defines the "subscribe" lifecycle
 * @returns the snapshot and a function to lazily initialize the source
 */
export function useSource<Source, Snapshot>(
  init: () => [source: Source, destroy?: (source: Source) => void],
  getSnapshot: (
    source: Source | null,
    currentSnapshot: Snapshot | null
  ) => Snapshot,
  subscribe: (source: Source, onChange: () => void) => () => void,
  subscribeDeps: DependencyList = []
) {
  // Generates the source.
  const [ref, lazyInit] = useFactory(init, []);

  const memoizedSubscribe = useCallback(
    // We assumes that the initial snapshot is predictable (every external value
    // used by "init" should always be visible also to "getSnapshot"). Anyway,
    // useSyncExternalStore will always compare the initial snapshot with the
    // one derived from the source and correct it in case of mismatch.
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
    // The source is always stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    subscribeDeps
  );

  // Computes the snapshot.
  const snapshot = useSnapshot<Snapshot>(
    (currentSnapshot) => getSnapshot(ref.current, currentSnapshot),
    memoizedSubscribe
  );

  // Returns [snapshot, lazyInit].
  return [snapshot, lazyInit] as const;
}

/**
 * Generates a pure source, and allows to use it safely inside any component.
 * The source generation should be side-effect free.
 *
 * @param init - function that generates the source
 * @param getSnapshot - function that returns an immutable atomic snapshot of the source
 * @param subscribe - function to register a callback that is called whenever the source changes
 * @returns the snapshot and the source
 */
export function usePureSource<Source, Snapshot>(
  init: () => Source,
  getSnapshot: (source: Source, currentSnapshot: Snapshot | null) => Snapshot,
  subscribe: (source: Source, onChange: () => void) => () => void,
  subscribeDeps: DependencyList = []
) {
  // Generates the source.
  const source = usePureFactory(init, []);

  const memoizedSubscribe = useCallback(
    (onChange: () => void) => subscribe(source, onChange),
    // the "subscribe" lifecycle depends directly on "subscribeDeps".
    // The source is always stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    subscribeDeps
  );

  // Computes the snapshot.
  const snapshot = useSnapshot<Snapshot>(
    (currentSnapshot) => getSnapshot(source, currentSnapshot),
    memoizedSubscribe
  );

  // Returns [snapshot, source].
  return [snapshot, source] as const;
}
