import React from 'react';

/**
 * In __DEV__, React exposes some internals and it's possible do determine if a
 * component is rendering. This method should be called only in __DEV__ environments.
 *
 * @returns A Boolean representing if React is rendering, always false outside __DEV__ environments
 */
export function isRendering() {
  try {
    return (
      // I hope no one gets fired for this 🙃.
      (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .ReactCurrentOwner.current !== null
    );
  } catch (err) {
    return false;
  }
}
