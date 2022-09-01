# GSAP

This example shows how to integrate [GSAP](https://greensock.com/gsap/) with your React app.

[![Edit use-mutable-source-gsap](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/use-mutable-source-gsap-e3h02g)

<iframe src="https://codesandbox.io/embed/use-mutable-source-gsap-e3h02g?autoresize=1&codemirror=1&fontsize=14&hidenavigation=1&theme=light&view=preview&hidedevtools=1"
     style="width:100%; height:200px; border:0; border-radius: 4px; overflow:hidden; border: 1px solid #242424;"
     title="use-mutable-source-gsap"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>

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
    // we can rely on "autoplay" to determine if it will be active when the
    // component will mount.
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
