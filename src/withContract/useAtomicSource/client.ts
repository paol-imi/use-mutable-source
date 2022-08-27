import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { is } from '../../objectIs';
import { useFactory, usePureFactory } from '../../useFactory';
import { warning } from '../../warning';
import { Slice } from '../slice';

/**
 * Derives a snapshot from a mutable source that is assumed local to the
 * component that is using this hook. The snapshot is considered atomic.
 * "getSnapshot" should be static (dynamic values won't be taken into account).
 *
 * @param getSnapshot - function that returns an immutable atomic snapshot of the source
 * @param slice - the slice of state represented by the snapshot
 * @returns the snapshot
 */
export function useSnapshot<Snapshot>(
  getSnapshot: (currentSnapshot: Snapshot | null) => Snapshot,
  slice: Slice
) {
  const [snapshot, setSnapshot] = useState(() => getSnapshot(null));

  // Store the versions seen during rendering.
  const initialVersion = slice.version;

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

  useLayoutEffect(() => {
    // Until we are not subscribed, we cannot intercept updates in layout
    // effects, but it's critical that those updates run with the highest
    // priority. Each update is assumed with high priority until we are
    // subscribed.
    if (initialVersion !== slice.version) {
      setSnapshot(getSnapshot);
    }

    return slice.subscribe(() => setSnapshot(getSnapshot));
    // "getSnapshot" is considered stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slice]);

  return snapshot;
}

/**
 * Generates a source, and allows to use it safely inside any component.
 *
 * @param init - function that generates the source, it can optionally returns also a "destroy" function
 * @param getSnapshot - function that returns an immutable atomic snapshot of the source
 * @param contract - function to register a callback that is called whenever the source changes
 * @returns the snapshot and a function to lazily initialize the source
 */
export function useSource<Source, Snapshot>(
  init: () => [source: Source, destroy?: (source: Source) => void],
  contract: (source: Source, onChange: () => void) => void | (() => void),
  getSnapshot: (
    source: Source | null,
    currentSnapshot: Snapshot | null
  ) => Snapshot
) {
  const slice = useMemo(() => new Slice(), []);
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
  }, []);

  const snapshot = useSnapshot<Snapshot>(
    (currentSnapshot) => getSnapshot(ref.current, currentSnapshot),
    slice
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

  // Returns [snapshot, lazyInit].
  return [snapshot, lazyInit] as const;
}

/**
 * Generates a pure source, and allows to use it safely inside any component.
 * The source is re-created every time a dependency changes.
 * The source generation and the contract should be side-effect free.
 * After the contract is signed, the source should be garbage collectable.
 *
 * @param init - function that generates the source
 * @param getSnapshot - function that returns an immutable atomic snapshot of the source
 * @param contract - function to register a callback that is called whenever the source changes
 * @returns the snapshot and the source
 */
export function usePureSource<Source, Snapshot>(
  init: () => Source,
  contract: (source: Source, onChange: () => void) => void,
  getSnapshot: (source: Source, currentSnapshot: Snapshot | null) => Snapshot
) {
  // Generates the source.
  const slice = useMemo(() => new Slice(), []);
  // Generates the source.
  const source = usePureFactory(() => {
    const source = init();
    // Subscribes the slice to updates.
    contract(source, slice.update);
    return source;
  }, []);

  const snapshot = useSnapshot<Snapshot>(
    (currentSnapshot) => getSnapshot(source, currentSnapshot),
    slice
  );

  // Returns [snapshot, source].
  return [snapshot, source] as const;
}
