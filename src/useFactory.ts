import { type DependencyList, useEffect, useMemo } from 'react';
import { isRendering } from './isRendering';
import { warning } from './warning';

/**
 * Generates a source. This process is considered with side-effects and runs
 * every time a dependency changes.
 *
 * @param init - function that generates the source, it can optionally returns also a destroy function
 * @param deps - dependency list that defines the source lifecycle
 * @returns the source ref and a function to lazily initialize the source
 */
export function useFactory<Source>(
  init: () => [source: Source, destroy?: (source: Source) => void],
  deps: DependencyList
) {
  // The local ref is computed inside useMemo instead of useRef, so that the
  // ref is not shared between different renders using different dependencies.
  // This means that "ref.current" is safe to read, it can never be a stale
  // source of previous renders.
  const [ref, lazyInit] = useMemo(
    () => [
      { current: null } as
        | { current: null; destroy?: never }
        | { current: Source; destroy?: (source: Source) => void },
      () => {
        if (__DEV__) {
          if (isRendering()) {
            // TODO: In future we may want to throw an error instead, by wrapping
            // this function inside useEvent (https://github.com/reactjs/rfcs/pull/220).
            // For now, we can only establish that React is rendering if we are
            // in a development environment, so we aren't able to throw an error
            // in production.
            warning(
              `It looks like you are attempting to read a source during render. ` +
                `Since the source would be lazily instantiated, causing ` +
                `side-effects, it cannot be used on render.\n` +
                `If the initialization of the source is side-effects free ` +
                `please use "usePureSource" instead.`
            );
          }
        }

        // Initializes the source only one time.
        // It is safe to read the source since the stability of this function
        // and the ref are related to the same dependencies.
        if (ref.current === null) {
          [ref.current, ref.destroy] = init();
        }

        return ref.current;
      },
    ],
    // The source lifecycle depends directly on "deps".
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useEffect(() => {
    // The source is initialized even if it is not used initially.
    lazyInit();

    return () => {
      ref.destroy?.(ref.current);
      // We must be resilient to the component reusing the memoized ref
      // (e.g. while Offscreen), so the source ref is cleared.
      ref.current = null;
    };
  }, [ref, lazyInit]);

  // Returns the tuple [ref, lazyInit].
  return [ref, lazyInit] as const;
}

/**
 * Generates a pure source. This process is considered side-effects free and
 * runs every time a dependency changes.
 *
 * @param init - function that generates the pure source
 * @param deps - dependency list that defines the source lifecycle
 * @returns the source
 */
export const usePureFactory: <Source>(
  init: () => Source,
  deps: DependencyList
) => Source = useMemo;
