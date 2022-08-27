# GSAP

This example shows how to integrate [GSAP](https://greensock.com/gsap/) with your React app.

[![Open in CodeSandbox](https://img.shields.io/badge/Open_in_CodeSandbox-3178C6?style=for-the-badge&logo=CodeSandbox&color=black&labelColor=black)](https://codesandbox.io/s/use-mutable-source-gsap-e3h02g?file=/src/App.tsx)

```tsx
import { useRef } from 'react';
import { useSource } from 'use-mutable-source';
import gsap from 'gsap';

export default function App({ autoplay = true }) {
  // Defines a reference to the element.
  const ref = useRef<HTMLDivElement>(null);
  // useSource will manage the tween lifecycle.
  const [useSnapshot, getTween] = useSource(() => [
    // Generates the Tween.
    gsap.to(ref.current, {
      x: gsap.utils.random(0, 370, 10, true),
      duration: 0.7,
      paused: !autoplay,
      immediateRender: true,
    }),
    // Destroys the Tween.
    (tween) => tween.kill(),
  ]);

  const isActive = useSnapshot(
    // Derives the snapshot. If the Animation has not yet been created,
    // we can rely on "autoplay" to determine if the animation is playing.
    (tween) => (tween ? tween.isActive() : autoplay),
    // Handles the subscription.
    (tween, onChange) => {
      // Subscribe to all events.
      tween.eventCallback('onStart', onChange);
      tween.eventCallback('onComplete', onChange);

      return () => {
        // Unsubscribes from all events.
        tween.eventCallback('onStart', null);
        tween.eventCallback('onComplete', null);
      };
    }
  );

  // Plays the animation.
  const toggle = () => {
    getTween().invalidate();
    getTween().restart();
  };

  return (
    <>
      <button onClick={toggle}>Move randomly</button>
      <div className="container">
        <div className="box" ref={ref}>
          {isActive ? 'Wooo!' : 'Animate me!'}
        </div>
      </div>
    </>
  );
}
```
