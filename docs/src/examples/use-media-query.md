# useMediaQuery

This example shows how to create a custom hook to use [media queries](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia).

[![Open in CodeSandbox](https://img.shields.io/badge/Open_in_CodeSandbox-3178C6?style=for-the-badge&logo=CodeSandbox&color=black&labelColor=black)](https://codesandbox.io/s/use-mutable-source-use-media-query-t455rx?file=/src/App.tsx)

```tsx
import { usePureSource } from 'use-mutable-source';

function useMediaQuery(mediaQuery: string) {
  const [useSnapshot] = usePureSource(
    // Generates the mediaQueryList.
    () => window.matchMedia(mediaQuery),
    // Generates a new mediaQueryList when the query changes.
    [mediaQuery]
  );

  return useSnapshot(
    // Derives the snapshot.
    (mediaQueryList) => mediaQueryList.matches,
    // Handles the subscription.
    (mediaQueryList, onChange) => {
      // Subscribe to changes.
      mediaQueryList.addEventListener('change', onChange);
      // Returns a callback to unsubscribe.
      return () => mediaQueryList.removeEventListener('change', onChange);
    }
  );
}
```
