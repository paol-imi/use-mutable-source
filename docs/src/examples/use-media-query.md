# useMediaQuery

This example shows how to create a custom hook to use [media queries](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia).

[![Edit use-mutable-source-gsap](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/use-mutable-source-use-media-query-t455rx)

<iframe src="https://codesandbox.io/embed/use-mutable-source-use-media-query-t455rx?autoresize=1&codemirror=1&fontsize=14&hidenavigation=1&theme=light&view=preview&hidedevtools=1"
     style="width:100%; height:200px; border:0; border-radius: 4px; overflow:hidden; border: 1px solid #242424;"
     title="use-mutable-source-gsap"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>

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
